import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Badge, Button, PageHeader, EmptyState, iconActionClass } from "@/components/ui";
import { Plus, Pencil, Building2 } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { ToggleForm, DeleteForm } from "./actions-client";

export default async function DepartmentsPage() {
  await requirePermission("department:manage");

  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { visits: true, visitStops: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage university departments"
        actions={
          <Link href="/departments/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </Link>
        }
      />

      {departments.length === 0 ? (
        <Card>
          <EmptyState title="No departments" hint="Add a department to get started." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {departments.map((d) => (
            <Card
              key={d.id}
              className="group relative flex aspect-square flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <Building2
                aria-hidden
                className="pointer-events-none absolute -bottom-7 -right-6 h-44 w-44 text-[var(--brand)]/[0.06] transition-colors group-hover:text-[var(--brand)]/10"
              />

              <div className="relative flex flex-1 flex-col justify-between gap-3 p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold">{d.name}</h3>
                      {d.building && (
                        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{d.building}</p>
                      )}
                    </div>
                    <Badge tone={d.isActive ? "green" : "gray"}>
                      {d.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {(d.contactPerson || d.contactEmail) && (
                    <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                      {d.contactPerson && <p className="truncate">Contact: {d.contactPerson}</p>}
                      {d.contactEmail && <p className="truncate">Email: {d.contactEmail}</p>}
                    </div>
                  )}
                </div>

                <div className="flex gap-5">
                  <div>
                    <p className="text-xl font-bold leading-none tabular-nums">{d._count.visits}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">visit(s)</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none tabular-nums">{d._count.visitStops}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">stop(s)</p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] bg-white/85 px-4 py-2.5 opacity-100 backdrop-blur transition-opacity duration-200 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <Link
                  href={`/departments/${d.id}/edit`}
                  className={iconActionClass("brand")}
                  title="Edit department"
                  aria-label="Edit department"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <ToggleForm departmentId={d.id} isActive={d.isActive} />
                <DeleteForm departmentId={d.id} visitCount={d._count.visits} stopCount={d._count.visitStops} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
