const DEV_FALLBACK_SECRET = "vms-insecure-dev-only-secret-not-for-production";

let warned = false;

/**
 * Returns a required application secret (>= 32 chars).
 * Fails fast in production when missing/weak — never silently falls back.
 * Must only be called at request time (not at module scope / build time).
 */
export function requiredSecret(name: string): string {
  const value = process.env[name];
  if (value && value.length >= 32) {
    return value;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing or weak environment variable ${name}. Set it to a random string of at least 32 characters.`
    );
  }
  if (!warned) {
    warned = true;
    console.warn(
      `[security] ${name} is not set — using an insecure development-only fallback. Never run this way in production.`
    );
  }
  return DEV_FALLBACK_SECRET;
}

export function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function boolFromEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}
