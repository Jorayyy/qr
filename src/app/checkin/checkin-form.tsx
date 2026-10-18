"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { LogIn, LogOut, QrCode } from "lucide-react";

type Result = { action: "CHECKED_IN" | "CHECKED_OUT"; visitorName: string; departmentName: string; at: string };

export default function CheckinForm() {
  const [qr, setQr] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/visits/self-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: qr.trim(), idNumber: idNumber.trim() }),
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
      <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <div className="mb-3 flex justify-center">
          <div className="rounded-full bg-emerald-100 p-3">
            {checkedIn ? <LogIn className="h-7 w-7 text-emerald-600" /> : <LogOut className="h-7 w-7 text-emerald-600" />}
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight">
          {checkedIn ? "You are checked in" : "You are checked out"}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Welcome, {result.visitorName}. Your {checkedIn ? "arrival at" : "exit from"} {result.departmentName} is
          recorded.
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {new Date(result.at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setResult(null);
            setQr("");
            setIdNumber("");
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className="label">Pass code</label>
        <div className="relative">
          <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={qr}
            onChange={(e) => setQr(e.target.value.toUpperCase())}
            placeholder="e.g. VMS-3F2A…"
            className="pl-9 font-mono uppercase"
            autoComplete="off"
            required
          />
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">The code printed on your visitor pass.</p>
      </div>

      <div>
        <label className="label">ID number</label>
        <Input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="The ID number you presented at the Front Desk"
          autoComplete="off"
          required
        />
      </div>

      <Button type="submit" disabled={busy} className="w-full py-3 text-base">
        {busy ? "Checking…" : "Check in / out"}
      </Button>
    </form>
  );
}
