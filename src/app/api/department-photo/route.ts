import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { jsonError, withApiHandler } from "@/lib/http";

/**
 * Streams a department photo. Public by design — these are campus building
 * images shown on the visitor landing page, not personal data.
 */
export async function GET(req: NextRequest) {
  return withApiHandler(req, async ({ requestId }) => {
    const path = req.nextUrl.searchParams.get("path") ?? "";
    if (!/^departments\/[A-Za-z0-9._-]+$/.test(path)) {
      return jsonError(400, "Invalid photo reference.", requestId);
    }

    const result = await get(path, { access: "private" });
    if (!result) return jsonError(404, "Photo not found.", requestId);

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
