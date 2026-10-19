"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import { REPORT_PERIODS, type ReportPeriod } from "@/lib/reports";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
};

export function PeriodFilter({ period }: { period: ReportPeriod }) {
  const router = useRouter();
  return (
    <Select
      aria-label="Report period"
      value={period}
      onChange={(e) => router.push(`/reports?period=${e.target.value}`)}
      className="w-40"
    >
      {REPORT_PERIODS.map((p) => (
        <option key={p} value={p}>
          {PERIOD_LABELS[p]}
        </option>
      ))}
    </Select>
  );
}
