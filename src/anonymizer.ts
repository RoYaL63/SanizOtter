import type { CustomRule, Detection, SensitiveCategory } from "./types";

type Candidate = Omit<Detection, "id" | "placeholder" | "status"> & { priority: number };

export const categories: SensitiveCategory[] = [
  "PRENOM", "NOM", "EMAIL", "TELEPHONE", "ADRESSE", "DATE", "ENTREPRISE", "SIRET", "IBAN",
  "CB", "IP", "URL", "API_KEY", "IDENTIFIANT", "SANTE", "FINANCE", "ADMIN", "CUSTOM",
];

export const categoryLabels: Record<SensitiveCategory, string> = {
  PRENOM: "Prenom",
  NOM: "Nom",
  EMAIL: "Email",
  TELEPHONE: "Telephone",
  ADRESSE: "Adresse",
  DATE: "Date",
  ENTREPRISE: "Entreprise",
  SIRET: "SIRET",
  IBAN: "IBAN",
  CB: "Carte bancaire",
  IP: "Adresse IP",
  URL: "URL",
  API_KEY: "Cle API",
  IDENTIFIANT: "Identifiant",
  SANTE: "Sante",
  FINANCE: "Finance",
  ADMIN: "Administratif",
  CUSTOM: "Personnalise",
};

const firstNames = [
  "adam", "adrien", "alice", "amelie", "antoine", "augustin", "brieuc", "camille", "charlotte", "chloe", "claire",
  "david", "emma", "eric", "gabriel", "gael", "gaelle", "hugo", "ines", "jade", "jean", "julie",
  "lea", "leo", "louis", "lucas", "marie", "mathieu", "nicolas", "paul", "sarah", "thomas", "victor",
];

const healthTerms = ["allergie", "cancer", "diabete", "diagnostic", "handicap", "hospitalisation", "maladie", "ordonnance", "pathologie", "traitement"];
const financeTerms = ["credit", "dette", "impaye", "pret", "revenu", "salaire", "solde", "virement"];

const regexSpecs: Array<{ category: SensitiveCategory; regex: RegExp; priority: number }> = [
  { category: "EMAIL", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, priority: 120 },
  { category: "API_KEY", regex: /\b(?:sk|pk|rk|api|key|token|secret)[-_]?[A-Z0-9]{16,}\b/gi, priority: 118 },
  { category: "IBAN", regex: /\bFR\d{2}(?:[ ]?\d{4}){5}[ ]?\d{3}\b/gi, priority: 116 },
  { category: "TELEPHONE", regex: /(?:(?:\+|00)33[ .-]?[1-9]|0[1-9])(?:[ .-]?\d{2}){4}\b/g, priority: 114 },
  { category: "CB", regex: /\b(?:\d[ -]*?){13,19}\b/g, priority: 108 },
  { category: "SIRET", regex: /\b(?:SIRET|SIREN)[ :#-]*(?:\d[ ]?){9,14}\b/gi, priority: 106 },
  { category: "SIRET", regex: /\b\d{3}[ ]?\d{3}[ ]?\d{3}(?:[ ]?\d{5})?\b/g, priority: 72 },
  { category: "IP", regex: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, priority: 100 },
  { category: "URL", regex: /\bhttps?:\/\/[^\s<>"]+/gi, priority: 98 },
  { category: "DATE", regex: /\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g, priority: 86 },
  { category: "ADMIN", regex: /\b(?:NIR|securite sociale|numero fiscal|passeport|CNI)[ :#-]*[A-Z0-9 -]{6,}\b/gi, priority: 84 },
  { category: "ADRESSE", regex: /\b\d{1,4}\s+(?:rue|avenue|av\.|boulevard|bd|chemin|impasse|place|route)\s+[\p{L}' -]{3,}\b/giu, priority: 78 },
  { category: "ENTREPRISE", regex: /\b\p{Lu}[\p{L}' -]{2,}\s+(?:SAS|SARL|SA|EURL|SCI|SNC|Association)\b/gu, priority: 70 },
  { category: "NOM", regex: /\b(?:M\.|Mme|Monsieur|Madame|Dr|Docteur)\s+(\p{Lu}[\p{L}'-]{2,})\b/gu, priority: 62 },
  { category: "NOM", regex: /\b\p{Lu}{3,}(?:-\p{Lu}{2,})?\b/gu, priority: 48 },
  { category: "IDENTIFIANT", regex: /\b(?:id|user|login|compte|client)[ :#-]*[A-Z0-9_-]{4,}\b/gi, priority: 46 },
];

const normalize = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeLookup = (value: string) => normalize(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
const escapeRegex = (value: string) => value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
const makeId = (category: SensitiveCategory, start: number, end: number, original: string) => category + "-" + start + "-" + end + "-" + original.length;

const collectRegex = (text: string, candidates: Candidate[]) => {
  for (const spec of regexSpecs) {
    for (const match of text.matchAll(spec.regex)) {
      if (match.index !== undefined && match[0]) {
        candidates.push({ category: spec.category, original: normalize(match[0]), start: match.index, end: match.index + match[0].length, source: "auto", priority: spec.priority });
      }
    }
  }
};

const collectPersonPairs = (text: string, candidates: Candidate[]) => {
  for (const match of text.matchAll(/\b(\p{Lu}[\p{L}'-]{2,})\s+(\p{Lu}[\p{L}'-]{2,})\b/gu)) {
    if (match.index === undefined || !match[1] || !match[2]) continue;
    if (!firstNames.includes(normalizeLookup(match[1]))) continue;
    const firstNameStart = match.index;
    const lastNameStart = firstNameStart + match[1].length + 1;
    candidates.push({ category: "PRENOM", original: match[1], start: firstNameStart, end: firstNameStart + match[1].length, source: "auto", priority: 96 });
    candidates.push({ category: "NOM", original: match[2], start: lastNameStart, end: lastNameStart + match[2].length, source: "auto", priority: 82 });
  }
};

const collectFirstNames = (text: string, candidates: Candidate[]) => {
  for (const match of text.matchAll(/\b\p{Lu}[\p{L}'-]{2,}\b/gu)) {
    if (match.index !== undefined && firstNames.includes(normalizeLookup(match[0]))) {
      candidates.push({ category: "PRENOM", original: match[0], start: match.index, end: match.index + match[0].length, source: "auto", priority: 88 });
    }
  }
};

const collectTerms = (text: string, terms: string[], category: SensitiveCategory, candidates: Candidate[]) => {
  for (const term of terms) {
    const regex = new RegExp("\\b" + escapeRegex(term) + "\\b", "gi");
    for (const match of text.matchAll(regex)) {
      if (match.index !== undefined) candidates.push({ category, original: match[0], start: match.index, end: match.index + match[0].length, source: "auto", priority: 34 });
    }
  }
};

const collectCustomRules = (text: string, customRules: CustomRule[], candidates: Candidate[]) => {
  for (const rule of customRules) {
    if (!rule.pattern.trim()) continue;
    try {
      const regex = rule.isRegex ? new RegExp(rule.pattern, "gi") : new RegExp(escapeRegex(rule.pattern), "gi");
      for (const match of text.matchAll(regex)) {
        if (match.index !== undefined && match[0]) {
          candidates.push({ category: rule.category, original: normalize(match[0]), start: match.index, end: match.index + match[0].length, source: "custom-rule", priority: 140 });
        }
      }
    } catch {
      continue;
    }
  }
};

const overlaps = (a: Candidate, b: Candidate) => a.start < b.end && b.start < a.end;
const resolveOverlaps = (candidates: Candidate[]) => {
  const selected: Candidate[] = [];
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority || (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  for (const candidate of sorted) if (!selected.some((existing) => overlaps(existing, candidate))) selected.push(candidate);
  return selected.sort((a, b) => a.start - b.start);
};

export const assignPlaceholders = (candidates: Array<Omit<Detection, "id" | "placeholder" | "status">>, status: Detection["status"] = "pending"): Detection[] => {
  const counters = new Map<SensitiveCategory, number>();
  const byValue = new Map<string, string>();
  return candidates.map((candidate) => {
    const key = candidate.category + ":" + normalizeLookup(candidate.original);
    let placeholder = byValue.get(key);
    if (!placeholder) {
      const next = (counters.get(candidate.category) ?? 0) + 1;
      counters.set(candidate.category, next);
      placeholder = "{{" + candidate.category + "_" + next + "}}";
      byValue.set(key, placeholder);
    }
    return { ...candidate, id: makeId(candidate.category, candidate.start, candidate.end, candidate.original), placeholder, status };
  });
};

export const detectSensitiveData = (text: string, customRules: CustomRule[] = [], status: Detection["status"] = "pending"): Detection[] => {
  const candidates: Candidate[] = [];
  collectRegex(text, candidates);
  collectPersonPairs(text, candidates);
  collectFirstNames(text, candidates);
  collectTerms(text, healthTerms, "SANTE", candidates);
  collectTerms(text, financeTerms, "FINANCE", candidates);
  collectCustomRules(text, customRules, candidates);
  const resolved = resolveOverlaps(candidates).map(({ priority: _priority, ...candidate }) => candidate);
  return assignPlaceholders(resolved, status);
};

export const addManualDetection = (detections: Detection[], text: string, start: number, end: number, category: SensitiveCategory): Detection[] => {
  if (start < 0 || end <= start || end > text.length) return detections;
  const original = normalize(text.slice(start, end));
  if (!original) return detections;
  const next = detections.filter((detection) => detection.end <= start || detection.start >= end);
  return assignPlaceholders([...next, { category, original, start, end, source: "manual" as const }].sort((a, b) => a.start - b.start), "pending");
};

export const sanitizeText = (text: string, detections: Detection[]) => {
  const active = detections.filter((detection) => detection.status !== "ignored").sort((a, b) => a.start - b.start);
  let cursor = 0;
  let sanitized = "";
  for (const detection of active) {
    if (detection.start < cursor) continue;
    sanitized += text.slice(cursor, detection.start) + detection.placeholder;
    cursor = detection.end;
  }
  return sanitized + text.slice(cursor);
};

export const deanonymizeText = (text: string, detections: Detection[]) => {
  const mapping = new Map(detections.filter((d) => d.status !== "ignored").map((d) => [d.placeholder, d.original]));
  const unknown = new Set<string>();
  const restored = text.replace(/\{\{[A-Z_]+_\d+\}\}/g, (placeholder) => {
    const original = mapping.get(placeholder);
    if (!original) {
      unknown.add(placeholder);
      return placeholder;
    }
    return original;
  });
  return { restored, unknownPlaceholders: [...unknown] };
};