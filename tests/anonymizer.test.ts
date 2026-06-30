import { describe, expect, it } from "vitest";
import { addManualDetection, deanonymizeText, detectSensitiveData, sanitizeText } from "../src/anonymizer";
import type { CustomRule } from "../src/types";

describe("anonymizer", () => {
  it("detects and sanitizes common personal data", () => {
    const text = "Marie DUPONT utilise marie@example.com et 06 12 34 56 78.";
    const detections = detectSensitiveData(text, [], "accepted");
    const sanitized = sanitizeText(text, detections);
    expect(sanitized).toContain("{{PRENOM_1}}");
    expect(sanitized).toContain("{{EMAIL_1}}");
    expect(sanitized).toContain("{{TELEPHONE_1}}");
  });

  it("detects accented first names and uppercase last names separately", () => {
    const text = "Gaelle GENNEVOIS travaille a Lyon.";
    const detections = detectSensitiveData(text, [], "accepted");
    const sanitized = sanitizeText(text, detections);
    expect(sanitized).toContain("{{PRENOM_1}}");
    expect(sanitized).toContain("{{NOM_1}}");
  });

  it("detects normal-case first name and last name pairs", () => {
    const text = "Augustin Maillet";
    const detections = detectSensitiveData(text, [], "accepted");
    const sanitized = sanitizeText(text, detections);
    expect(sanitized).toBe("{{PRENOM_1}} {{NOM_1}}");
  });

  it("reuses placeholders for exact duplicates", () => {
    const text = "Contact: test@example.com puis test@example.com.";
    const detections = detectSensitiveData(text, [], "accepted");
    expect((sanitizeText(text, detections).match(/\{\{EMAIL_1\}\}/g) ?? [])).toHaveLength(2);
  });

  it("detects full API keys with internal separators", () => {
    const text = "Cle principale sk_test_8f92b3c9c1a24f10b8e1c7e4a91d99ab et secondaire api_live_XYZ-92fa7e10-4f1b-4da3-8e91-ff00123abcd0.";
    const detections = detectSensitiveData(text, [], "accepted");
    const sanitized = sanitizeText(text, detections);
    expect(sanitized).toContain("{{API_KEY_1}}");
    expect(sanitized).toContain("{{API_KEY_2}}");
    expect(sanitized).not.toContain("sk_test_");
    expect(sanitized).not.toContain("api_live_");
  });

  it("supports custom exact rules", () => {
    const rules: CustomRule[] = [{ id: "rule-1", label: "Secret", pattern: "abc-secret-123", category: "API_KEY", isRegex: false }];
    const text = "La cle est abc-secret-123.";
    expect(sanitizeText(text, detectSensitiveData(text, rules, "accepted"))).toContain("{{API_KEY_1}}");
  });

  it("supports manual detections", () => {
    const text = "Le code interne est bleu-nacelle.";
    const start = text.indexOf("bleu-nacelle");
    const detections = addManualDetection([], text, start, start + "bleu-nacelle".length, "CUSTOM");
    expect(sanitizeText(text, detections)).toBe("Le code interne est {{CUSTOM_1}}.");
  });

  it("restores known placeholders and reports unknown ones", () => {
    const text = "Marie ecrit a marie@example.com.";
    const detections = detectSensitiveData(text, [], "accepted");
    const result = deanonymizeText(sanitizeText(text, detections) + " {{EMAIL_99}}", detections);
    expect(result.restored).toContain("Marie");
    expect(result.restored).toContain("marie@example.com");
    expect(result.unknownPlaceholders).toEqual(["{{EMAIL_99}}"]);
  });
});