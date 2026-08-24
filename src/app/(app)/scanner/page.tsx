"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, Input, Button, Badge } from "@/components/ui";
import { checkInAction, checkOutAction } from "@/lib/actions/visitors";
import { QrCode, Search, CheckCircle, XCircle, LogIn, LogOut, Camera, X, Keyboard } from "lucide-react";

function formatDate(d: Date | string | null) {
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
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);
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
    setScanning(false);
  }, []);

  const lookupVisit = useCallback(async (qrCode: string) => {
    setError("");
    setResult(null);
    setFeedback("");
    try {
      const res = await fetch(`/api/visits/lookup?qr=${encodeURIComponent(qrCode.trim())}`);
      if (!res.ok) {
        setError("No visit found with this QR code.");
        return;
      }
      const data = await res.json();
      setResult(data);
      stopCamera();
    } catch {
      setError("Failed to look up QR code.");
    }
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setMode("camera");
    setError("");
    setResult(null);
    setFeedback("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
          html5QrCodeRef.current.clear().catch(() => {});
        } catch {}
      }

      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;
      setCameraActive(true);
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          lookupVisit(decodedText);
          stopCamera();
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Could not access camera. Use manual entry instead.");
      setCameraActive(false);
      setScanning(false);
    }
  }, [lookupVisit, stopCamera]);

  useEffect(() => {
    if (mode === "camera" && !result) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  async function handleManualLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError("Please enter a QR code.");
      return;
    }
    lookupVisit(qrInput.trim());
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
          Scan a visitor&apos;s QR code using the camera, or enter it manually.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "primary" : "secondary"}
          onClick={() => { setMode("camera"); startCamera(); }}
        >
          <Camera className="h-4 w-4" />
          Camera Scan
        </Button>
        <Button
          variant={mode === "manual" ? "primary" : "secondary"}
          onClick={() => { stopCamera(); setMode("manual"); }}
        >
          <Keyboard className="h-4 w-4" />
          Manual Entry
        </Button>
      </div>

      {mode === "camera" && (
        <Card>
          <CardHeader
            title="Camera Scanner"
            subtitle={scanning ? "Point camera at a QR code" : "Starting camera..."}
            action={cameraActive ? (
              <Button variant="ghost" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            ) : undefined}
          />
          <div className="p-5">
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
            {!cameraActive && !result && (
              <div className="flex flex-col items-center py-8 text-center">
                <Camera className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm text-[var(--muted)]">Camera not available</p>
                <Button onClick={startCamera} className="mt-3">
                  <Camera className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {mode === "manual" && (
        <Card>
          <CardHeader title="Manual Entry" subtitle="Type or paste the QR code string" />
          <form onSubmit={handleManualLookup} className="space-y-4 p-5">
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="e.g. VMS-1234567890-ABCDEF12"
                className="pl-9 font-mono"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4" />
              Look Up Visit
            </Button>
          </form>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

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
                  <p className="font-medium">{formatDate(result.actualArrival)}</p>
                </div>
              )}
              {result.actualDeparture && (
                <div>
                  <span className="text-[var(--muted)]">Checked Out:</span>
                  <p className="font-medium">{formatDate(result.actualDeparture)}</p>
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

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => { setResult(null); setFeedback(""); setError(""); startCamera(); }}
            >
              Scan Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
