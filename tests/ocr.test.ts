import { describe, expect, it } from "vitest";
import { parseIdText } from "@/lib/ocr";

describe("parseIdText", () => {
  it("returns nothing for empty input", () => {
    expect(parseIdText("")).toEqual({});
    expect(parseIdText("   \n  ")).toEqual({});
  });

  it("extracts a comma-formatted name and id number", () => {
    const fields = parseIdText(
      [
        "REPUBLIC OF THE PHILIPPINES",
        "DELA CRUZ, JUAN B.",
        "ADDRESS: 123 RIZAL ST",
        "ID No. 123456789012",
        "DATE OF BIRTH: 01/02/1990",
        "EXPIRATION: 12/31/2030",
      ].join("\n")
    );

    expect(fields.firstName).toBe("Juan B.");
    expect(fields.lastName).toBe("Dela Cruz");
    expect(fields.idNumber).toBe("123456789012");
    expect(fields.idType).toBeUndefined();
  });

  it("extracts an unformatted three-word name", () => {
    const fields = parseIdText(["JUAN DELA CRUZ", "SSS NUMBER", "34-1234567-8"].join("\n"));

    expect(fields.firstName).toBe("Juan");
    expect(fields.lastName).toBe("Dela Cruz");
    expect(fields.idType).toBe("SSS");
  });

  it("splits two-word names", () => {
    const fields = parseIdText("MARIA SANTOS\n123456789");
    expect(fields.firstName).toBe("Maria");
    expect(fields.lastName).toBe("Santos");
  });

  it("detects passport and student ids", () => {
    expect(parseIdText("PHILIPPINE PASSPORT\nP1234567").idType).toBe("PASSPORT");
    expect(
      parseIdText("SAMPLE SENIOR HIGH SCHOOL\nSTUDENT ID\n2024-0099").idType
    ).toBe("STUDENT_ID");
    expect(parseIdText("TIN\n123-456-789-000").idType).toBe("TIN");
  });

  it("ignores dates and phone numbers as id numbers", () => {
    const fields = parseIdText("JUAN DELA CRUZ\n01/02/1990\n09171234567");
    expect(fields.idNumber).toBeUndefined();
    expect(fields.firstName).toBe("Juan");
  });

  it("does not treat label text as a name", () => {
    const fields = parseIdText(
      ["REPUBLIC OF THE PHILIPPINES", "DATE OF BIRTH", "01/02/1990"].join("\n")
    );
    expect(fields.firstName).toBeUndefined();
    expect(fields.lastName).toBeUndefined();
  });

  it("prefers a tagged id number over an untagged one", () => {
    const fields = parseIdText(
      ["JUAN DELA CRUZ", "19900101", "ID NUMBER 987654321098"].join("\n")
    );
    expect(fields.idNumber).toBe("987654321098");
  });
});
