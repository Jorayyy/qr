"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { CameraViewport } from "@/components/camera-viewport";
import { LogIn, LogOut, ScanLine } from "lucide-react";

const CARD = "rounded-2xl border border-[var(--border)] bg-white shadow-sm";
const LABEL = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";
const INPUT = "field";

type Result = { action: "CHECKED_IN" | "CHECKED_OUT"; visitorName: string; departmentName: string; at: string };

export default function CheckinForm() {
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [scanning, setScanning] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/visits/self-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: qr.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Check-in failed.");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const checkedIn = result.action === "CHECKED_IN";
    return (
      <div className={`${CARD} p-8 text-center`}>
        <div className="mb-3 flex justify-center">
          <div className="rounded-full bg-emerald-100 p-3">
            {checkedIn ? (
              <LogIn className="h-7 w-7 text-emerald-600" />
            ) : (
              <LogOut className="h-7 w-7 text-emerald-600" />
            )}
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight">
          {checkedIn ? "You are checked in" : "You are checked out"}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Welcome, {result.visitorName}. Your {checkedIn ? "arrival at" : "exit from"}{" "}
          {result.departmentName} is recorded.
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {new Date(result.at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <button
          type="button"
          className={buttonClass("secondary", "mt-6")}
          onClick={() => {
            setResult(null);
            setQr("");
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`${CARD} space-y-5 p-6`}>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className={LABEL} htmlFor="pass-code">
          Pass code
        </label>
        <div className="flex gap-2">
          <input
            id="pass-code"
            value={qr}
            onChange={(e) => setQr(e.target.value.toUpperCase())}
            placeholder="e.g. VMS-3F2Aâ€¦"
            autoComplete="off"
            required
            className={`${INPUT} font-mono uppercase`}
          />
          <button
            type="button"
            onClick={() => setScanning((v) => !v)}
            className={buttonClass("secondary", "shrink-0")}
            aria-label={scanning ? "Stop scanning" : "Scan your pass QR code"}
          >
            <ScanLine className="h-4 w-4" />
            {scanning ? "Stop" : "Scan"}
          </button>
        </div>
        {scanning && (
          <div className="mt-3">
            <CameraViewport
              active={scanning}
              onScan={(text) => {
                setQr(text.trim().toUpperCase());
                setScanning(false);
              }}
              className="rounded-xl"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">Point the camera at the QR code on your pass.</p>
          </div>
        )}
        <p className="mt-1 text-xs text-[var(--muted)]">The code printed on your visitor pass.</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[var(--brand-strong)] disabled:pointer-events-none disabled:opacity-50"
      >
        {busy ? "Checkingâ€¦" : "Check in / out"}
      </button>
    </form>
  );
}

