import { describe, expect, it } from "vitest";
import {
  checkinSchema,
  checkoutSchema,
  createUserSchema,
  loginSchema,
  qrLookupSchema,
  registerVisitorSchema,
  safeCallbackUrl,
  searchQuerySchema,
} from "@/lib/validation";

describe("safeCallbackUrl", () => {
  it("accepts same-site paths", () => {
    expect(safeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("/visitors?q=john")).toBe("/visitors?q=john");
    expect(safeCallbackUrl("/account/password")).toBe("/account/password");
  });

  it("rejects open-redirect targets", () => {
    expect(safeCallbackUrl("//evil.com")).toBeNull();
    expect(safeCallbackUrl("/\\evil.com")).toBeNull();
    expect(safeCallbackUrl("https://evil.com")).toBeNull();
    expect(safeCallbackUrl("/\n/evil")).toBeNull();
    expect(safeCallbackUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty and missing values", () => {
    expect(safeCallbackUrl(null)).toBeNull();
    expect(safeCallbackUrl(undefined)).toBeNull();
    expect(safeCallbackUrl("")).toBeNull();
  });
});

describe("loginSchema", () => {
  it("lowercases and accepts a valid login", () => {
    const result = loginSchema.parse({ email: "  Admin@University.EDU ", password: "x" });
    expect(result.email).toBe("admin@university.edu");
  });

  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("rejects missing password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x", admin: "true" }).success
    ).toBe(false);
  });
});

describe("searchQuerySchema", () => {
  it("accepts normal search terms", () => {
    expect(searchQuerySchema.parse("john doe")).toBe("john doe");
    expect(searchQuerySchema.parse("a@b.co")).toBe("a@b.co");
    expect(searchQuerySchema.parse("maria-delacruz")).toBe("maria-delacruz");
  });

  it("rejects SQL/HTML-ish input", () => {
    expect(searchQuerySchema.safeParse("'; DROP TABLE users;--").success).toBe(false);
    expect(searchQuerySchema.safeParse("<script>").success).toBe(false);
    expect(searchQuerySchema.safeParse("a".repeat(101)).success).toBe(false);
  });
});

describe("qrLookupSchema", () => {
  it("accepts generated QR values", () => {
    expect(qrLookupSchema.parse("VMS-1690000000000-ab12cd34")).toBe("VMS-1690000000000-ab12cd34");
  });

  it("rejects malformed values", () => {
    expect(qrLookupSchema.safeParse("has space").success).toBe(false);
    expect(qrLookupSchema.safeParse("<img src=x>").success).toBe(false);
    expect(qrLookupSchema.safeParse("").success).toBe(false);
    expect(qrLookupSchema.safeParse("a".repeat(65)).success).toBe(false);
  });
});

describe("checkinSchema", () => {
  it("requires a qr or visitId", () => {
    expect(checkinSchema.safeParse({}).success).toBe(false);
    expect(checkinSchema.safeParse({ qr: "VMS-1-ab12cd34" }).success).toBe(true);
    expect(
      checkinSchema.safeParse({ visitId: "00000000-0000-4000-8000-000000000000" }).success
    ).toBe(true);
  });

  it("accepts an optional department station id", () => {
    expect(
      checkinSchema.safeParse({
        qr: "VMS-1-ab12cd34",
        departmentId: "00000000-0000-4000-8000-000000000000",
      }).success
    ).toBe(true);
    expect(checkinSchema.safeParse({ qr: "VMS-1-ab12cd34", departmentId: "not-a-uuid" }).success).toBe(
      false
    );
  });
});

describe("checkoutSchema", () => {
  it("requires a qr or visitId", () => {
    expect(checkoutSchema.safeParse({}).success).toBe(false);
    expect(checkoutSchema.safeParse({ qr: "VMS-1-ab12cd34" }).success).toBe(true);
    expect(
      checkoutSchema.safeParse({ visitId: "00000000-0000-4000-8000-000000000000" }).success
    ).toBe(true);
  });

  it("rejects unknown fields", () => {
    expect(checkoutSchema.safeParse({ qr: "VMS-1-ab12cd34", admin: true }).success).toBe(false);
  });
});

describe("registerVisitorSchema", () => {
  const valid = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "09171234567",
    company: "",
    idType: "STUDENT_ID",
    idNumber: "2023-0001",
    departmentId: "00000000-0000-4000-8000-000000000000",
    purpose: "MEETING",
    hostName: "Dr. Smith",
    hostDepartment: "",
    vehicleType: "",
    vehicleModel: "",
    vehiclePlateNumber: "",
    notes: "",
  };

  it("accepts a kiosk submission", () => {
    const result = registerVisitorSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.company).toBeUndefined();
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects unknown fields", () => {
    expect(registerVisitorSchema.safeParse({ ...valid, isAdmin: true }).success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { firstName, ...rest } = valid;
    expect(firstName).toBe("Jane");
    expect(registerVisitorSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    expect(registerVisitorSchema.safeParse({ ...valid, idType: "FAKE" }).success).toBe(false);
    expect(registerVisitorSchema.safeParse({ ...valid, purpose: "EVIL" }).success).toBe(false);
  });

  it("rejects overlong names", () => {
    expect(registerVisitorSchema.safeParse({ ...valid, firstName: "a".repeat(101) }).success).toBe(
      false
    );
  });
});

describe("createUserSchema", () => {
  it("accepts a valid admin-created user", () => {
    const result = createUserSchema.safeParse({
      email: "staff@university.edu",
      name: "Staff Member",
      role: "STAFF",
      password: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid roles", () => {
    expect(
      createUserSchema.safeParse({ email: "x@y.co", name: "X", role: "SUPERADMIN" }).success
    ).toBe(false);
  });
});
