import { hash, verify } from "@node-rs/argon2";
import { compare } from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

/**
 * OWASP Argon2id recommendations: 19 MiB memory, 2 iterations, 1 lane.
 * (@node-rs/argon2 defaults to Argon2id, which is why `algorithm` is omitted —
 * the enum is an ambient const enum and cannot be referenced with isolatedModules.)
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

let dummyHashPromise: Promise<string> | null = null;

/**
 * Precomputed hash used to equalize response timing when the email is unknown,
 * so login errors cannot be used to enumerate accounts.
 */
function dummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hash(randomBytes(32).toString("hex"), ARGON2_OPTIONS);
  }
  return dummyHashPromise;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export type PasswordVerification = {
  valid: boolean;
  /** True when a legacy (bcrypt) hash verified and should be upgraded to Argon2id. */
  needsRehash: boolean;
};

export async function verifyPassword(storedHash: string, password: string): Promise<PasswordVerification> {
  if (storedHash.startsWith("$argon2")) {
    try {
      return { valid: await verify(storedHash, password), needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }
  if (storedHash.startsWith("$2")) {
    try {
      const valid = await compare(password, storedHash);
      return { valid, needsRehash: valid };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }
  return { valid: false, needsRehash: false };
}

/** Burns an equivalent amount of CPU when the account does not exist. */
export async function equalizeLoginTiming(password: string): Promise<void> {
  const h = await dummyHash();
  try {
    await verify(h, password.slice(0, 128));
  } catch {
    // ignore — purpose is timing only
  }
}

/** sha256 helper shared by MFA recovery codes. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const COMMON_PASSWORDS = new Set([
  "admin@12345",
  "security@123",
  "password",
  "password1",
  "password123",
  "passw0rd123",
  "p@ssword123",
  "administrator",
  "administrator1",
  "admin123456",
  "adminadmin",
  "letmein123",
  "welcome123",
  "welcome1234",
  "qwerty123456",
  "iloveyou123",
  "monkey123456",
  "dragon123456",
  "sunshine123",
  "princess123",
  "football123",
  "baseball123",
  "trustno1234",
  "changeme123",
  "secret12345",
  "summer2024",
  "summer2025",
  "summer2026",
  "winter2024",
  "winter2025",
  "winter2026",
  "university1",
  "university123",
  "student12345",
  "teacher12345",
  "deped123456",
  "campus12345",
  "vms123456789",
  "qrcode12345",
  "visitor12345",
  "123456789012",
  "1234567890123",
  "abcd12345678",
  "aaaaaaaaaaaa",
  "abcdefghijkl",
  "test12345678",
  "testtest1234",
  "root12345678",
  "user12345678",
  "default12345",
  "temporary123",
  "temppassword",
]);

export const passwordPolicy = z
  .string()
  .min(12, "Password must be at least 12 characters long.")
  .max(128, "Password must be at most 128 characters long.")
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "This password is too common. Choose something harder to guess.",
  })
  .refine((value) => new Set(value).size >= 4, {
    message: "Password must use a variety of characters.",
  });

export function passwordSchemaFor(email?: string) {
  return passwordPolicy.refine(
    (value) => !email || !value.toLowerCase().includes(email.split("@")[0].toLowerCase()),
    { message: "Password must not contain your email address." }
  );
}

/**
 * Breached-password check against the Have I Been Pwned range API
 * (k-anonymity: only a 5-char SHA-1 prefix leaves this server).
 * Returns the number of sightings, or null when the check could not run.
 */
export async function breachedPasswordCount(password: string): Promise<number | null> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { "Add-Padding": "true" },
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix) return Number.parseInt(count, 10) || 0;
    }
    return 0;
  } catch {
    return null; // network failure → caller decides (documented fail-open)
  }
}
