import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk, rateLimitResponse, withApiHandler } from "@/lib/http";
import { checkinSchema } from "@/lib/validation";
import { can } from "@/lib/rbac";

const GENERIC_INVALID = "This QR code is not valid for check-in.";

/**
 * Check-in endpoint.
 *
 * Authorization model:
 * - Anonymous (kiosk): may check in by presenting the QR credential itself.
 * - Authenticated staff: may check in by visit id (scanner UI) or QR.
 * - visitId without a session is rejected (IDOR fix).
 *
 * Status transitions are enforced server-side (PENDING → CHECKED_IN only).
 */
export async function POST(req: NextRequest) {
  return withApiHandler(req, async ({ requestId, ip }) => {
    if (!isSameOrigin(req)) {
      return jsonError(403, "Cross-origin request rejected.", requestId);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "Invalid JSON body.", requestId);
    }

    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.", requestId);
    }

    const user = await getSession();
    const staffAllowed = Boolean(user && can(user.role, "visit:transition"));

    const ipLimit = await rateLimit(`checkin:ip:${ip ?? "unknown"}`, LIMITS.checkinPerIp(), WINDOWS.short);
    const userLimit = user
      ? await rateLimit(`checkin:user:${user.userId}`, LIMITS.checkinPerUser(), WINDOWS.short)
      : { ok: true as const, remaining: 0 };
    if (!ipLimit.ok || !userLimit.ok) {
      const retry =
        (!ipLimit.ok && ipLimit.retryAfterSeconds) || (!userLimit.ok && userLimit.retryAfterSeconds) || 60;
      return rateLimitResponse(retry, requestId);
    }

    let visit: {
      id: string;
      status: "PENDING" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
      qrExpiresAt: Date | null;
      qrRevokedAt: Date | null;
      visitor: { firstName: string };
    } | null = null;

    if (parsed.data.qr) {
      const qrLimit = await rateLimit(`checkin:qr:${parsed.data.qr}`, LIMITS.lookupPerQr(), WINDOWS.short);
      if (!qrLimit.ok) return rateLimitResponse(qrLimit.retryAfterSeconds, requestId);

      visit = await db.visit.findUnique({
        where: { qrCode: parsed.data.qr },
        select: {
          id: true,
          status: true,
          qrExpiresAt: true,
          qrRevokedAt: true,
          visitor: { select: { firstName: true } },
        },
      });
      if (!visit) {
        await recordAudit({
          actorId: user?.userId,
          actorEmail: user?.email,
          action: "QR_CHECKIN",
          result: "FAILURE",
          targetType: "qr",
          ip,
          requestId,
          meta: { reason: "not_found", channel: user ? "staff" : "kiosk" },
        });
        return jsonError(404, GENERIC_INVALID, requestId);
      }
    } else if (parsed.data.visitId) {
      // visitId path is staff-only — anonymous callers cannot address visits directly.
      if (!staffAllowed) {
        await recordAudit({
          actorId: user?.userId,
          actorEmail: user?.email,
          action: "QR_CHECKIN",
          result: "DENIED",
          targetType: "visit",
          targetId: parsed.data.visitId,
          ip,
          requestId,
          meta: { reason: "visitid_without_permission" },
        });
        return jsonError(user ? 403 : 401, "Not authorized.", requestId);
      }

      visit = await db.visit.findUnique({
        where: { id: parsed.data.visitId },
        select: {
          id: true,
          status: true,
          qrExpiresAt: true,
          qrRevokedAt: true,
          visitor: { select: { firstName: true } },
        },
      });
      if (!visit) {
        return jsonError(404, "Visit not found", requestId);
      }
    }

    if (!visit) return jsonError(400, "qr or visitId is required.", requestId);

    const now = Date.now();
    const expired = Boolean(visit.qrExpiresAt && visit.qrExpiresAt.getTime() < now);
    const revoked = Boolean(visit.qrRevokedAt);
    if (expired || revoked) {
      await recordAudit({
        actorId: user?.userId,
        actorEmail: user?.email,
        action: "QR_CHECKIN",
        result: "DENIED",
        targetType: "visit",
        targetId: visit.id,
        ip,
        requestId,
        meta: { reason: expired ? "expired" : "revoked", channel: user ? "staff" : "kiosk" },
      });
      return jsonError(403, "This QR code is no longer valid.", requestId);
    }

    if (visit.status !== "PENDING") {
      await recordAudit({
        actorId: user?.userId,
        actorEmail: user?.email,
        action: "QR_CHECKIN",
        result: "FAILURE",
        targetType: "visit",
        targetId: visit.id,
        ip,
        requestId,
        meta: { reason: `bad_status_${visit.status}` },
      });
      return jsonError(
        409,
        `Visit is already ${visit.status.toLowerCase().replace("_", " ")}.`,
        requestId
      );
    }

    const arrival = new Date();
    await db.visit.update({
      where: { id: visit.id },
      data: {
        status: "CHECKED_IN",
        actualArrival: arrival,
        ...(user ? { checkedInById: user.userId } : {}),
      },
    });

    await recordAudit({
      actorId: user?.userId,
      actorEmail: user?.email,
      action: "QR_CHECKIN",
      result: "SUCCESS",
      targetType: "visit",
      targetId: visit.id,
      ip,
      requestId,
      meta: { channel: user ? "staff" : "kiosk" },
    });

    // Minimal payload: first name + status only (no email/phone/ID/notes).
    return jsonOk({
      success: true,
      visit: {
        id: visit.id,
        status: "CHECKED_IN",
        actualArrival: arrival,
        visitor: { firstName: visit.visitor.firstName },
      },
    });
  });
}
