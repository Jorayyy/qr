import { afterEach, describe, expect, it, vi } from "vitest";
import { boolFromEnv, intFromEnv, requiredSecret } from "@/lib/env";
import { sanitizeMeta } from "@/lib/audit";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("intFromEnv", () => {
  it("returns the fallback when unset or invalid", () => {
    delete process.env.TEST_INT;
    expect(intFromEnv("TEST_INT", 10, 1, 100)).toBe(10);
    process.env.TEST_INT = "not-a-number";
    expect(intFromEnv("TEST_INT", 10, 1, 100)).toBe(10);
  });

  it("parses and clamps to the allowed range", () => {
    process.env.TEST_INT = "5";
    expect(intFromEnv("TEST_INT", 10, 1, 100)).toBe(5);
    process.env.TEST_INT = "9999";
    expect(intFromEnv("TEST_INT", 10, 1, 100)).toBe(100);
    process.env.TEST_INT = "-3";
    expect(intFromEnv("TEST_INT", 10, 1, 100)).toBe(1);
  });
});

describe("boolFromEnv", () => {
  it("parses true/false values", () => {
    process.env.TEST_BOOL = "true";
    expect(boolFromEnv("TEST_BOOL", false)).toBe(true);
    process.env.TEST_BOOL = "1";
    expect(boolFromEnv("TEST_BOOL", false)).toBe(true);
    process.env.TEST_BOOL = "false";
    expect(boolFromEnv("TEST_BOOL", true)).toBe(false);
    delete process.env.TEST_BOOL;
    expect(boolFromEnv("TEST_BOOL", true)).toBe(true);
  });
});

describe("requiredSecret", () => {
  it("returns a sufficiently long secret", () => {
    process.env.TEST_SECRET = "s".repeat(32);
    expect(requiredSecret("TEST_SECRET")).toBe("s".repeat(32));
  });

  it("throws in production when missing or too short", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.TEST_SECRET;
    expect(() => requiredSecret("TEST_SECRET")).toThrow(/TEST_SECRET/);
    process.env.TEST_SECRET = "too-short";
    expect(() => requiredSecret("TEST_SECRET")).toThrow(/TEST_SECRET/);
  });
});

describe("sanitizeMeta", () => {
  it("keeps primitives, truncates long strings", () => {
    const out = sanitizeMeta({
      reason: "bad_password",
      failedLogins: 5,
      lockMinutes: 1,
      usedRecovery: false,
      nothing: null,
      long: "x".repeat(500),
    });
    expect(out).toEqual({
      reason: "bad_password",
      failedLogins: 5,
      lockMinutes: 1,
      usedRecovery: false,
      nothing: null,
      long: "x".repeat(200),
    });
  });

  it("drops objects and unsupported types", () => {
    const out = sanitizeMeta({
      nested: { leak: "ssn-123-456-7890" },
      fn: () => "x",
      when: new Date(),
      undef: undefined,
    });
    expect(out).toEqual({});
  });

  it("sanitizes array contents", () => {
    const out = sanitizeMeta({
      items: ["a".repeat(500), 1, true, { x: 1 }, null],
    });
    expect(out).toEqual({ items: ["a".repeat(200), 1, true, null, null] });
  });

  it("returns undefined for empty input", () => {
    expect(sanitizeMeta(null)).toBeUndefined();
    expect(sanitizeMeta(undefined)).toBeUndefined();
  });
});
