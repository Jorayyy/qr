"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Camera, Keyboard, CheckCircle, XCircle, LogIn, QrCode, X } from "lucide-react";
import Link from "next/link";

function formatDate(d: Date | string | null) {
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
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
      } catch {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const lookupVisit = useCallback(async (qrCode: string) => {
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
      stopCamera();
    } catch {
      setError("Failed to look up QR code.");
    }
    setLoading(false);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setMode("camera");
    setError("");
    setResult(null);
    setFeedback("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (html5QrCodeRef.current) {
        try { html5QrCodeRef.current.stop().catch(() => {}); html5QrCodeRef.current.clear().catch(() => {}); } catch {}
      }
      const scanner = new Html5Qrcode("kiosk-qr-reader");
      html5QrCodeRef.current = scanner;
      setCameraActive(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => { lookupVisit(decodedText); stopCamera(); },
        () => {}
      );
    } catch {
      setError("Camera not available. Use manual entry.");
      setCameraActive(false);
    }
  }, [lookupVisit, stopCamera]);

  useEffect(() => {
    if (mode === "camera" && !result) startCamera();
    return () => { stopCamera(); };
  }, [mode]);

  async function handleCheckIn() {
    if (!result) return;
    setLoading(true);
    try {
      const res = await fetch("/api/visits/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: result.id }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback("Checked in successfully! Welcome to the university.");
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
    if (!qrInput.trim()) { setError("Please enter a QR code."); return; }
    lookupVisit(qrInput.trim());
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 text-white md:p-8">
      <Link href="/kiosk" className="mb-6 flex items-center gap-2 self-start text-white/70 hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Check In</h1>
      <p className="mb-8 text-white/70">Scan your QR code or enter it manually.</p>

      <div className="flex gap-3 mb-6">
        <button onClick={() => { setMode("camera"); startCamera(); }} className={`rounded-xl px-6 py-3 font-bold transition ${mode === "camera" ? "bg-white text-blue-700" : "bg-white/10 text-white hover:bg-white/20"}`}>
          <Camera className="mr-2 inline h-5 w-5" /> Camera
        </button>
        <button onClick={() => { stopCamera(); setMode("manual"); }} className={`rounded-xl px-6 py-3 font-bold transition ${mode === "manual" ? "bg-white text-blue-700" : "bg-white/10 text-white hover:bg-white/20"}`}>
          <Keyboard className="mr-2 inline h-5 w-5" /> Manual
        </button>
      </div>

      {mode === "camera" && (
        <div className="w-full max-w-md rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div id="kiosk-qr-reader" className="w-full overflow-hidden rounded-xl" />
          {!cameraActive && !result && (
            <div className="flex flex-col items-center py-12 text-center">
              <Camera className="mb-3 h-12 w-12 text-white/50" />
              <p className="text-white/70">Camera not available</p>
              <button onClick={startCamera} className="mt-3 rounded-xl bg-white/20 px-6 py-2 font-bold">Try Again</button>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={handleManualLookup} className="w-full max-w-md space-y-4">
          <input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Enter QR code..."
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-4 text-center font-mono text-xl text-white placeholder-blue-300 backdrop-blur focus:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none"
            autoFocus
          />
          <button type="submit" className="w-full rounded-xl bg-white py-4 text-lg font-bold text-blue-700 shadow-xl">
            Look Up
          </button>
        </form>
      )}

      {error && (
        <div className="mt-6 flex w-full max-w-md items-center gap-3 rounded-xl bg-red-500/20 p-4 backdrop-blur">
          <XCircle className="h-5 w-5 shrink-0 text-red-300" />
          <span className="text-red-100">{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6 w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
          <div className="mb-4 text-center">
            <p className="text-lg font-bold">{result.visitor?.firstName} {result.visitor?.lastName}</p>
            <p className="text-sm text-gray-500">{result.department?.name} · {result.purpose?.replace("_", " ")}</p>
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
              <CheckCircle className="h-4 w-4" />
              {feedback}
            </div>
          )}

          {result.status === "PENDING" && (
            <button onClick={handleCheckIn} disabled={loading} className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50">
              <LogIn className="mr-2 inline h-5 w-5" />
              {loading ? "Processing..." : "Check In Now"}
            </button>
          )}

          {result.status === "CHECKED_IN" && (
            <p className="text-center text-sm text-gray-500">You are already checked in. Proceed to your destination.</p>
          )}

          {(result.status === "CHECKED_OUT" || result.status === "CANCELLED") && (
            <p className="text-center text-sm text-gray-500">This visit has ended. Please register again at the entrance.</p>
          )}

          <button onClick={() => { setResult(null); setFeedback(""); setError(""); setQrInput(""); startCamera(); }} className="mt-3 w-full rounded-xl bg-gray-100 py-3 font-bold text-gray-600 hover:bg-gray-200">
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
