"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Camera, Keyboard, CheckCircle, XCircle, QrCode, DoorOpen, LogIn } from "lucide-react";
import Link from "next/link";
import type { Html5Qrcode } from "html5-qrcode";

type LookupResult = {
  id: string;
  status?: string;
  purpose?: string;
  actualArrival?: string | null;
  visitor?: { firstName?: string } | null;
  department?: { name?: string } | null;
};

type Props = {
  title: string;
  subtitle: string;
  action: "checkin" | "checkout";
  departmentId?: string;
  confirmLabel: string;
  successMessage: string;
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

/**
 * One shared screen for every scan station (department entrances, exit gate).
 * Flow: look up the QR, show who it is, confirm the transition.
 */
export function KioskStation({ title, subtitle, action, departmentId, confirmLabel, successMessage }: Props) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [qrInput, setQrInput] = useState("");
  const [scannedQr, setScannedQr] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopCamera = useCallback(() => {
    if (html5QrCodeRef.current) {
      try {
        Promise.resolve(html5QrCodeRef.current.stop()).catch(() => {});
        Promise.resolve(html5QrCodeRef.current.clear()).catch(() => {});
      } catch {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const lookupVisit = useCallback(
    async (qrCode: string) => {
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
        stopCamera();
      } catch {
        setError("Failed to look up QR code.");
      }
      setLoading(false);
    },
    [stopCamera]
  );

  const startCamera = useCallback(async () => {
    setMode("camera");
    setError("");
    setResult(null);
    setFeedback("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (html5QrCodeRef.current) {
        try {
          Promise.resolve(html5QrCodeRef.current.stop()).catch(() => {});
          Promise.resolve(html5QrCodeRef.current.clear()).catch(() => {});
        } catch {}
      }
      const scanner = new Html5Qrcode("station-qr-reader");
      html5QrCodeRef.current = scanner;
      setCameraActive(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => {
          stopCamera();
          lookupVisit(decodedText);
        },
        () => {}
      );
    } catch {
      setError("Camera not available. Use manual entry.");
      setCameraActive(false);
    }
  }, [lookupVisit, stopCamera]);

  useEffect(() => {
    if (mode === "camera" && !result) {
      // Camera startup is an external-system interaction.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function reset() {
    setResult(null);
    setScannedQr("");
    setFeedback("");
    setFeedbackTone("success");
    setError("");
    setQrInput("");
    startCamera();
  }

  async function handleConfirm() {
    if (!result) return;
    setLoading(true);
    setFeedback("");
    try {
      const res = await fetch(action === "checkout" ? "/api/visits/checkout" : "/api/visits/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The QR itself is the credential: stations must work for anonymous
        // kiosk users, who cannot address a visit by id (IDOR protection).
        body: JSON.stringify(
          action === "checkout"
            ? { qr: scannedQr }
            : { qr: scannedQr, ...(departmentId ? { departmentId } : {}) }
        ),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackTone("success");
        setFeedback(typeof data.message === "string" && data.message ? data.message : successMessage);
        setResult({
          ...result,
          status: action === "checkout" ? "CHECKED_OUT" : "CHECKED_IN",
          actualArrival: action === "checkout" ? result.actualArrival : new Date().toISOString(),
        });
      } else {
        setFeedbackTone("error");
        setFeedback(data.message || "Request failed.");
      }
    } catch {
      setFeedbackTone("error");
      setFeedback("Request failed. Please try again.");
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

  const ActionIcon = action === "checkout" ? DoorOpen : LogIn;

  return (
    <div className="flex min-h-screen flex-col items-center p-4 text-white md:p-8">
      <Link
        href="/kiosk"
        className="mb-6 flex items-center gap-2 self-start text-white/70 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <QrCode className="h-8 w-8" />
        {title}
      </h1>
      <p className="mb-8 text-center text-white/70">{subtitle}</p>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => {
            setMode("camera");
            startCamera();
          }}
          className={`rounded-xl px-6 py-3 font-bold transition ${
            mode === "camera" ? "bg-white text-blue-700" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <Camera className="mr-2 inline h-5 w-5" /> Camera
        </button>
        <button
          onClick={() => {
            stopCamera();
            setMode("manual");
          }}
          className={`rounded-xl px-6 py-3 font-bold transition ${
            mode === "manual" ? "bg-white text-blue-700" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <Keyboard className="mr-2 inline h-5 w-5" /> Manual
        </button>
      </div>

      {mode === "camera" && (
        <div className="w-full max-w-md rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div id="station-qr-reader" className="w-full overflow-hidden rounded-xl" />
          {!cameraActive && !result && (
            <div className="flex flex-col items-center py-12 text-center">
              <Camera className="mb-3 h-12 w-12 text-white/50" />
              <p className="text-white/70">Camera not available</p>
              <button
                onClick={startCamera}
                className="mt-3 rounded-xl bg-white/20 px-6 py-2 font-bold"
              >
                Try Again
              </button>
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
          <button
            type="submit"
            className="w-full rounded-xl bg-white py-4 text-lg font-bold text-blue-700 shadow-xl"
          >
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
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-sm ${
                feedbackTone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <CheckCircle className="h-4 w-4 shrink-0" />
              {feedback}
            </div>
          )}

          {feedbackTone === "success" && feedback && (
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                {action === "checkout" ? "Exit recorded" : "Entry recorded"}
              </span>
            </div>
          )}

          {feedbackTone !== "success" || !feedback ? (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
            >
              <ActionIcon className="mr-2 inline h-5 w-5" />
              {loading ? "Processing..." : confirmLabel}
            </button>
          ) : null}

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
