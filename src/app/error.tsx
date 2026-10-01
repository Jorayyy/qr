"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({ level: "error", event: "UI_ERROR", message: error.message, digest: error.digest })
    );
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] p-8 text-center">
      <p className="text-6xl font-bold text-slate-300">500</p>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-[var(--muted)]">
        An unexpected error occurred. Try again, or return to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
