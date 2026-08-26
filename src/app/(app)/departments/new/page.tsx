"use client";

import { useActionState } from "react";
import { Card, CardHeader, Input, Button } from "@/components/ui";
import { createDepartmentAction, type DepartmentActionState } from "@/lib/actions/departments";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewDepartmentPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<DepartmentActionState, FormData>(
    createDepartmentAction,
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
          <h2 className="text-lg font-bold">Department Created!</h2>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/departments">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to Departments
              </Button>
            </Link>
            <Link href="/departments/new">
              <Button>Add Another</Button>
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
        <CardHeader title="Add Department" subtitle="Create a new department" />

        <form action={formAction} className="space-y-5 p-5">
          {state.message && !state.success && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
          )}

          <div>
            <label className="label">Department Name *</label>
            <Input name="name" required placeholder="e.g. Computer Science" />
          </div>

          <div>
            <label className="label">Building (Optional)</label>
            <Input name="building" placeholder="e.g. Tech Building" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Contact Person (Optional)</label>
              <Input name="contactPerson" placeholder="e.g. Prof. Dela Cruz" />
            </div>
            <div>
              <label className="label">Contact Email (Optional)</label>
              <Input name="contactEmail" type="email" placeholder="dept@university.edu" />
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating..." : "Create Department"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
