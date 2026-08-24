"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Card, CardHeader, Input, Select, Button } from "@/components/ui";
import { registerVisitorAction, type ActionState } from "@/lib/actions/visitors";
import { ArrowLeft, CheckCircle, Download, Printer } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

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

function QRCodeDisplay({ qrString, visitorName }: { qrString: string; visitorName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (canvasRef.current && qrString) {
      QRCode.toCanvas(canvasRef.current, qrString, {
        width: 256,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
      QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      }).then(setDataUrl);
    }
  }, [qrString]);

  function downloadQR() {
    const link = document.createElement("a");
    link.download = `QR-${visitorName.replace(/\s+/g, "-")}-${qrString}.png`;
    link.href = dataUrl;
    link.click();
  }

  function printQR() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html><head><title>QR Code - ${visitorName}</title>
        <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;flex-direction:column;}
        .info{text-align:center;margin-top:16px;}.name{font-size:18px;font-weight:bold;}.code{font-size:12px;color:#666;margin-top:4px;}</style>
        </head><body>
        <img src="${dataUrl}" width="256" height="256" />
        <div class="info"><div class="name">${visitorName}</div><div class="code">${qrString}</div></div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  }

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl && (
        <>
          <div className="rounded-xl border-2 border-[var(--brand)] bg-white p-4 shadow-sm">
            <img src={dataUrl} alt={`QR Code for ${visitorName}`} width={256} height={256} />
          </div>
          <p className="mt-3 font-mono text-xs text-[var(--muted)] break-all max-w-[280px] text-center">{qrString}</p>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={downloadQR}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="secondary" onClick={printQR}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function RegisterVisitorPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerVisitorAction,
    { success: false, message: "" }
  );
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; building: string | null }>>([]);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, []);

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
            Show or send this QR code to the visitor. They can use it at any check-in station.
          </p>

          <div className="mt-6">
            <QRCodeDisplay
              qrString={state.data.qrCode}
              visitorName={state.data.visitorId}
            />
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/visitors/register">
              <Button>Register Another</Button>
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
        <CardHeader title="Register Visitor" subtitle="Fill in details to generate a scannable QR code" />

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
              <Select name="departmentId" required>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.building ? ` (${d.building})` : ""}
                  </option>
                ))}
              </Select>
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
