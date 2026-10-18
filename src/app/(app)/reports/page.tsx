import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Card, CardHeader, EmptyState, Metric, PageHeader, buttonClass, cx } from "@/components/ui";
import { Download } from "lucide-react";
import { isReportPeriod, resolveReportRange, REPORT_PERIODS, type ReportPeriod } from "@/lib/reports";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
};

const PURPOSE_LABEL: Record<string, string> = {
  ATTENDANCE: "Attendance",
  DELIVERY: "Delivery",
  INTERVIEW: "Interview",
  MEETING: "Meeting",
  SCHOOL_VISIT: "School Visit",
  OTHER: "Other",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Inside",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requirePermission("report:read");

  const { period: rawPeriod } = await searchParams;
  const period: ReportPeriod = isReportPeriod(rawPeriod) ? rawPeriod : "day";
  const { start, end, label } = resolveReportRange(period);
  const range = { gte: start, lt: end };

  const [registered, arrived, departed, cancelled, byDepartment, byPurpose, byStatus, departments] =
    await Promise.all([
      db.visit.count({ where: { createdAt: range } }),
      db.visit.count({ where: { actualArrival: range } }),
      db.visit.count({ where: { actualDeparture: range } }),
      db.visit.count({ where: { status: "CANCELLED", createdAt: range } }),
      db.visit.groupBy({ by: ["departmentId"], where: { createdAt: range }, _count: { _all: true } }),
      db.visit.groupBy({ by: ["purpose"], where: { createdAt: range }, _count: { _all: true } }),
      db.visit.groupBy({ by: ["status"], where: { createdAt: range }, _count: { _all: true } }),
      db.department.findMany({ select: { id: true, name: true } }),
    ]);

  const deptName = new Map(departments.map((d) => [d.id, d.name]));
  const deptRows = byDepartment
    .map((r) => ({ name: deptName.get(r.departmentId) ?? "Unknown", count: r._count._all }))
    .sort((a, b) => b.count - a.count);
  const maxDept = Math.max(1, ...deptRows.map((r) => r.count));

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={label}
        actions={
          <a href={`/reports/export?period=${period}`} className={buttonClass("secondary")} download>
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {REPORT_PERIODS.map((p) => (
          <Link
            key={p}
            href={`/reports?period=${p}`}
            className={cx(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              p === period
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--border)] bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col divide-y divide-[var(--border)] sm:flex-row sm:divide-x sm:divide-y-0">
          <Metric label="Registered" value={registered} hint="in this period" />
          <Metric label="Arrived" value={arrived} hint="checked in" />
          <Metric label="Exited" value={departed} hint="checked out" />
          <Metric label="Cancelled" value={cancelled} hint="cancelled visits" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="By department" subtitle="Registrations in this period" />
          {deptRows.length === 0 ? (
            <EmptyState title="No data" hint="No visits were registered in this period." />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {deptRows.map((r) => (
                <div key={r.name} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{r.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--brand)]"
                      style={{ width: `${Math.round((r.count / maxDept) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="By purpose" />
            {byPurpose.length === 0 ? (
              <EmptyState title="No data" />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {byPurpose
                  .sort((a, b) => b._count._all - a._count._all)
                  .map((r) => (
                    <li key={r.purpose} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span>{PURPOSE_LABEL[r.purpose] ?? r.purpose}</span>
                      <span className="font-semibold tabular-nums">{r._count._all}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="By status" />
            {byStatus.length === 0 ? (
              <EmptyState title="No data" />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {byStatus
                  .sort((a, b) => b._count._all - a._count._all)
                  .map((r) => (
                    <li key={r.status} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span>{STATUS_LABEL[r.status] ?? r.status}</span>
                      <span className="font-semibold tabular-nums">{r._count._all}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
