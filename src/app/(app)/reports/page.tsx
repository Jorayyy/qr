import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PageHeader, buttonClass, cx } from "@/components/ui";
import { Download } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { ReportView } from "@/components/report-view";
import { buildReport } from "@/lib/report-data";
import { isReportPeriod, REPORT_PERIODS, type ReportPeriod } from "@/lib/reports";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requirePermission("report:read");

  const { period: rawPeriod } = await searchParams;
  const period: ReportPeriod = isReportPeriod(rawPeriod) ? rawPeriod : "day";
  const data = await buildReport(period);

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Reports"
          subtitle={data.label}
          actions={
            <div className="flex items-center gap-2">
              <PrintButton />
              <a href={`/reports/export?period=${period}`} className={buttonClass("secondary")} download>
                <Download className="h-4 w-4" />
                CSV
              </a>
            </div>
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
      </div>

      {/* Print-only heading, since the interactive header is hidden when printing. */}
      <div className="mb-4 hidden print:block">
        <h1 className="text-2xl font-bold tracking-tight">Visitor Report</h1>
        <p className="text-sm text-[var(--muted)]">
          {data.label} · generated {new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <ReportView data={data} />
    </div>
  );
}
