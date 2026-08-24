import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { ArrowLeft, Mail, Phone, Building2, CreditCard } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, { tone: "blue" | "green" | "red" | "gray" }> = {
  PENDING: { tone: "blue" },
  CHECKED_IN: { tone: "green" },
  CHECKED_OUT: { tone: "gray" },
  CANCELLED: { tone: "red" },
};

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visitor = await db.visitor.findUnique({
    where: { id },
    include: {
      visits: {
        orderBy: { createdAt: "desc" },
        include: { department: true },
      },
    },
  });

  if (!visitor) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/visitors" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">
          ← Back to Visitors
        </Link>
      </div>

      <PageHeader
        title={`${visitor.firstName} ${visitor.lastName}`}
        subtitle="Visitor profile and visit history"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Visitor Info" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.email ?? "No email"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.phone ?? "No phone"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.company ?? "No company"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.idType.replace("_", " ")}{visitor.idNumber ? ` — ${visitor.idNumber}` : ""}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Visit History" subtitle={`${visitor.visits.length} visit(s)`} />
          {visitor.visits.length === 0 ? (
            <EmptyState title="No visits yet" hint="This visitor has no recorded visits." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Purpose</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Check In</th>
                    <th className="px-5 py-3">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {visitor.visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">{formatDate(v.createdAt)}</td>
                      <td className="px-5 py-3 text-[var(--muted)]">{v.department.name}</td>
                      <td className="px-5 py-3 text-[var(--muted)]">{v.purpose.replace("_", " ")}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_BADGE[v.status]?.tone}>{v.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-5 py-3 text-[var(--muted)]">{formatDate(v.actualArrival)}</td>
                      <td className="px-5 py-3 text-[var(--muted)]">{formatDate(v.actualDeparture)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
