import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, Badge, Button, PageHeader, EmptyState } from "@/components/ui";
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ToggleForm, DeleteForm } from "./actions-client";

export default async function DepartmentsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold">{d.name}</h3>
                    {d.building && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{d.building}</p>
                    )}
                  </div>
                  <Badge tone={d.isActive ? "green" : "gray"}>
                    {d.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {(d.contactPerson || d.contactEmail) && (
                  <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                    {d.contactPerson && <p>Contact: {d.contactPerson}</p>}
                    {d.contactEmail && <p>Email: {d.contactEmail}</p>}
                  </div>
                )}

                <div className="mt-3 flex gap-3 text-xs text-[var(--muted)]">
                  <span>{d._count.visits} visit(s)</span>
                  <span>{d._count.visitStops} stop(s)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-[var(--border)] px-5 py-3">
                <Link href={`/departments/${d.id}/edit`} className="text-xs font-medium text-[var(--brand)] hover:underline">
                  <Pencil className="inline h-3 w-3 mr-1" />
                  Edit
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
