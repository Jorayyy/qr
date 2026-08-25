"use client";

import { QrCode, UserPlus, ScanLine } from "lucide-react";
import Link from "next/link";

export default function KioskPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-white">
      <div className="mb-8 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
        <img src="/logo.png" alt="EVSU Logo" className="h-full w-full object-contain p-1" />
      </div>

      <h1 className="mb-2 text-4xl font-bold drop-shadow-lg">Visitor Management</h1>
      <p className="mb-12 text-lg text-white/70 drop-shadow">Welcome to the university. Please register below.</p>

      <div className="grid w-full max-w-md gap-4">
        <Link
          href="/kiosk/register"
          className="group flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-white/20 hover:shadow-white/10"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-lg transition group-hover:bg-white/25">
            <UserPlus className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-bold">Register as Visitor</p>
            <p className="text-sm text-white/60">First-time or returning visitors</p>
          </div>
        </Link>

        <Link
          href="/kiosk/scan"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl transition hover:bg-white/15"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 transition group-hover:bg-white/20">
            <ScanLine className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-bold">Already have a QR code?</p>
            <p className="text-sm text-white/50">Show it at the guard station</p>
          </div>
        </Link>
      </div>

      <p className="mt-12 text-xs text-white/50">Touch screen to begin</p>

      <a href="/login" className="fixed bottom-4 right-4 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/40 backdrop-blur transition hover:bg-white/20 hover:text-white/70">
        Staff Login
      </a>
    </div>
  );
}
