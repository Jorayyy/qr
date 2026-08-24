"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, Input, Button, Badge } from "@/components/ui";
import { db } from "@/lib/db";
import { checkInAction, checkOutAction } from "@/lib/actions/visitors";
import { QrCode, Search, CheckCircle, XCircle, LogIn, LogOut } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, { tone: "blue" | "green" | "red" | "gray" }> = {
  PENDING: { tone: "blue" },
  CHECKED_IN: { tone: "green" },
  CHECKED_OUT: { tone: "gray" },
  CANCELLED: { tone: "red" },
};

export default function ScannerPage() {
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setFeedback("");

    if (!qrInput.trim()) {
      setError("Please enter a QR code.");
      return;
    }

    try {
      const res = await fetch(`/api/visits/lookup?qr=${encodeURIComponent(qrInput.trim())}`);
      if (!res.ok) {
        setError("No visit found with this QR code.");
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to look up QR code. API route may not exist yet.");
    }
  }

  async function handleCheckIn() {
    if (!result) return;
    setFeedback("");
    startTransition(async () => {
      const res = await checkInAction(result.id);
      if (res.success) {
        setFeedback("Checked in successfully!");
        setResult({ ...result, status: "CHECKED_IN", actualArrival: new Date().toISOString() });
      } else {
        setFeedback(res.message);
      }
    });
  }

  async function handleCheckOut() {
    if (!result) return;
    setFeedback("");
    startTransition(async () => {
      const res = await checkOutAction(result.id);
      if (res.success) {
        setFeedback("Checked out successfully!");
        setResult({ ...result, status: "CHECKED_OUT", actualDeparture: new Date().toISOString() });
      } else {
        setFeedback(res.message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">QR Code Scanner</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Enter or paste a QR code string to look up a visit.
        </p>
      </div>

      <Card>
        <CardHeader title="Scan QR Code" subtitle="Enter the code from the visitor's QR" />
        <form onSubmit={handleLookup} className="space-y-4 p-5">
          <div className="relative">
            <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="e.g. VMS-1234567890-ABCDEF12"
              className="pl-9 font-mono"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Look Up Visit
          </Button>
        </form>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Visit Details" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted)]">Visitor:</span>
                <p className="font-medium">
                  {result.visitor?.firstName} {result.visitor?.lastName}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Department:</span>
                <p className="font-medium">{result.department?.name}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Purpose:</span>
                <p className="font-medium">{result.purpose?.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Status:</span>
                <p>
                  <Badge tone={STATUS_BADGE[result.status]?.tone}>
                    {result.status?.replace("_", " ")}
                  </Badge>
                </p>
              </div>
              {result.hostName && (
                <div>
                  <span className="text-[var(--muted)]">Host:</span>
                  <p className="font-medium">{result.hostName}</p>
                </div>
              )}
              {result.actualArrival && (
                <div>
                  <span className="text-[var(--muted)]">Checked In:</span>
                  <p className="font-medium">{formatDate(new Date(result.actualArrival))}</p>
                </div>
              )}
              {result.actualDeparture && (
                <div>
                  <span className="text-[var(--muted)]">Checked Out:</span>
                  <p className="font-medium">{formatDate(new Date(result.actualDeparture))}</p>
                </div>
              )}
            </div>

            {feedback && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle className="h-4 w-4" />
                {feedback}
              </div>
            )}

            {result.status === "PENDING" && (
              <Button onClick={handleCheckIn} disabled={isPending} className="w-full">
                <LogIn className="h-4 w-4" />
                {isPending ? "Processing..." : "Check In"}
              </Button>
            )}

            {result.status === "CHECKED_IN" && (
              <Button variant="danger" onClick={handleCheckOut} disabled={isPending} className="w-full">
                <LogOut className="h-4 w-4" />
                {isPending ? "Processing..." : "Check Out"}
              </Button>
            )}

            {(result.status === "CHECKED_OUT" || result.status === "CANCELLED") && (
              <p className="text-center text-sm text-[var(--muted)]">
                This visit has already been {result.status.toLowerCase().replace("_", " ")}.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
