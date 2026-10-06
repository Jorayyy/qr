import { z } from "zod";

export const ID_TYPES = ["SSS", "TIN", "PASSPORT", "STUDENT_ID", "OTHER"] as const;
export const PURPOSES = ["ATTENDANCE", "DELIVERY", "INTERVIEW", "MEETING", "SCHOOL_VISIT", "OTHER"] as const;

/** Optional text field: trims, converts empty → undefined, enforces max length. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

export const emailField = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Invalid email address.")
  .transform((value) => value.toLowerCase());

const optionalEmail = z
  .string()
  .trim()
  .max(254, "Email must be at most 254 characters.")
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value.toLowerCase()))
  .refine(
    (value) => value === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Invalid email address."
  );

export const loginSchema = z
  .object({
    email: emailField,
    password: z.string().min(1).max(128),
  })
  .strict();

export const registerVisitorSchema = z
  .object({
    firstName: requiredText(100, "First name"),
    lastName: requiredText(100, "Last name"),
    email: optionalEmail,
    phone: optionalText(32),
    company: optionalText(120),
    idType: z.enum(ID_TYPES),
    idNumber: optionalText(64),
    departmentId: z.string().uuid("Invalid department."),
    purpose: z.enum(PURPOSES),
    hostName: optionalText(120),
    hostDepartment: optionalText(120),
    vehicleType: optionalText(64),
    vehicleModel: optionalText(64),
    vehiclePlateNumber: optionalText(64),
    notes: optionalText(500),
  })
  .strict();

export type RegisterVisitorInput = z.infer<typeof registerVisitorSchema>;

export const departmentSchema = z
  .object({
    name: requiredText(100, "Department name"),
    building: optionalText(120),
    contactPerson: optionalText(120),
    contactEmail: optionalText(254),
  })
  .strict();

export const uuidSchema = z.string().uuid();

export const qrLookupSchema = z
  .string()
  .trim()
  .min(4)
  .max(64)
  .regex(/^[A-Za-z0-9-]+$/, "Invalid QR code format.");

export const checkinSchema = z
  .object({
    qr: qrLookupSchema.optional(),
    visitId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.qr || value.visitId), {
    message: "qr or visitId is required",
  });

export const checkoutSchema = z
  .object({
    qr: qrLookupSchema.optional(),
    visitId: z.string().uuid().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.qr || value.visitId), {
    message: "qr or visitId is required",
  });

export const mfaCodeSchema = z
  .object({
    code: z.string().trim().min(6).max(10),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string(),
  })
  .strict();

export const searchQuerySchema = z
  .string()
  .trim()
  .max(100)
  .regex(/^[A-Za-z0-9@._+\- ]*$/, "Invalid search term.");

export const USER_ROLES = ["ADMIN", "STAFF", "SECURITY", "RECEPTIONIST"] as const;

export const createUserSchema = z
  .object({
    email: emailField,
    name: requiredText(120, "Name"),
    role: z.enum(USER_ROLES),
    password: z.string().optional(),
  })
  .strict();

export const userRoleSchema = z
  .object({
    userId: z.string().uuid(),
    role: z.enum(USER_ROLES),
  })
  .strict();

/** Reads a FormData entry as a trimmed string. */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Validates a post-login redirect target. Only same-site absolute paths are
 * allowed (blocks open redirects like //evil.com or /\evil.com).
 */
export function safeCallbackUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return null;
  return value;
}
