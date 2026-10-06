import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Card, CardHeader, PageHeader, Button, EmptyState, Avatar, Metric, cx } from "@/components/ui";
import { RelativeTime } from "@/components/relative-time";
import { QrCode, Plus, ArrowRight } from "lucide-react";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;

const STATUS_TEXT: Record<string, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Inside",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
};

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-slate-400",
  CHECKED_IN: "bg-emerald-500",
  CHECKED_OUT: "bg-slate-300",
  CANCELLED: "bg-red-500",
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function ArrivalsChart({
  buckets,
  peakIndex,
}: {
  buckets: Array<{ hour: number; count: number }>;
  peakIndex: number;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {buckets.map((b, i) => {
          const height = b.count ? `${Math.max(Math.round((b.count / max) * 100), 5)}%` : "2px";
          const isPeak = i === peakIndex && b.count > 0;
          return (
            <div key={b.hour} className="group flex h-full flex-1 items-end">
              <div
                style={{ height }}
                title={`${String(b.hour).padStart(2, "0")}:00 — ${b.count} arrival${b.count === 1 ? "" : "s"}`}
                className={cx(
                  "relative w-full rounded-t-sm transition-colors",
                  b.count
                    ? isPeak
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--brand)]/80 group-hover:bg-[var(--brand)]"
                    : "bg-slate-200"
                )}
              >
                {b.count > 0 && (
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white group-hover:block">
                    {b.count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 text-[10px] tabular-nums text-[var(--muted)]">
        {buckets.map((b) => (
          <div key={b.hour} className="flex-1 text-center">
            {b.hour % 2 === 0 ? String(b.hour).padStart(2, "0") : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  await requirePermission("visit:read");

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalToday, yesterdayTotal, checkedIn, checkedOut, pending, todaysVisits, openStops, recentVisits] =
    await Promise.all([
      db.visit.count({ where: { createdAt: { gte: today } } }),
      db.visit.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      db.visit.count({ where: { status: "CHECKED_IN" } }),
      db.visit.count({ where: { status: "CHECKED_OUT" } }),
      db.visit.count({ where: { status: "PENDING", createdAt: { gte: today } } }),
      db.visit.findMany({
        where: { createdAt: { gte: today, lt: tomorrow } },
        select: { actualArrival: true, createdAt: true },
      }),
      db.visitStop.findMany({
        where: { checkedOutAt: null },
        select: { department: { select: { name: true } } },
      }),
      db.visit.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { visitor: true, department: true },
      }),
    ]);

  const delta = yesterdayTotal > 0 ? Math.round(((totalToday - yesterdayTotal) / yesterdayTotal) * 100) : null;

  const buckets = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => ({
    hour: DAY_START_HOUR + i,
    count: 0,
  }));
  for (const visit of todaysVisits) {
    const at = visit.actualArrival ?? visit.createdAt;
    const hour = new Date(at).getHours();
    const bucket = buckets.find((b) => b.hour === hour);
    if (bucket) bucket.count += 1;
  }
  const peakIndex = buckets.reduce(
    (best, b, i) => (b.count > buckets[best].count ? i : best),
    0
  );

  const occupancyMap = new Map<string, number>();
  for (const stop of openStops) {
    const name = stop.department?.name ?? "Unassigned";
    occupancyMap.set(name, (occupancyMap.get(name) ?? 0) + 1);
  }
  const occupancy = [...occupancyMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const occupancyMax = Math.max(1, ...occupancy.map((o) => o.count));

  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={todayLabel}
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

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col divide-y divide-[var(--border)] sm:flex-row sm:divide-x sm:divide-y-0">
          <Metric label="Registered today" value={totalToday} delta={delta} hint="vs yesterday" />
          <Metric label="Inside now" value={checkedIn} hint="awaiting checkout" />
          <Metric label="Departed" value={checkedOut} hint="all time" />
          <Metric label="Awaiting arrival" value={pending} hint="not yet scanned in" />
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Arrivals by hour" subtitle={`07:00 – 19:00 · ${totalToday} today`} />
          <div className="p-5">
            {totalToday === 0 ? (
              <EmptyState
                title="No arrivals yet"
                hint="The chart fills in as visitors are checked in today."
              />
            ) : (
              <ArrivalsChart buckets={buckets} peakIndex={peakIndex} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Inside right now" subtitle="By destination office" />
          <div className="divide-y divide-[var(--border)]">
            {occupancy.length === 0 ? (
              <EmptyState title="Building is empty" hint="Open visit stops appear here." />
            ) : (
              occupancy.map((o) => (
                <div key={o.name} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{o.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{o.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--brand)]"
                      style={{ width: `${Math.round((o.count / occupancyMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent visits"
          subtitle="Latest 10 registrations"
          action={
            <Link
              href="/visitors"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {recentVisits.length === 0 ? (
          <EmptyState title="No visits yet" hint="Visits appear here once visitors are registered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                  <th className="px-5 py-2.5">Visitor</th>
                  <th className="px-5 py-2.5">Destination</th>
                  <th className="px-5 py-2.5">Purpose</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentVisits.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/visitors/${v.id}`} className="flex items-center gap-3">
                        <Avatar name={`${v.visitor.firstName} ${v.visitor.lastName}`} />
                        <span className="font-medium">{`${v.visitor.firstName} ${v.visitor.lastName}`}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.department.name}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{v.purpose.replace("_", " ")}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={cx("h-2 w-2 rounded-full", STATUS_DOT[v.status] ?? "bg-slate-300")} />
                        <span className="text-sm">{STATUS_TEXT[v.status] ?? v.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">
                      <RelativeTime value={v.createdAt} />
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
