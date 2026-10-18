import { PH_TZ, manilaMidnight, manilaParts } from "@/lib/ph-time";

export const REPORT_PERIODS = ["day", "week", "month", "year"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export function isReportPeriod(value: string | undefined): value is ReportPeriod {
  return value !== undefined && (REPORT_PERIODS as readonly string[]).includes(value);
}



export type ReportRange = { start: Date; end: Date; label: string };

/**
 * Resolves the [start, end) range and a human label for a period, in Philippine
 * time. `Date.UTC` normalises the day/month/year overflow, so `day + 1` and
 * `month + 1` roll over on their own.
 */
export function resolveReportRange(period: ReportPeriod, now = new Date()): ReportRange {
  const { year, month, day, weekday } = manilaParts(now);
  let start: Date;
  let end: Date;

  switch (period) {
    case "day": {
      start = manilaMidnight(year, month, day);
      end = manilaMidnight(year, month, day + 1);
      break;
    }
    case "week": {
      const mondayOffset = weekday === 0 ? 6 : weekday - 1;
      start = manilaMidnight(year, month, day - mondayOffset);
      end = manilaMidnight(year, month, day - mondayOffset + 7);
      break;
    }
    case "month": {
      start = manilaMidnight(year, month, 1);
      end = manilaMidnight(year, month + 1, 1);
      break;
    }
    case "year": {
      start = manilaMidnight(year, 0, 1);
      end = manilaMidnight(year + 1, 0, 1);
      break;
    }
  }

  const lastDay = new Date(end.getTime() - 1);
  const long: Intl.DateTimeFormatOptions = { timeZone: PH_TZ, month: "long", day: "numeric", year: "numeric" };
  let label: string;
  if (period === "day") {
    label = start.toLocaleDateString("en-PH", { timeZone: PH_TZ, weekday: "long", ...long });
  } else if (period === "week") {
    const sameMonth = manilaParts(start).month === manilaParts(lastDay).month;
    const from = start.toLocaleDateString("en-PH", sameMonth ? { timeZone: PH_TZ, month: "long", day: "numeric" } : long);
    label = `${from} – ${lastDay.toLocaleDateString("en-PH", long)}`;
  } else if (period === "month") {
    label = start.toLocaleDateString("en-PH", { timeZone: PH_TZ, month: "long", year: "numeric" });
  } else {
    label = String(manilaParts(start).year);
  }

  return { start, end, label };
}

/** RFC 4180-ish CSV cell escaping. */
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
