import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { clientIp, jsonOk, rateLimitResponse, withApiHandler } from "@/lib/http";

/**
 * Public, low-sensitivity department list required by the registration forms.
 * Fields are an explicit allow-list (id, name, building — public campus data,
 * no emails/contacts). Rate-limited; intentionally unauthenticated and
 * documented as such.
 */
export async function GET(req: NextRequest) {
  return withApiHandler(req, async ({ requestId }) => {
    const ip = clientIp(req);
    const limit = await rateLimit(
      `departments:ip:${ip ?? "unknown"}`,
      LIMITS.departmentsPerIp(),
      WINDOWS.short
    );
    if (!limit.ok) {
      return rateLimitResponse(limit.retryAfterSeconds, requestId);
    }

    const departments = await db.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, building: true },
    });
    return jsonOk(departments);
  });
}
