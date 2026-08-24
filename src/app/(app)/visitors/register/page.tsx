"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Input, Select, Button, Badge } from "@/components/ui";
import { registerVisitorAction, type ActionState } from "@/lib/actions/visitors";
import { QrCode, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

const ID_TYPES = [
  { value: "SSS", label: "SSS" },
  { value: "TIN", label: "TIN" },
  { value: "PASSPORT", label: "Passport" },
  { value: "STUDENT_ID", label: "Student ID" },
  { value: "OTHER", label: "Other" },
] as const;

const PURPOSES = [
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "MEETING", label: "Meeting" },
  { value: "SCHOOL_VISIT", label: "School Visit" },
  { value: "OTHER", label: "Other" },
] as const;

export default function RegisterVisitorPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerVisitorAction,
    { success: false, message: "" }
  );

  if (state.success && state.data) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-lg font-bold">Visitor Registered!</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Share this QR code with the visitor for check-in.
          </p>

          <div className="mx-auto mt-6 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-[var(--brand)] bg-blue-50">
            <div className="text-center">
              <QrCode className="mx-auto h-12 w-12 text-[var(--brand)]" />
              <p className="mt-2 font-mono text-xs font-bold break-all px-2">{state.data.qrCode}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/visitors">
              <Button>View All Visitors</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">
          ← Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader title="Register Visitor" subtitle="Fill in the visitor details to generate a QR code" />

        <form action={formAction} className="space-y-6 p-5">
          {state.message && !state.success && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First Name *</label>
              <Input name="firstName" required />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <Input name="lastName" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <Input name="email" type="email" />
            </div>
            <div>
              <label className="label">Phone</label>
              <Input name="phone" type="tel" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Company / School</label>
              <Input name="company" />
            </div>
            <div>
              <label className="label">ID Type *</label>
              <Select name="idType" required>
                <option value="">Select ID type</option>
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="label">ID Number</label>
            <Input name="idNumber" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Department *</label>
              <Input name="departmentId" required placeholder="Department ID" />
            </div>
            <div>
              <label className="label">Purpose *</label>
              <Select name="purpose" required>
                <option value="">Select purpose</option>
                {PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Host Name</label>
              <Input name="hostName" />
            </div>
            <div>
              <label className="label">Host Department</label>
              <Input name="hostDepartment" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <Input name="notes" />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Registering..." : "Register Visitor & Generate QR"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
