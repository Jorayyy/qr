import { describe, expect, it } from "vitest";
import * as otpauth from "otpauth";
import {
  consumeRecoveryCode,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  totpUri,
  verifyTotp,
} from "@/lib/mfa";

describe("MFA secret encryption", () => {
  it("round-trips an AES-256-GCM payload", () => {
    const secret = generateTotpSecret();
    const payload = encryptSecret(secret);
    expect(payload).not.toContain(secret);
    expect(decryptSecret(payload)).toBe(secret);
  });

  it("fails on tampered ciphertext", () => {
    const payload = Buffer.from(encryptSecret("JBSWY3DPEHPK3PXP"), "base64url");
    payload[payload.length - 1] ^= 0xff;
    expect(() => decryptSecret(payload.toString("base64url"))).toThrow();
  });
});

describe("TOTP", () => {
  const secret = generateTotpSecret();

  it("builds an otpauth:// provisioning URI", () => {
    const uri = totpUri(secret, "admin@university.edu");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("admin%40university.edu");
    expect(uri).toContain("University");
  });

  it("accepts the current code from the authenticator algorithm", () => {
    const totp = new otpauth.TOTP({
      issuer: "University VMS",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: otpauth.Secret.fromBase32(secret),
    });
    const code = totp.generate();
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, `${code.slice(0, 3)} ${code.slice(3)}`)).toBe(true);
  });

  it("rejects wrong and malformed codes", () => {
    expect(verifyTotp(secret, "000000")).toBe(false);
    expect(verifyTotp(secret, "abc")).toBe(false);
    expect(verifyTotp(secret, "")).toBe(false);
    expect(verifyTotp("NOT-A-SECRET", "123456")).toBe(false);
  });
});

describe("recovery codes", () => {
  it("issues 10 unique codes", () => {
    const { codes, stored } = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(JSON.parse(stored)).toHaveLength(10);
    expect(codes[0]).not.toContain("=");
  });

  it("consumes a valid code exactly once", () => {
    const { codes, stored } = generateRecoveryCodes();
    const updated = consumeRecoveryCode(stored, codes[0]);
    expect(updated).not.toBeNull();
    expect(JSON.parse(updated!)).toHaveLength(9);
    // Replay of the same code must fail.
    expect(consumeRecoveryCode(updated!, codes[0])).toBeNull();
    // A different unused code still works.
    expect(consumeRecoveryCode(updated!, codes[1])).not.toBeNull();
  });

  it("rejects unknown codes and malformed stored JSON", () => {
    const { stored } = generateRecoveryCodes();
    expect(consumeRecoveryCode(stored, "definitely-not-a-code")).toBeNull();
    expect(consumeRecoveryCode("not-json", "abc")).toBeNull();
    expect(consumeRecoveryCode('{"a":1}', "abc")).toBeNull();
  });

  it("is case-insensitive (codes are entered lowercased by users)", () => {
    const { codes, stored } = generateRecoveryCodes();
    expect(consumeRecoveryCode(stored, codes[0].toUpperCase())).not.toBeNull();
  });
});
