import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, Button, Card, Badge, EmptyState, Input } from "@/components/ui";
import { Plus, Search, Eye } from "lucide-react";

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const visitors = await db.visitor.findMany({
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
  });

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
              defaultValue={q}
              className="pl-9"
            />
          </form>
        </div>

        {visitors.length === 0 ? (
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
                  <th className="px-5 py-3"></th>
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
                      <Link href={`/visitors/${v.id}`}>
                        <Button variant="ghost" className="text-[var(--brand)]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
