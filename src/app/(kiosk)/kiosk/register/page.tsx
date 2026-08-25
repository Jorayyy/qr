"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Card, CardHeader, Input, Select, Button } from "@/components/ui";
import { registerVisitorAction, type ActionState } from "@/lib/actions/visitors";
import { QrCode, ArrowLeft, CheckCircle, Building2 } from "lucide-react";
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

function QRCodeDisplay({ qrString }: { qrString: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (canvasRef.current && qrString) {
      QRCode.toCanvas(canvasRef.current, qrString, {
        width: 300,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
      QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      }).then(setDataUrl);
    }
  }, [qrString]);

  function downloadQR() {
    const link = document.createElement("a");
    link.download = `QR-${qrString}.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl && (
        <>
          <div className="rounded-2xl bg-white p-6 shadow-2xl">
            <img src={dataUrl} alt={`QR Code`} width={300} height={300} />
          </div>
          <p className="mt-4 font-mono text-sm font-bold text-white break-all max-w-[320px] text-center">{qrString}</p>
          <button onClick={downloadQR} className="mt-4 rounded-xl bg-white/20 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/30">
            Save QR Code
          </button>
        </>
      )}
    </div>
  );
}

export default function KioskRegisterPage() {
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
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-white">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">You&apos;re Registered!</h1>
        <p className="mb-8 text-white/70">Show this QR code at each building entrance.</p>

        <QRCodeDisplay qrString={state.data.qrCode} />

        <Link
          href="/kiosk"
          className="mt-8 rounded-xl bg-white/20 px-8 py-3 text-lg font-bold text-white backdrop-blur hover:bg-white/30"
        >
          Done
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start overflow-y-auto p-4 py-8 text-white md:p-8">
      <Link href="/kiosk" className="mb-6 flex items-center gap-2 text-white/70 hover:text-white self-start">
        <ArrowLeft className="h-5 w-5" />
        Back
      </Link>

      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-3xl font-bold">Visitor Registration</h1>
        <p className="mb-6 text-white/70">Fill in your details to get a QR access pass.</p>

        <form action={formAction} className="space-y-5">
          {state.message && !state.success && (
            <div className="rounded-xl bg-red-500/20 p-4 text-sm text-red-100 backdrop-blur">{state.message}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">First Name *</label>
              <input name="firstName" required className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="Juan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Last Name *</label>
              <input name="lastName" required className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="Dela Cruz" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Phone (Optional)</label>
              <input name="phone" type="tel" className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="09XX XXX XXXX" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Email (Optional)</label>
              <input name="email" type="email" className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="you@email.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Company / School (Optional)</label>
              <input name="company" className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="University of..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">ID Type *</label>
              <select name="idType" required className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none">
                <option value="" className="text-gray-900">Select ID type</option>
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="text-gray-900">{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-white/70">ID Number (Optional)</label>
            <input name="idNumber" className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="123456789" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Department Visiting *</label>
              <select name="departmentId" required className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none">
                <option value="" className="text-gray-900">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Purpose *</label>
              <select name="purpose" required className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none">
                <option value="" className="text-gray-900">Select purpose</option>
                {PURPOSES.map((p) => (
                  <option key={p.value} value={p.value} className="text-gray-900">{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Host Name (Optional)</label>
              <input name="hostName" className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="Prof. Dela Cruz" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Host Department (Optional)</label>
              <input name="hostDepartment" className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-lg text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none" placeholder="Computer Science" />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-white py-4 text-xl font-bold text-blue-700 shadow-xl transition hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50"
          >
            {pending ? "Registering..." : "Register & Get QR Code"}
          </button>
        </form>
      </div>
    </div>
  );
}
