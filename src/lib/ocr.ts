export type OcrIdType = "SSS" | "TIN" | "PASSPORT" | "STUDENT_ID" | "OTHER";

export type OcrFields = {
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  idType?: OcrIdType;
};

const STOPWORDS = [
  "republic",
  "philippines",
  "philsys",
  "specimen",
  "date of birth",
  "birth date",
  "address",
  "civil status",
  "blood type",
  "nationality",
  "expiration",
  "expiry",
  "issued",
  "authority",
  "signature",
  "philippine identification",
  "adult",
  "sex",
  "height",
  "weight",
  "gender",
  "occupation",
  "mailing address",
  "front",
  "back",
  "side",
  "photo",
  "qr code",
];

const DATE_RE = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
const YEAR_RE = /^(19|20)\d{2}$/;
const PHONE_RE = /^(?:\+?63|0)\d{9,11}$/;

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (/^\s+$|^-/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function isNoiseLine(line: string): boolean {
  const lower = line.toLowerCase();
  return STOPWORDS.some((word) => lower.includes(word));
}

function words(line: string): string[] {
  return line
    .split(/\s+/)
    .map((w) => w.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ""))
    .filter(Boolean);
}

function looksLikeNameLine(line: string): boolean {
  if (/\d/.test(line)) return false;
  if (isNoiseLine(line)) return false;

  const parts = words(line);
  if (parts.length < 2 || parts.length > 4) return false;
  if (!parts.every((w) => /^[\p{L}.'’-]+$/u.test(w))) return false;
  if (parts.join("").length < 4) return false;
  return true;
}

function splitName(line: string): { firstName: string; lastName: string } {
  const comma = line.indexOf(",");
  if (comma > -1) {
    const last = line.slice(0, comma).trim();
    const first = line.slice(comma + 1).trim();
    if (last && first) return { firstName: titleCase(first), lastName: titleCase(last) };
  }

  const parts = words(line);
  if (parts.length <= 1) return { firstName: "", lastName: "" };
  if (parts.length === 2) return { firstName: titleCase(parts[0]), lastName: titleCase(parts[1]) };

  return {
    firstName: titleCase(parts.slice(0, 1).join(" ")),
    lastName: titleCase(parts.slice(1).join(" ")),
  };
}

function pickName(lines: string[]): { firstName?: string; lastName?: string } {
  const candidates = lines.filter(looksLikeNameLine);
  if (candidates.length === 0) return {};

  // Prefer the upper-cased, comma-formatted line typical of printed IDs.
  const scored = candidates
    .map((line) => {
      let score = 0;
      if (line === line.toUpperCase()) score += 3;
      if (line.includes(",")) score += 2;
      if (words(line).length === 3) score += 1;
      return { line, score };
    })
    .sort((a, b) => b.score - a.score);

  const { firstName, lastName } = splitName(scored[0].line);
  if (!firstName || !lastName) return {};
  return { firstName, lastName };
}

function normalizeIdNumber(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/[^\w/-]/g, "").toUpperCase();
}

function looksLikeIdNumber(candidate: string): boolean {
  const bare = candidate.replace(/\s+/g, "");
  if (bare.length < 6 || bare.length > 24) return false;
  if (DATE_RE.test(bare) || YEAR_RE.test(bare)) return false;
  if (PHONE_RE.test(bare)) return false;

  const digits = bare.replace(/\D/g, "");
  const letters = bare.replace(/[0-9]/g, "").length;
  if (digits.length < 5) return false;
  if (letters > digits.length) return false;
  if (/^[01]\d{9}$/.test(bare) && bare.startsWith("0")) return false;
  return true;
}

function pickIdNumber(lines: string[]): string | undefined {
  const scored: { value: string; score: number }[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const tagged = /\b(id|no|number|nr)\b/.test(lower);

    // Split on whitespace so "ID No. 1234567890" still yields the number.
    const tokens = line.split(/\s+/);
    for (const token of tokens) {
      const candidate = token.trim();
      if (!/\d/.test(candidate)) continue;
      if (!looksLikeIdNumber(normalizeIdNumber(candidate))) continue;

      let score = tagged ? 4 : 2;
      if (normalizeIdNumber(candidate).length >= 10) score += 1;
      scored.push({ value: normalizeIdNumber(candidate), score });
    }

    if (tagged) {
      const after = line.replace(/.*\b(?:id|no|number|nr)\b[\s.:]*/i, "").trim();
      const normalized = normalizeIdNumber(after);
      if (after && normalized !== line && looksLikeIdNumber(normalized)) {
        scored.push({ value: normalized, score: 6 });
      }
    }
  }

  if (scored.length === 0) return undefined;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].value;
}

function pickIdType(text: string): OcrIdType | undefined {
  const upper = text.toUpperCase();
  if (upper.includes("PASSPORT")) return "PASSPORT";
  if (upper.includes("SOCIAL SECURITY") || /\bSSS\b/.test(upper)) return "SSS";
  if (/\bTIN\b/.test(upper) || upper.includes("BUREAU OF INTERNAL REVENUE") || /\bBIR\b/.test(upper))
    return "TIN";
  if (
    upper.includes("STUDENT") ||
    upper.includes("UNIVERSITY") ||
    upper.includes("COLLEGE") ||
    upper.includes("ACADEMY") ||
    upper.includes("SENIOR HIGH")
  )
    return "STUDENT_ID";
  return undefined;
}

/**
 * Best-effort extraction of walk-in fields from raw ID card OCR text.
 * Every value is advisory — the guard/visitor still reviews the form.
 */
export function parseIdText(text: string): OcrFields {
  if (!text || !text.trim()) return {};

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .filter((line) => line.length > 1);

  const name = pickName(lines);
  const idNumber = pickIdNumber(lines);

  return {
    ...name,
    idNumber,
    idType: pickIdType(text),
  };
}
