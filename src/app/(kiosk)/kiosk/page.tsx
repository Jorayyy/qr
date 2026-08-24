"use client";

import { useState } from "react";
import { QrCode, UserPlus, ScanLine } from "lucide-react";
import Link from "next/link";

export default function KioskPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-white">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
        <QrCode className="h-10 w-10" />
      </div>

      <h1 className="mb-2 text-4xl font-bold">Visitor Management</h1>
      <p className="mb-12 text-lg text-blue-100">Welcome to the university. Please register below.</p>

      <div className="grid w-full max-w-md gap-4">
        <Link
          href="/kiosk/register"
          className="flex items-center gap-4 rounded-2xl bg-white p-6 text-blue-800 shadow-xl transition hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <UserPlus className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold">Register as Visitor</p>
            <p className="text-sm text-blue-600">First-time or returning visitors</p>
          </div>
        </Link>

        <Link
          href="/kiosk/scan"
          className="flex items-center gap-4 rounded-2xl bg-white/10 p-6 text-white backdrop-blur transition hover:bg-white/20"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ScanLine className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-bold">Already have a QR code?</p>
            <p className="text-sm text-blue-200">Show it at the guard station</p>
          </div>
        </Link>
      </div>

      <p className="mt-12 text-xs text-blue-300">Touch screen to begin</p>
    </div>
  );
}
