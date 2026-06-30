export type SensitiveCategory = "PRENOM" | "NOM" | "EMAIL" | "TELEPHONE" | "ADRESSE" | "DATE" | "ENTREPRISE" | "SIRET" | "IBAN" | "CB" | "IP" | "URL" | "API_KEY" | "IDENTIFIANT" | "SANTE" | "FINANCE" | "ADMIN" | "CUSTOM";
export type DetectionSource = "auto" | "custom-rule" | "manual";
export type DetectionStatus = "pending" | "accepted" | "ignored";
export type Detection = { id: string; category: SensitiveCategory; original: string; placeholder: string; start: number; end: number; source: DetectionSource; status: DetectionStatus; };
export type SessionMapping = { detections: Detection[]; sanitizedText: string; createdAt: string; };
export type CustomRule = { id: string; label: string; pattern: string; category: SensitiveCategory; isRegex: boolean; };
