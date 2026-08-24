import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { ArrowLeft, Mail, Phone, Building2, CreditCard, MapPin } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visitor = await db.visitor.findUnique({
    where: { id },
    include: {
      visits: {
        orderBy: { createdAt: "desc" },
        include: {
          department: true,
          stops: { include: { department: true }, orderBy: { checkedInAt: "asc" } },
        },
      },
    },
  });

  if (!visitor) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/visitors" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">
          ← Back to Visitors
        </Link>
      </div>

      <PageHeader
        title={`${visitor.firstName} ${visitor.lastName}`}
        subtitle="Visitor profile and visit history"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Visitor Info" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.email ?? "No email"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.phone ?? "No phone"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.company ?? "No company"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-[var(--muted)]" />
              <span>{visitor.idType.replace("_", " ")}{visitor.idNumber ? ` — ${visitor.idNumber}` : ""}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Visit History" subtitle={`${visitor.visits.length} visit(s)`} />
          {visitor.visits.length === 0 ? (
            <EmptyState title="No visits yet" hint="This visitor has no recorded visits." />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {visitor.visits.map((v) => (
                <div key={v.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium">{formatDate(v.createdAt)}</span>
                    <span className="text-[var(--muted)]">{v.department.name}</span>
                    <span className="text-[var(--muted)]">{v.purpose.replace("_", " ")}</span>
                    <Badge tone={STATUS_BADGE[v.status]?.tone}>{v.status.replace("_", " ")}</Badge>
                    <span className="text-[var(--muted)]">In: {formatDate(v.actualArrival)}</span>
                    <span className="text-[var(--muted)]">Out: {formatDate(v.actualDeparture)}</span>
                  </div>

                  {v.stops.length > 0 && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Building Stops</p>
                      <div className="space-y-1.5">
                        {v.stops.map((stop, i) => (
                          <div key={stop.id} className="flex items-center gap-3 text-xs">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
                              {i + 1}
                            </span>
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="font-medium">{stop.department.name}</span>
                            {stop.building && <span className="text-[var(--muted)]">({stop.building})</span>}
                            <span className="text-[var(--muted)]">{formatDate(stop.checkedInAt)}</span>
                            {stop.checkedOutAt ? (
                              <span className="text-emerald-600">→ {formatDate(stop.checkedOutAt)}</span>
                            ) : v.status === "CHECKED_OUT" ? (
                              <span className="text-[var(--muted)]">→ Left with visit</span>
                            ) : (
                              <Badge tone="green">Currently here</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
