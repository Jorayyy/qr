import { Card, CardHeader, EmptyState, Metric, cx } from "@/components/ui";
import type { BreakdownRow, ReportData, TrendPoint } from "@/lib/report-data";

function TrendChart({ points }: { points: TrendPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const labelEvery = points.length <= 12 ? 1 : Math.ceil(points.length / 12);
  return (
    <div>
      <div className="flex h-44 items-end gap-1">
        {points.map((p) => {
          const height = p.count ? `${Math.max(Math.round((p.count / max) * 100), 4)}%` : "2px";
          return (
            <div key={p.label} className="group flex h-full flex-1 items-end">
              <div
                style={{ height }}
                title={`${p.label} — ${p.count} registration${p.count === 1 ? "" : "s"}`}
                className={cx(
                  "relative w-full rounded-t-sm transition-colors",
                  p.count ? "bg-[var(--brand)]/80 group-hover:bg-[var(--brand)]" : "bg-slate-200"
                )}
              >
                {p.count > 0 && (
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white group-hover:block">
                    {p.count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] tabular-nums text-[var(--muted)]">
        {points.map((p, i) => (
          <div key={p.label} className="flex-1 text-center">
            {i % labelEvery === 0 ? p.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: BreakdownRow[] }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {rows.length === 0 ? (
        <EmptyState title="No data" hint="Nothing was recorded in this period." />
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {rows.map((r) => (
            <div key={r.name} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{r.name}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold">{r.count}</span>
                  <span className="ml-2 text-xs text-[var(--muted)]">{r.percent}%</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${r.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ReportView({ data }: { data: ReportData }) {
  const { metrics, trend, kpis } = data;
  const newVisitors = Math.max(0, kpis.unique - kpis.returning);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col divide-y divide-[var(--border)] sm:flex-row sm:divide-x sm:divide-y-0">
          {metrics.map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} hint={m.hint} delta={m.delta} />
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col divide-y divide-[var(--border)] sm:flex-row sm:divide-x sm:divide-y-0">
          <Metric label="Inside now" value={kpis.inside} hint="currently on site" />
          <Metric label="Avg visit duration" value={kpis.avgDuration} hint="checked-out visits" />
          <Metric label="Peak" value={kpis.peakLabel ?? "—"} hint="busiest time this period" />
          <Metric
            label="Unique visitors"
            value={kpis.unique}
            hint={`${newVisitors} new · ${kpis.returning} returning`}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Visits over time" subtitle={trend.caption} />
        <div className="p-5">
          {metrics[0].value === 0 ? (
            <EmptyState title="No data" hint="The chart fills in once visits are registered." />
          ) : (
            <TrendChart points={trend.points} />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <BreakdownCard title="By department" subtitle="Share of registrations" rows={data.byDepartment} />
        <div className="space-y-4">
          <BreakdownCard title="By purpose" subtitle="Share of registrations" rows={data.byPurpose} />
          <BreakdownCard title="By status" subtitle="Share of registrations" rows={data.byStatus} />
        </div>
      </div>
    </div>
  );
}
