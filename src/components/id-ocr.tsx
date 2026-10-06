"use client";

import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { parseIdText, type OcrFields } from "@/lib/ocr";

/** All tesseract assets are served from /public/tesseract so they pass CSP. */
const TESSERACT_OPTIONS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/tesseract-core-lstm.wasm.js",
  langPath: "/tesseract/lang",
  workerBlobURL: false,
  gzip: true,
} as const;

type Phase = "idle" | "engine" | "reading" | "done" | "error";

export type IdOcrProps = {
  onExtract: (fields: OcrFields) => void;
  tone?: "light" | "dark";
  className?: string;
};

/**
 * Fills only empty inputs so OCR never overwrites what the guard already typed.
 * Returns the field names that were actually written.
 */
export function applyOcrToForm(
  form: HTMLFormElement | null,
  fields: OcrFields
): string[] {
  if (!form) return [];
  const written: string[] = [];

  const setIfEmpty = (name: string, value?: string) => {
    if (!value) return;
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
      if (el.value.trim()) return;
      el.value = value;
      written.push(name);
    }
  };

  setIfEmpty("firstName", fields.firstName);
  setIfEmpty("lastName", fields.lastName);
  setIfEmpty("idNumber", fields.idNumber);
  setIfEmpty("idType", fields.idType);

  return written;
}

function summarise(fields: OcrFields): string {
  const parts: string[] = [];
  if (fields.firstName || fields.lastName) {
    parts.push([fields.firstName, fields.lastName].filter(Boolean).join(" "));
  }
  if (fields.idNumber) parts.push(`ID ${fields.idNumber}`);
  if (fields.idType) parts.push(fields.idType.replace("_", " "));
  return parts.join(" · ");
}

export function IdOcrScanButton({ onExtract, tone = "light", className }: IdOcrProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const dark = tone === "dark";

  async function run(file: File) {
    setBusy(true);
      setPhase("engine");
      setProgress(0);
      setNote("Loading OCR engine…");


    try {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
        ...TESSERACT_OPTIONS,
        logger: ({ status, progress: p }: { status: string; progress: number }) => {
          if (status.includes("recogniz")) {
            setPhase("reading");
            setNote("Reading ID…");
          } else if (status.includes("loading")) {
            setPhase("engine");
            setNote(
              status.includes("language")
                ? "Loading language data…"
                : "Loading OCR engine…"
            );
          }
          if (typeof p === "number" && p >= 0) setProgress(Math.min(1, p));
        },
        errorHandler: (err: unknown) => {
          console.error(JSON.stringify({ level: "error", event: "OCR_WORKER_ERROR", error: String(err) }));
        },
      });

      try {
        const result = await worker.recognize(file);
        const fields = parseIdText(result.data?.text ?? "");
        const filled = Object.values(fields).some(Boolean);

        setPhase(filled ? "done" : "error");
        setNote(
          filled
            ? `Detected: ${summarise(fields)} — review before submitting.`
            : "No readable ID text found. Type the details manually."
        );
        if (filled) onExtract(fields);
      } finally {
        await worker.terminate();
      }
    } catch (error) {
      setPhase("error");
      setNote("OCR failed to start. Enter the details manually.");
      console.error(
        JSON.stringify({
          level: "error",
          event: "OCR_SCAN_FAILED",
          error: error instanceof Error ? error.message : String(error),
        })
      );
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void run(file);
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={
          dark
            ? "flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
            : "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:opacity-50"
        }
      >
        <ScanLine className="h-4 w-4" />
        {busy ? "Working…" : "Scan ID to autofill"}
      </button>

      {(busy || phase === "done" || phase === "error") && (
        <div
          className={
            phase === "done"
              ? "mt-2 text-xs font-medium text-emerald-600"
              : phase === "error"
                ? `text-xs font-medium ${dark ? "text-amber-300" : "text-amber-600"}`
                : `mt-2 text-xs ${dark ? "text-white/70" : "text-[var(--muted)]"}`
          }
        >
          {note}
          {busy && (
            <div
              className={`mt-1 h-1 w-full overflow-hidden rounded ${dark ? "bg-white/20" : "bg-slate-200"}`}
            >
              <div
                className={`h-full rounded transition-all ${dark ? "bg-white/70" : "bg-[var(--brand)]"}`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
