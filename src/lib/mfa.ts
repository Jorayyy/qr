import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";
import * as otpauth from "otpauth";
import { requiredSecret } from "@/lib/env";
import { sha256Hex } from "@/lib/password";

const ISSUER = "University VMS";

function appKey(): Buffer {
  return createHash("sha256").update(requiredSecret("SESSION_SECRET")).digest();
}

/** AES-256-GCM encryption at rest for the TOTP secret. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", appKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", appKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function generateTotpSecret(): string {
  return new otpauth.Secret({ size: 32 }).base32;
}

export function totpUri(secretBase32: string, accountEmail: string): string {
  const totp = new otpauth.TOTP({
    issuer: ISSUER,
    label: accountEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: otpauth.Secret.fromBase32(secretBase32),
  });
  return totp.toString();
}

/** Verifies a 6-digit TOTP code with ±1 period tolerance (constant-time compare). */
export function verifyTotp(secretBase32: string, code: string): boolean {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    const totp = new otpauth.TOTP({
      issuer: ISSUER,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: otpauth.Secret.fromBase32(secretBase32),
    });
    const delta = totp.validate({ token: cleaned, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

const RECOVERY_CODE_COUNT = 10;

export function generateRecoveryCodes(): { codes: string[]; stored: string } {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = randomBytes(5).toString("base64url"); // ~8 chars, 40 bits
    codes.push(code);
    hashes.push(sha256Hex(code.toLowerCase()));
  }
  return { codes, stored: JSON.stringify(hashes) };
}

/**
 * Checks a recovery code against the stored hashes. Returns the updated
 * stored JSON with the code removed (single-use), or null when invalid.
 */
export function consumeRecoveryCode(storedJson: string, code: string): string | null {
  let hashes: string[];
  try {
    const parsed: unknown = JSON.parse(storedJson);
    if (!Array.isArray(parsed) || !parsed.every((h) => typeof h === "string")) return null;
    hashes = parsed;
  } catch {
    return null;
  }

  // Match against the exact code (lowercased) — never alter punctuation, or
  // codes containing "-" would fail to verify.
  const target = sha256Hex(code.replace(/\s+/g, "").toLowerCase());
  const index = hashes.findIndex((h) => {
    const a = Buffer.from(h, "hex");
    const b = Buffer.from(target, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (index === -1) return null;

  const remaining = hashes.filter((_, i) => i !== index);
  return JSON.stringify(remaining); // may be empty — user should regenerate (TOTP still works)
}
