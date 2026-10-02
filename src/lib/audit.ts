import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type AuditResult = "SUCCESS" | "FAILURE" | "DENIED";

export type AuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  result: AuditResult;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  meta?: Record<string, unknown> | null;
};

const META_STRING_LIMIT = 200;

/**
 * Keeps audit metadata free of sensitive personal data.
 * Only primitives are allowed; strings are truncated.
 */
export function sanitizeMeta(meta: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (typeof value === "string") {
      out[key] = value.slice(0, META_STRING_LIMIT);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value
        .slice(0, 20)
        .map((v) => (typeof v === "string" ? v.slice(0, META_STRING_LIMIT) : typeof v === "number" || typeof v === "boolean" ? v : null));
    }
    // objects and everything else are dropped
  }
  return out;
}

/**
 * Append-only security audit write. Never throws to the caller — a failed
 * audit write is logged server-side so it stays observable without breaking UX.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        result: input.result,
        ip: input.ip ?? null,
        userAgent: input.userAgent ? input.userAgent.slice(0, 300) : null,
        requestId: input.requestId ?? null,
        meta: (sanitizeMeta(input.meta) ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "AUDIT_WRITE_FAILED",
        action: input.action,
        result: input.result,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
