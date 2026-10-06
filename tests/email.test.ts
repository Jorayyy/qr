import { afterEach, describe, expect, it } from "vitest";
import { emailEnabled, sendQrEmail } from "@/lib/email";

const ORIGINAL_ENV = { ...process.env };
const EMAIL_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "RESEND_API_KEY",
] as const;

function clearEmailEnv(): void {
  for (const key of EMAIL_VARS) delete process.env[key];
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("emailEnabled", () => {
  it("is off when neither transport is configured", () => {
    clearEmailEnv();
    expect(emailEnabled()).toBe(false);
  });

  it("needs both SMTP user and password", () => {
    clearEmailEnv();
    process.env.SMTP_USER = "qr@example.com";
    expect(emailEnabled()).toBe(false);

    process.env.SMTP_PASS = "abcd".repeat(4);
    expect(emailEnabled()).toBe(true);
  });

  it("enables on the Resend key alone", () => {
    clearEmailEnv();
    process.env.RESEND_API_KEY = "re_test_key";
    expect(emailEnabled()).toBe(true);
  });
});

describe("sendQrEmail", () => {
  it("refuses without a recipient", async () => {
    clearEmailEnv();
    await expect(
      sendQrEmail({ to: "", visitorName: "Ana Cruz", qrCode: "VMS-1" })
    ).resolves.toBe(false);
  });

  it("refuses when no transport is configured, without sending", async () => {
    clearEmailEnv();
    await expect(
      sendQrEmail({ to: "ana@example.com", visitorName: "Ana Cruz", qrCode: "VMS-1" })
    ).resolves.toBe(false);
  });
});
