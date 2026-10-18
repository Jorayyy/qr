export const REPORT_PERIODS = ["day", "week", "month", "year"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export function isReportPeriod(value: string | undefined): value is ReportPeriod {
  return value !== undefined && (REPORT_PERIODS as readonly string[]).includes(value);
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Start of the ISO week (Monday). */
function startOfWeek(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

export type ReportRange = { start: Date; end: Date; label: string };

/** Resolves the [start, end) range and a human label for a period. Uses en-PH. */
export function resolveReportRange(period: ReportPeriod, now = new Date()): ReportRange {
  let start: Date;
  let end: Date;

  switch (period) {
    case "day": {
      start = startOfDay(now);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    }
    case "week": {
      start = startOfWeek(now);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    }
    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    }
    case "year": {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    }
  }

  const lastDay = new Date(end.getTime() - 1);
  const long: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  let label: string;
  if (period === "day") {
    label = start.toLocaleDateString("en-PH", { weekday: "long", ...long });
  } else if (period === "week") {
    const sameMonth = start.getMonth() === lastDay.getMonth();
    const from = start.toLocaleDateString("en-PH", sameMonth ? { month: "long", day: "numeric" } : long);
    label = `${from} – ${lastDay.toLocaleDateString("en-PH", long)}`;
  } else if (period === "month") {
    label = start.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  } else {
    label = String(start.getFullYear());
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
