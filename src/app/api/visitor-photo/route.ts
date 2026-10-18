import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { jsonError, withApiHandler } from "@/lib/http";

/** Streams a private visitor photo to authenticated staff only. */
export async function GET(req: NextRequest) {
  return withApiHandler(req, async ({ requestId }) => {
    const user = await getSession();
    if (!user || !can(user.role, "visitor:read")) {
      return jsonError(403, "You are not authorized to view this photo.", requestId);
    }

    const path = req.nextUrl.searchParams.get("path") ?? "";
    if (!/^visitors\/[A-Za-z0-9._/-]+$/.test(path)) {
      return jsonError(400, "Invalid photo reference.", requestId);
    }

    const result = await get(path, { access: "private" });
    if (!result) return jsonError(404, "Photo not found.", requestId);

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "image/jpeg",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
