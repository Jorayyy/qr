import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, getRequestContext } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { searchQuerySchema } from "@/lib/validation";
import { PageHeader, Button, Card, Badge, EmptyState, Input } from "@/components/ui";
import { Plus, Search } from "lucide-react";
import { DeleteVisitorButton } from "./actions-client";

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requirePermission("visitor:read");
  const mayDelete = can(user.role, "visitor:delete");
  const { q: rawQ } = await searchParams;

  const search = rawQ ? searchQuerySchema.safeParse(rawQ) : null;
  const q = search?.success && search.data ? search.data : undefined;

  let blocked = false;
  if (q) {
    const limit = await rateLimit(`search:user:${user.userId}`, LIMITS.searchPerUser(), WINDOWS.short);
    blocked = !limit.ok;
  }

  const visitors = !blocked
    ? await db.visitor.findMany({
        where: q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        include: { visits: { select: { id: true } } },
      })
    : [];

  if (blocked) {
    const ctx = await getRequestContext();
    await recordAudit({
      actorId: user.userId,
      actorEmail: user.email,
      action: "SEARCH_RATE_LIMITED",
      result: "DENIED",
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
  }

  return (
    <div>
      <PageHeader
        title="Visitors"
        subtitle="Manage registered visitors"
        actions={
          <Link href="/visitors/register">
            <Button>
              <Plus className="h-4 w-4" />
              Register Visitor
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="border-b border-[var(--border)] px-5 py-3">
          <form className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              name="q"
              placeholder="Search by name or email..."
              defaultValue={rawQ ? rawQ.slice(0, 100) : undefined}
              maxLength={100}
              className="pl-9"
            />
          </form>
        </div>

        {blocked ? (
          <EmptyState
            title="Too many searches"
            hint="Please wait a moment before searching again."
          />
        ) : visitors.length === 0 ? (
          <EmptyState
            title="No visitors found"
            hint={q ? "Try a different search term." : "Register your first visitor to get started."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">ID Type</th>
                  <th className="px-5 py-3">Total Visits</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium">
                      {v.firstName} {v.lastName}
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.email ?? "—"}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.company ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge>{v.idType.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center font-medium">{v.visits.length}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/visitors/${v.id}`}>
                          <Button variant="secondary" className="text-xs">
                            View
                          </Button>
                        </Link>
                        {mayDelete && <DeleteVisitorButton visitorId={v.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
