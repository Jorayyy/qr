import { db } from "@/lib/db";
import { manilaParts } from "@/lib/ph-time";
import { resolveReportRange, type ReportPeriod } from "@/lib/reports";

export type TrendPoint = { label: string; count: number };

export type BreakdownRow = { name: string; count: number; percent: number };

export type ReportMetric = {
  label: string;
  value: number;
  hint: string;
  delta: number | null;
};

export type ReportData = {
  period: ReportPeriod;
  label: string;
  metrics: ReportMetric[];
  trend: { points: TrendPoint[]; peakLabel: string | null; caption: string };
  byDepartment: BreakdownRow[];
  byPurpose: BreakdownRow[];
  byStatus: BreakdownRow[];
  kpis: { inside: number; avgDuration: string; peakLabel: string | null; unique: number; returning: number };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? "a" : "p"}`;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function buildTrend(
  period: ReportPeriod,
  start: Date,
  end: Date,
  visits: Array<{ createdAt: Date }>
): { points: TrendPoint[]; peakLabel: string | null; caption: string } {
  let points: TrendPoint[];
  let caption: string;

  if (period === "day") {
    points = Array.from({ length: 24 }, (_, h) => ({ label: hourLabel(h), count: 0 }));
    caption = "Registrations per hour";
    for (const v of visits) points[manilaParts(v.createdAt).hour].count += 1;
  } else if (period === "year") {
    points = MONTHS.map((label) => ({ label, count: 0 }));
    caption = "Registrations per month";
    for (const v of visits) points[manilaParts(v.createdAt).month].count += 1;
  } else {
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    points = Array.from({ length: days }, (_, i) => ({
      label: period === "week" ? WEEKDAYS[i] : String(i + 1),
      count: 0,
    }));
    caption = period === "week" ? "Registrations per day" : "Registrations per day of month";
    for (const v of visits) {
      const index = Math.floor((v.createdAt.getTime() - start.getTime()) / 86_400_000);
      if (index >= 0 && index < points.length) points[index].count += 1;
    }
  }

  const peak = points.reduce((best, p) => (p.count > best.count ? p : best), points[0]);
  return { points, peakLabel: peak && peak.count > 0 ? peak.label : null, caption };
}

function toBreakdown(entries: Array<[string, number]>): BreakdownRow[] {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return entries
    .map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function buildReport(period: ReportPeriod): Promise<ReportData> {
  const { start, end, label } = resolveReportRange(period);
  const range = { gte: start, lt: end };
  const previous = resolveReportRange(period, new Date(start.getTime() - 1));
  const previousRange = { gte: previous.start, lt: previous.end };

  const [visits, prevRegistered, prevArrived, prevExited, prevCancelled, inside, departments] =
    await Promise.all([
      db.visit.findMany({
        where: { createdAt: range },
        select: {
          visitorId: true,
          createdAt: true,
          status: true,
          purpose: true,
          departmentId: true,
          actualArrival: true,
          actualDeparture: true,
        },
      }),
      db.visit.count({ where: { createdAt: previousRange } }),
      db.visit.count({
        where: { createdAt: previousRange, status: { in: ["CHECKED_IN", "CHECKED_OUT"] } },
      }),
      db.visit.count({ where: { createdAt: previousRange, status: "CHECKED_OUT" } }),
      db.visit.count({ where: { createdAt: previousRange, status: "CANCELLED" } }),
      db.visit.count({ where: { status: "CHECKED_IN" } }),
      db.department.findMany({ select: { id: true, name: true } }),
    ]);

  const registered = visits.length;
  const arrived = visits.filter((v) => v.status === "CHECKED_IN" || v.status === "CHECKED_OUT").length;
  const exited = visits.filter((v) => v.status === "CHECKED_OUT").length;
  const cancelled = visits.filter((v) => v.status === "CANCELLED").length;

  const metrics: ReportMetric[] = [
    { label: "Registered", value: registered, hint: "visits in this period", delta: deltaPct(registered, prevRegistered) },
    { label: "Arrived", value: arrived, hint: "of those, checked in", delta: deltaPct(arrived, prevArrived) },
    { label: "Exited", value: exited, hint: "of those, checked out", delta: deltaPct(exited, prevExited) },
    { label: "Cancelled", value: cancelled, hint: "of those, cancelled", delta: deltaPct(cancelled, prevCancelled) },
  ];

  const trend = buildTrend(period, start, end, visits);

  const deptName = new Map(departments.map((d) => [d.id, d.name]));
  const deptCounts = new Map<string, number>();
  const purposeCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  for (const v of visits) {
    const dept = deptName.get(v.departmentId) ?? "Unknown";
    deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + 1);
    purposeCounts.set(v.purpose, (purposeCounts.get(v.purpose) ?? 0) + 1);
    statusCounts.set(v.status, (statusCounts.get(v.status) ?? 0) + 1);
  }

  const byDepartment = toBreakdown([...deptCounts.entries()]);
  const byPurpose = toBreakdown(
    [...purposeCounts.entries()].map(([key, count]) => [PURPOSE_LABEL[key] ?? key, count])
  );
  const byStatus = toBreakdown(
    [...statusCounts.entries()].map(([key, count]) => [STATUS_LABEL[key] ?? key, count])
  );

  const visitorIds = [...new Set(visits.map((v) => v.visitorId))];
  const returningRows = visitorIds.length
    ? await db.visit.findMany({
        where: { visitorId: { in: visitorIds }, createdAt: { lt: start } },
        select: { visitorId: true },
        distinct: ["visitorId"],
      })
    : [];
  const returning = returningRows.length;

  const durations = visits
    .filter((v) => v.actualArrival && v.actualDeparture)
    .map((v) => v.actualDeparture!.getTime() - v.actualArrival!.getTime());
  const avgDuration = durations.length
    ? formatDuration(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : "—";

  return {
    period,
    label,
    metrics,
    trend,
    byDepartment,
    byPurpose,
    byStatus,
    kpis: { inside, avgDuration, peakLabel: trend.peakLabel, unique: visitorIds.length, returning },
  };
}
