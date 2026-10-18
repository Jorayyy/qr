import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { isReportPeriod, resolveReportRange, toCsv } from "@/lib/reports";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || !can(user.role, "report:read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const raw = req.nextUrl.searchParams.get("period") ?? undefined;
  const period = isReportPeriod(raw) ? raw : "day";
  const { start, end, label } = resolveReportRange(period);

  const visits = await db.visit.findMany({
    where: { createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "asc" },
    include: { visitor: true, department: { select: { name: true } } },
  });

  const iso = (d: Date | null | undefined) => (d ? d.toISOString() : "");

  const rows: Array<Array<unknown>> = [
    ["Report period", label],
    ["Generated at", new Date().toISOString()],
    [],
    [
      "Visitor",
      "Email",
      "Phone",
      "Company",
      "ID Type",
      "ID Number",
      "Department",
      "Purpose",
      "Status",
      "Host",
      "Expected arrival",
      "Arrived",
      "Exited",
      "Registered",
    ],
    ...visits.map((v) => [
      `${v.visitor.firstName} ${v.visitor.lastName}`,
      v.visitor.email ?? "",
      v.visitor.phone ?? "",
      v.visitor.company ?? "",
      v.visitor.idType,
      v.visitor.idNumber ?? "",
      v.department.name,
      v.purpose,
      v.status,
      v.hostName ?? "",
      iso(v.expectedArrival),
      iso(v.actualArrival),
      iso(v.actualDeparture),
      iso(v.createdAt),
    ]),
  ];

  const filename = `visitor-report-${period}-${start.toISOString().slice(0, 10)}.csv`;
  return new Response("\uFEFF" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
