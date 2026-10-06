"use client";

import { useState } from "react";
import { ArrowLeft, Camera, Keyboard, CheckCircle, XCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { cx } from "@/components/ui";
import { CameraViewport } from "@/components/camera-viewport";

type KioskVisitResult = {
  id: string;
  status?: string;
  purpose?: string;
  actualArrival?: string | null;
  visitor?: { firstName?: string } | null;
  department?: { name?: string } | null;
  stops?: unknown[];
};

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KioskScanPage() {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [cameraOn, setCameraOn] = useState(true);
  const [qrInput, setQrInput] = useState("");
  const [scannedQr, setScannedQr] = useState("");
  const [result, setResult] = useState<KioskVisitResult | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupVisit(qrCode: string) {
    setCameraOn(false);
    setError("");
    setResult(null);
    setFeedback("");
    setLoading(true);
    try {
      const res = await fetch(`/api/visits/lookup?qr=${encodeURIComponent(qrCode.trim())}`);
      if (!res.ok) {
        setError("No visit found with this QR code. Please register first.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResult(data);
      setScannedQr(qrCode.trim());
    } catch {
      setError("Failed to look up QR code.");
    }
    setLoading(false);
  }

  function retryCamera() {
    setError("");
    setMode("camera");
    setCameraOn(true);
  }

  async function handleCheckIn() {
    if (!result) return;
    setLoading(true);
    setFeedback("");
    try {
      const res = await fetch("/api/visits/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The QR itself is the credential — anonymous kiosk users cannot
        // address a visit by id (IDOR protection).
        body: JSON.stringify({ qr: scannedQr }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(
          typeof data.message === "string" && data.message
            ? data.message
            : "Checked in successfully! Welcome to the university."
        );
        setResult({ ...result, status: "CHECKED_IN", actualArrival: new Date().toISOString() });
      } else {
        setFeedback(data.message || "Failed to check in.");
      }
    } catch {
      setFeedback("Failed to check in.");
    }
    setLoading(false);
  }

  function handleManualLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError("Please enter a QR code.");
      return;
    }
    lookupVisit(qrInput.trim());
  }

  function reset() {
    setResult(null);
    setScannedQr("");
    setFeedback("");
    setError("");
    setQrInput("");
    setMode("camera");
    setCameraOn(true);
  }

  const showCamera = mode === "camera" && !result;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center p-4 text-white md:p-8">
      <Link href="/kiosk/home" className="mb-6 flex items-center gap-2 self-start text-white/70 hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <h1 className="mb-2 text-center text-2xl font-bold sm:text-3xl">Check In</h1>
      <p className="mb-8 text-center text-white/70">Scan your QR code or enter it manually.</p>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => {
            setMode("camera");
            setCameraOn(true);
          }}
          className={cx(
            "flex min-h-11 items-center rounded-xl px-6 py-3 font-bold transition",
            mode === "camera" ? "bg-white text-[var(--brand)]" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <Camera className="mr-2 h-5 w-5" /> Camera
        </button>
        <button
          onClick={() => {
            setMode("manual");
            setCameraOn(false);
          }}
          className={cx(
            "flex min-h-11 items-center rounded-xl px-6 py-3 font-bold transition",
            mode === "manual" ? "bg-white text-[var(--brand)]" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <Keyboard className="mr-2 h-5 w-5" /> Manual
        </button>
      </div>

      {showCamera && (
        <div className="w-full max-w-md">
          <CameraViewport
            active={cameraOn}
            onScan={(text) => lookupVisit(text)}
            className="rounded-2xl"
          />
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={handleManualLookup} className="w-full max-w-md space-y-4">
          <input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Enter QR code..."
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-4 text-center font-mono text-lg text-white placeholder-white/40 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none sm:text-xl"
            autoFocus
          />
          <button type="submit" className="w-full rounded-xl bg-white py-4 text-lg font-bold text-[var(--brand)] shadow-xl">
            Look Up
          </button>
        </form>
      )}

      {error && (
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 rounded-xl bg-red-500/20 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 shrink-0 text-red-300" />
            <span className="text-red-100">{error}</span>
          </div>
          <button
            onClick={retryCamera}
            className="self-start rounded-lg bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
          >
            Scan again
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6 w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
          <div className="mb-4 text-center">
            <p className="text-lg font-bold">{result.visitor?.firstName}</p>
            <p className="text-sm text-gray-500">
              {result.department?.name} · {result.purpose?.replace("_", " ")}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Status</p>
              <p className="font-bold">{result.status?.replace("_", " ")}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Checked In</p>
              <p className="font-bold">{formatDate(result.actualArrival)}</p>
            </div>
          </div>

          {feedback && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {feedback}
            </div>
          )}

          {result.status === "PENDING" && (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full rounded-xl bg-[var(--brand)] py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[var(--brand-strong)] disabled:opacity-50"
            >
              <LogIn className="mr-2 inline h-5 w-5" />
              {loading ? "Processing..." : "Check In Now"}
            </button>
          )}

          {result.status === "CHECKED_IN" && (
            <p className="text-center text-sm text-gray-500">
              You are already checked in. Proceed to your destination.
            </p>
          )}

          {(result.status === "CHECKED_OUT" || result.status === "CANCELLED") && (
            <p className="text-center text-sm text-gray-500">
              This visit has ended. Please register again at the entrance.
            </p>
          )}

          <button
            onClick={reset}
            className="mt-3 w-full rounded-xl bg-gray-100 py-3 font-bold text-gray-600 transition hover:bg-gray-200"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
