import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk, rateLimitResponse, withApiHandler } from "@/lib/http";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const KINDS = ["face", "id", "department"] as const;

/**
 * Stores an image in a private Blob store. Returns the blob pathname (not a
 * public URL). Visitor photos are streamed back through the authenticated
 * /api/visitor-photo route; department photos are public campus imagery and are
 * served by /api/department-photo.
 */
export async function POST(req: NextRequest) {
  return withApiHandler(req, async ({ requestId, ip }) => {
    if (!isSameOrigin(req)) return jsonError(403, "Cross-origin request blocked.", requestId);

    const user = await getSession();
    if (!user) return jsonError(403, "You are not authorized to upload photos.", requestId);
    if (!can(user.role, "visitor:write") && !can(user.role, "department:manage")) {
      return jsonError(403, "You are not authorized to upload photos.", requestId);
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonError(400, "Expected multipart form data.", requestId);
    }

    const file = form.get("file");
    const kind = form.get("kind");

    if (!(file instanceof File)) return jsonError(400, "Missing image file.", requestId);
    if (typeof kind !== "string" || !(KINDS as readonly string[]).includes(kind)) {
      return jsonError(400, "Invalid image kind.", requestId);
    }

    const isDepartment = kind === "department";
    const permission = isDepartment ? "department:manage" : "visitor:write";
    if (!can(user.role, permission)) {
      return jsonError(403, "You are not authorized to upload photos.", requestId);
    }

    const limit = await rateLimit(`upload:user:${user.userId}`, LIMITS.uploadPerUser(), WINDOWS.hour);
    if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds, requestId);

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError(415, "Only JPEG, PNG or WebP images are allowed.", requestId);
    }
    if (file.size > MAX_BYTES) {
      return jsonError(413, "Image must be 5 MB or smaller.", requestId);
    }

    const pathname = isDepartment
      ? `departments/${crypto.randomUUID()}.jpg`
      : `visitors/${crypto.randomUUID()}/${kind}.jpg`;
    const { pathname: stored } = await put(pathname, file, {
      access: "private",
      contentType: file.type,
    });

    await recordAudit({
      actorId: user.userId,
      actorEmail: user.email,
      action: isDepartment ? "DEPARTMENT_PHOTO_UPLOADED" : "VISITOR_PHOTO_UPLOADED",
      result: "SUCCESS",
      targetType: "photo",
      ip,
      requestId,
      meta: { kind },
    });

    return jsonOk({ pathname: stored });
  });
}
