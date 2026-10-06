"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { cx } from "@/components/ui";
import type { Html5Qrcode } from "html5-qrcode";

export type CameraState = "idle" | "loading" | "starting" | "ready" | "error";

type Props = {
  onScan: (text: string) => void;
  active: boolean;
  className?: string;
  onStateChange?: (state: CameraState) => void;
};

const START_TIMEOUT_MS = 15000;

type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorWithFormats = BarcodeDetectorCtor & {
  getSupportedFormats?: () => Promise<string[]>;
};

function describeError(err: unknown): string {
  const name = err instanceof Error ? err.name : typeof err === "string" ? err : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission was denied. Allow camera access for this site, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No usable camera was found on this device.";
  }
  if (name === "NotReadableError") {
    return "The camera is already in use by another app.";
  }
  return "Could not start the camera. Try again, or enter the code manually.";
}

/**
 * Shared camera surface for every QR scanner in the app.
 *
 * Speed strategy (the old UI downloaded a 361 KB library before the preview
 * ever appeared, with no feedback):
 *  1. Native `BarcodeDetector` when the browser exposes it (Android Chrome) —
 *     no library download at all, camera starts immediately.
 *  2. Otherwise lazily import `html5-qrcode`, with a visible "loading /
 *     starting" state and a 15 s timeout so it can never hang silently.
 *
 * `qrbox` is computed from the viewfinder size instead of being hard-coded to
 * 250 px, and the forced 1:1 aspect ratio is gone — both made phone cameras
 * fail with an overconstrained error on some Android devices.
 */
export function CameraViewport({ onScan, active, className, onStateChange }: Props) {
  const rawId = useId();
  const elementId = `qr-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const targetRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const html5Ref = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const [state, setState] = useState<CameraState>("idle");
  const [engine, setEngine] = useState<"native" | "fallback">("fallback");
  const [message, setMessage] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const stopNative = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) {
        try {
          track.stop();
        } catch {}
      }
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.srcObject = null;
      } catch {}
    }
  }, []);

  const teardown = useCallback(() => {
    abortedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopNative();
    const scanner = html5Ref.current;
    html5Ref.current = null;
    if (scanner) {
      try {
        Promise.resolve(scanner.stop()).catch(() => {});
        Promise.resolve(scanner.clear()).catch(() => {});
      } catch {}
    }
  }, [stopNative]);

  const handleScan = useCallback(
    (text: string) => {
      if (abortedRef.current) return;
      const value = typeof text === "string" ? text.trim() : "";
      if (!value) return;
      teardown();
      onScanRef.current(value);
    },
    [teardown]
  );
  const handleScanRef = useRef(handleScan);
  useEffect(() => {
    handleScanRef.current = handleScan;
  }, [handleScan]);

  const start = useCallback(async () => {
    teardown();
    abortedRef.current = false;
    setEngine("fallback");
    setState("loading");
    setMessage("Loading scanner…");

    timeoutRef.current = setTimeout(() => {
      if (abortedRef.current) return;
      teardown();
      setMessage("The camera is taking too long to start. Try again, or enter the code manually.");
      setState("error");
    }, START_TIMEOUT_MS);

    // 1) Native path — nothing to download.
    try {
      const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorWithFormats })
        .BarcodeDetector;
      if (BD && navigator.mediaDevices?.getUserMedia) {
        const formats = BD.getSupportedFormats ? await BD.getSupportedFormats() : [];
        if (formats.length === 0 || formats.includes("qr_code")) {
          if (abortedRef.current) return;
          setEngine("native");
          setState("starting");
          setMessage("Starting camera…");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
          if (abortedRef.current) {
            for (const track of stream.getTracks()) track.stop();
            return;
          }
          streamRef.current = stream;
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            await video.play();
            if (abortedRef.current) return;
            const detector = new BD({ formats: ["qr_code"] });
            setState("ready");
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            let busy = false;
            pollRef.current = setInterval(async () => {
              if (abortedRef.current || busy) return;
              busy = true;
              try {
                const found = await detector.detect(video);
                const raw = found?.[0]?.rawValue;
                if (raw) handleScanRef.current(raw);
              } catch {
                // Transient decode errors are expected — keep polling.
              } finally {
                busy = false;
              }
            }, 250);
            return;
          }
        }
      }
    } catch {
      // Never leave a half-open native stream behind: the fallback path below
      // opens its own camera and would otherwise fail with "camera in use".
      stopNative();
    }

    if (abortedRef.current) return;

    // 2) Fallback path — html5-qrcode, downloaded on demand.
    try {
      setEngine("fallback");
      setState("loading");
      setMessage("Loading scanner…");
      const { Html5Qrcode } = await import("html5-qrcode");
      if (abortedRef.current) return;
      setState("starting");
      setMessage("Starting camera…");
      const scanner = new Html5Qrcode(elementId, { verbose: false });
      html5Ref.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const target = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
            const size = Math.min(280, Math.max(110, Math.round(target)));
            return { width: size, height: size };
          },
        },
        (decodedText: string) => handleScanRef.current(decodedText),
        () => {}
      );
      if (abortedRef.current) return;
      setState("ready");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (err) {
      if (abortedRef.current) return;
      teardown();
      setMessage(describeError(err));
      setState("error");
    }
  }, [elementId, stopNative, teardown]);

  useEffect(() => {
    if (!active) {
      teardown();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((prev) => (prev === "idle" ? prev : "idle"));
      return;
    }
    void start();
    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Unmount safety net.
  useEffect(() => teardown, [teardown]);

  const containerClass = cx(
    "relative w-full overflow-hidden rounded-xl bg-black",
    (state !== "ready" || engine === "native") && "aspect-[4/3]",
    className
  );

  return (
    <div className={containerClass}>
      {engine !== "native" && <div id={elementId} ref={targetRef} className="w-full" />}

      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-hidden
        className={cx(
          "absolute inset-0 h-full w-full object-cover",
          engine !== "native" && "hidden"
        )}
      />

      {state !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          {state === "error" ? (
            <Camera className="h-10 w-10 text-white/40" />
          ) : (
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          )}
          <p className="max-w-xs text-sm text-white/85">
            {state === "idle" ? "Camera is off." : message}
          </p>
          {state !== "error" && state !== "idle" && (
            <span className="h-1 w-40 overflow-hidden rounded-full bg-white/20">
              <span className="block h-full w-1/3 animate-pulse rounded-full bg-white/70" />
            </span>
          )}
          {state === "error" && (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
