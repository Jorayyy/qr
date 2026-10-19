"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { CameraViewport } from "@/components/camera-viewport";
import { LogIn, LogOut, ScanLine } from "lucide-react";

const CARD = "rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl";
const LABEL = "mb-1 block text-xs font-semibold uppercase tracking-wider text-white/60";
const INPUT =
  "w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10 focus:outline-none";

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
          <div className="rounded-full bg-emerald-400/20 p-3">
            {checkedIn ? (
              <LogIn className="h-7 w-7 text-emerald-300" />
            ) : (
              <LogOut className="h-7 w-7 text-emerald-300" />
            )}
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          {checkedIn ? "You are checked in" : "You are checked out"}
        </h2>
        <p className="mt-1 text-sm text-white/80">
          Welcome, {result.visitorName}. Your {checkedIn ? "arrival at" : "exit from"}{" "}
          {result.departmentName} is recorded.
        </p>
        <p className="mt-3 text-xs text-white/60">
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
        <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200">
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
            placeholder="e.g. VMS-3F2A…"
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
            <p className="mt-2 text-xs text-white/60">Point the camera at the QR code on your pass.</p>
          </div>
        )}
        <p className="mt-1 text-xs text-white/60">The code printed on your visitor pass.</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[var(--brand-strong)] disabled:pointer-events-none disabled:opacity-50"
      >
        {busy ? "Checking…" : "Check in / out"}
      </button>
    </form>
  );
}
