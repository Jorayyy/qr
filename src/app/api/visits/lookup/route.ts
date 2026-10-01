import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { jsonError, jsonOk, rateLimitResponse, withApiHandler } from "@/lib/http";
import { qrLookupSchema } from "@/lib/validation";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Full staff projection — explicit allow-list, never raw DB rows.
 */
function staffProjection(visit: {
  id: string;
  status: string;
  purpose: string;
  qrCode: string;
  qrExpiresAt: Date | null;
  qrRevokedAt: Date | null;
  hostName: string | null;
  actualArrival: Date | null;
  actualDeparture: Date | null;
  createdAt: Date;
  visitor: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    idType: string;
    idNumber: string | null;
  };
  department: { id: string; name: string; building: string | null };
  stops: Array<{
    id: string;
    checkedInAt: Date;
    checkedOutAt: Date | null;
    building: string | null;
    department: { name: string };
  }>;
}) {
  return {
    id: visit.id,
    status: visit.status,
    purpose: visit.purpose,
    qrCode: visit.qrCode,
    qrExpiresAt: visit.qrExpiresAt,
    hostName: visit.hostName,
    actualArrival: visit.actualArrival,
    actualDeparture: visit.actualDeparture,
    createdAt: visit.createdAt,
    visitor: {
      firstName: visit.visitor.firstName,
      lastName: visit.visitor.lastName,
      email: visit.visitor.email,
      phone: visit.visitor.phone,
      company: visit.visitor.company,
      idType: visit.visitor.idType,
      idNumber: visit.visitor.idNumber,
    },
    department: visit.department,
    stops: visit.stops,
  };
}

/**
 * Kiosk (unauthenticated) projection — no email, phone, ID number, company,
 * notes or vehicle data. Knowing the QR is what authorizes this much.
 */
function kioskProjection(visit: {
  id: string;
  status: string;
  purpose: string;
  qrExpiresAt: Date | null;
  actualArrival: Date | null;
  visitor: { firstName: string };
  department: { name: string };
  stops: Array<{
    id: string;
    checkedInAt: Date;
    checkedOutAt: Date | null;
    building: string | null;
    department: { name: string };
  }>;
}) {
  return {
    id: visit.id,
    status: visit.status,
    purpose: visit.purpose,
    qrExpiresAt: visit.qrExpiresAt,
    actualArrival: visit.actualArrival,
    visitor: { firstName: visit.visitor.firstName },
    department: { name: visit.department.name },
    stops: visit.stops,
  };
}

export async function GET(req: NextRequest) {
  return withApiHandler(req, async ({ requestId, ip }) => {
    const rawQr = req.nextUrl.searchParams.get("qr");
    const parsedQr = qrLookupSchema.safeParse(rawQr ?? "");
    if (!parsedQr.success) {
      return jsonError(400, "Missing or invalid qr parameter.", requestId);
    }
    const qr = parsedQr.data;

    const user = await getSession();

    const ipLimit = await rateLimit(`lookup:ip:${ip ?? "unknown"}`, LIMITS.lookupPerIp(), WINDOWS.short);
    const qrLimit = await rateLimit(`lookup:qr:${qr}`, LIMITS.lookupPerQr(), WINDOWS.short);
    const userLimit = user
      ? await rateLimit(`lookup:user:${user.userId}`, LIMITS.lookupPerUser(), WINDOWS.short)
      : { ok: true as const, remaining: 0 };

    if (!ipLimit.ok || !qrLimit.ok || !userLimit.ok) {
      const retry =
        (!ipLimit.ok && ipLimit.retryAfterSeconds) ||
        (!qrLimit.ok && qrLimit.retryAfterSeconds) ||
        (!userLimit.ok && userLimit.retryAfterSeconds) ||
        60;
      return rateLimitResponse(retry, requestId);
    }

    const visit = await db.visit.findUnique({
      where: { qrCode: qr },
      include: {
        visitor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            idType: true,
            idNumber: true,
          },
        },
        department: { select: { id: true, name: true, building: true } },
        stops: {
          include: { department: { select: { name: true } } },
          orderBy: { checkedInAt: "asc" },
        },
      },
    });

    if (!visit) {
      await recordAudit({
        actorId: user?.userId,
        actorEmail: user?.email,
        action: "QR_LOOKUP",
        result: "FAILURE",
        targetType: "qr",
        ip,
        requestId,
        // The submitted QR value itself is intentionally not persisted.
        meta: { reason: "not_found", channel: user ? "staff" : "kiosk" },
      });
      return jsonError(404, "Visit not found", requestId);
    }

    const now = Date.now();
    const expired = Boolean(visit.qrExpiresAt && visit.qrExpiresAt.getTime() < now);
    const revoked = Boolean(visit.qrRevokedAt);
    if (expired || revoked) {
      await recordAudit({
        actorId: user?.userId,
        actorEmail: user?.email,
        action: "QR_LOOKUP",
        result: "DENIED",
        targetType: "visit",
        targetId: visit.id,
        ip,
        requestId,
        meta: { reason: expired ? "expired" : "revoked", channel: user ? "staff" : "kiosk" },
      });
      return jsonError(403, "This QR code is no longer valid.", requestId);
    }

    await recordAudit({
      actorId: user?.userId,
      actorEmail: user?.email,
      action: "QR_SCANNED",
      result: "SUCCESS",
      targetType: "visit",
      targetId: visit.id,
      ip,
      requestId,
      meta: { channel: user ? "staff" : "kiosk" },
    });

    const body = user ? staffProjection(visit) : kioskProjection(visit);
    const res = jsonOk(body);
    for (const [key, value] of Object.entries(NO_STORE)) res.headers.set(key, value);
    return res;
  });
}
