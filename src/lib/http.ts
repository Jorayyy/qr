import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

export function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/**
 * Origin check for state-changing route handlers (defense in depth on top of
 * SameSite=Lax cookies). Cross-site browsers always send an Origin header;
 * requests without one are non-browser clients that cannot carry victim cookies
 * cross-site anyway. Mismatched origins are rejected.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin || origin === "null") return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

export function jsonError(status: number, message: string, requestId?: string, retryAfter?: number): NextResponse {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (requestId) headers["X-Request-Id"] = requestId;
  if (retryAfter !== undefined) headers["Retry-After"] = String(retryAfter);
  return NextResponse.json({ error: message, requestId }, { status, headers });
}

export function jsonOk(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function rateLimitResponse(retryAfterSeconds: number, requestId?: string): NextResponse {
  return jsonError(429, "Too many requests. Please try again later.", requestId, retryAfterSeconds);
}

function prismaStatus(error: unknown): number | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return 409;
    if (error.code === "P2025" || error.code === "P2003") return 404;
  }
  return null;
}

type HandlerCtx = { requestId: string; ip: string | null };

/**
 * Wraps a route handler with a correlation id and safe error handling:
 * stack traces, DB errors and secrets never reach the client; full detail is
 * logged server-side.
 */
export async function withApiHandler(
  req: NextRequest,
  handler: (ctx: HandlerCtx) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  try {
    const res = await handler({ requestId, ip: clientIp(req) });
    res.headers.set("X-Request-Id", requestId);
    return res;
  } catch (error) {
    const mapped = prismaStatus(error);
    if (mapped) {
      return jsonError(mapped, mapped === 409 ? "Conflict." : "Not found.", requestId);
    }
    console.error(
      JSON.stringify({
        level: "error",
        event: "UNHANDLED_API_ERROR",
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    );
    return jsonError(500, "Internal server error.", requestId);
  }
}
