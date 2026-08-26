"use client";

import { useActionState } from "react";
import { Card, CardHeader, Input, Button } from "@/components/ui";
import { updateDepartmentAction, type DepartmentActionState } from "@/lib/actions/departments";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

type Department = {
  id: string;
  name: string;
  building: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
};

export default function EditDepartmentForm({ department }: { department: Department }) {
  const updateWithId = updateDepartmentAction.bind(null, department.id);
  const [state, formAction, pending] = useActionState<DepartmentActionState, FormData>(
    updateWithId,
    { success: false, message: "" }
  );

  if (state.success) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-lg font-bold">Department Updated!</h2>
          <div className="mt-6">
            <Link href="/departments">
              <Button>
                <ArrowLeft className="h-4 w-4" />
                Back to Departments
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4">
        <Link href="/departments" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">
          ← Back to Departments
        </Link>
      </div>

      <Card>
        <CardHeader title="Edit Department" subtitle={`Editing: ${department.name}`} />

        <form action={formAction} className="space-y-5 p-5">
          {state.message && !state.success && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
          )}

          <div>
            <label className="label">Department Name *</label>
            <Input name="name" required defaultValue={department.name} />
          </div>

          <div>
            <label className="label">Building (Optional)</label>
            <Input name="building" defaultValue={department.building ?? ""} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Contact Person (Optional)</label>
              <Input name="contactPerson" defaultValue={department.contactPerson ?? ""} />
            </div>
            <div>
              <label className="label">Contact Email (Optional)</label>
              <Input name="contactEmail" type="email" defaultValue={department.contactEmail ?? ""} />
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
