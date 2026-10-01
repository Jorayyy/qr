import { hashSync } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import {
  breachedPasswordCount,
  hashPassword,
  passwordPolicy,
  passwordSchemaFor,
  verifyPassword,
} from "@/lib/password";

describe("password hashing", () => {
  it("round-trips an Argon2id hash", async () => {
    const hash = await hashPassword("Correct-Horse-Battery-9!");
    expect(hash.startsWith("$argon2")).toBe(true);
    expect(await verifyPassword(hash, "Correct-Horse-Battery-9!")).toEqual({
      valid: true,
      needsRehash: false,
    });
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("Correct-Horse-Battery-9!");
    expect((await verifyPassword(hash, "wrong")).valid).toBe(false);
  });

  it("verifies legacy bcrypt hashes and flags them for rehash", async () => {
    const legacy = hashSync("Legacy-Passw0rd!", 10);
    expect(await verifyPassword(legacy, "Legacy-Passw0rd!")).toEqual({
      valid: true,
      needsRehash: true,
    });
  });

  it("rejects garbage stored hashes", async () => {
    expect((await verifyPassword("not-a-hash", "anything")).valid).toBe(false);
  });
});

describe("password policy", () => {
  it("requires at least 12 characters", () => {
    expect(passwordPolicy.safeParse("Sh0rt!").success).toBe(false);
    expect(passwordPolicy.safeParse("LongEnough-1").success).toBe(true);
  });

  it("blocks known common passwords", () => {
    expect(passwordPolicy.safeParse("password123").success).toBe(false);
    expect(passwordPolicy.safeParse("admin@12345").success).toBe(false);
  });

  it("requires variety of characters", () => {
    expect(passwordPolicy.safeParse("aaaaaaaaaaaaaa").success).toBe(false);
  });

  it("blocks passwords containing the email local part", () => {
    const schema = passwordSchemaFor("john.doe@university.edu");
    expect(schema.safeParse("john.doe-is-cool-1").success).toBe(false);
    expect(schema.safeParse("Completely-Diff-1").success).toBe(true);
  });
});

describe("breachedPasswordCount", () => {
  it("returns the sighting count when HIBP reports a match", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "AAAA00000000000000000000000000000000000:3\nBBBB111111111111111111111111111111111111:7\n",
    });
    vi.stubGlobal("fetch", fetchMock);

    // SHA-1 of "password" starts with 5BAA6; craft response to match the suffix.
    const { createHash } = await import("crypto");
    const full = createHash("sha1").update("password").digest("hex").toUpperCase();
    const suffix = full.slice(5);
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => `${suffix}:42\n`,
    });

    expect(await breachedPasswordCount("password")).toBe(42);
    vi.unstubAllGlobals();
  });

  it("returns 0 when the password is not in the response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => "0000000000000000000000000000000000000:1\n" })
    );
    expect(await breachedPasswordCount("some-unique-passphrase-xyz")).toBe(0);
    vi.unstubAllGlobals();
  });

  it("fails open (null) when the check cannot run", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    expect(await breachedPasswordCount("whatever")).toBeNull();
    vi.unstubAllGlobals();
  });
});
