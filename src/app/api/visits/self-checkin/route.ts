import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk, rateLimitResponse, withApiHandler } from "@/lib/http";
import { selfCheckinSchema } from "@/lib/validation";

/** Deliberately vague so it cannot confirm whether a pass code exists. */
const NO_MATCH = "We could not match an active pass with that code.";

/**
 * Public self check-in: a visitor scans the posted office QR, then enters their
 * pass code. Returns only their first name and the resulting status.
 */
export async function POST(req: NextRequest) {
  return withApiHandler(req, async ({ requestId, ip }) => {
    if (!isSameOrigin(req)) return jsonError(403, "Cross-origin request blocked.", requestId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "Invalid request.", requestId);
    }

    const parsed = selfCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.", requestId);
    }
    const { qr } = parsed.data;

    const ipLimit = await rateLimit(`checkin:ip:${ip ?? "unknown"}`, LIMITS.checkinPerIp(), WINDOWS.short);
    const qrLimit = await rateLimit(`checkin:qr:${qr}`, LIMITS.lookupPerQr(), WINDOWS.short);
    if (!ipLimit.ok || !qrLimit.ok) {
      const retry = (!ipLimit.ok && ipLimit.retryAfterSeconds) || (!qrLimit.ok && qrLimit.retryAfterSeconds) || 60;
      return rateLimitResponse(retry, requestId);
    }

    const visit = await db.visit.findUnique({
      where: { qrCode: qr },
      select: {
        id: true,
        status: true,
        qrExpiresAt: true,
        qrRevokedAt: true,
        visitor: { select: { firstName: true } },
        department: { select: { name: true } },
      },
    });

    if (!visit) {
      await recordAudit({
        action: "SELF_CHECKIN",
        result: "FAILURE",
        targetType: "qr",
        ip,
        requestId,
        meta: { reason: "no_match" },
      });
      return jsonError(404, NO_MATCH, requestId);
    }

    const now = new Date();
    if ((visit.qrExpiresAt && visit.qrExpiresAt.getTime() < now.getTime()) || visit.qrRevokedAt) {
      await recordAudit({
        action: "SELF_CHECKIN",
        result: "DENIED",
        targetType: "visit",
        targetId: visit.id,
        ip,
        requestId,
        meta: { reason: visit.qrRevokedAt ? "revoked" : "expired" },
      });
      return jsonError(403, "This pass is no longer valid. Please see the Front Desk.", requestId);
    }

    let nextStatus: "CHECKED_IN" | "CHECKED_OUT" | null = null;
    if (visit.status === "PENDING") nextStatus = "CHECKED_IN";
    else if (visit.status === "CHECKED_IN") nextStatus = "CHECKED_OUT";

    if (!nextStatus) {
      return jsonError(409, `This pass is already ${visit.status.toLowerCase().replace("_", " ")}.`, requestId);
    }

    await db.visit.update({
      where: { id: visit.id },
      data:
        nextStatus === "CHECKED_IN"
          ? { status: "CHECKED_IN", actualArrival: now }
          : { status: "CHECKED_OUT", actualDeparture: now },
    });

    await recordAudit({
      action: "SELF_CHECKIN",
      result: "SUCCESS",
      targetType: "visit",
      targetId: visit.id,
      ip,
      requestId,
      meta: { outcome: nextStatus },
    });

    return jsonOk({
      action: nextStatus,
      visitorName: visit.visitor.firstName,
      departmentName: visit.department.name,
      at: now,
    });
  });
}
