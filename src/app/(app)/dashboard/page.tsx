import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, Badge, PageHeader, Button, EmptyState } from "@/components/ui";
import { Users, UserCheck, UserX, Clock, QrCode, Plus } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
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

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalToday, checkedIn, checkedOut, pending] = await Promise.all([
    db.visit.count({ where: { createdAt: { gte: today } } }),
    db.visit.count({ where: { status: "CHECKED_IN" } }),
    db.visit.count({ where: { status: "CHECKED_OUT" } }),
    db.visit.count({ where: { status: "PENDING", createdAt: { gte: today } } }),
  ]);

  const recentVisits = await db.visit.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { visitor: true, department: true },
  });

  const stats = [
    { label: "Total Visitors Today", value: totalToday, icon: Users, color: "text-blue-600" },
    { label: "Checked In", value: checkedIn, icon: UserCheck, color: "text-emerald-600" },
    { label: "Checked Out", value: checkedOut, icon: UserX, color: "text-slate-500" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of today's visitor activity"
        actions={
          <div className="flex gap-2">
            <Link href="/visitors/register">
              <Button>
                <Plus className="h-4 w-4" />
                Register Visitor
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="secondary">
                <QrCode className="h-4 w-4" />
                Scan QR
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-slate-50 p-2 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-[var(--muted)]">{s.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Recent Visits" subtitle="Last 10 visits" />
        {recentVisits.length === 0 ? (
          <EmptyState title="No visits yet" hint="Visits will appear here once visitors are registered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-5 py-3">Visitor</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Purpose</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium">
                      {v.visitor.firstName} {v.visitor.lastName}
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.department.name}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.purpose.replace("_", " ")}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_BADGE[v.status]?.tone}>{v.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">{formatDate(v.createdAt)}</td>
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
