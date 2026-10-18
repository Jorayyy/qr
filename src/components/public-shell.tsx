import Link from "next/link";
import { SITE } from "@/lib/site-info";

/** Shared glass treatment for the public pages (welcome, guide, check-in). */
export const GLASS = "rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl";

/**
 * Photo background + logo header + footer for every visitor-facing page, so
 * they all match the login screen. Pages constrain their own content width.
 */
export function PublicShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[var(--brand)]/40" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 shadow-lg backdrop-blur-xl">
              <img src="/logo.png" alt={`${SITE.shortName} logo`} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight tracking-tight text-white">
                Visitor Management System
              </p>
              <p className="truncate text-xs text-white/70">{SITE.university}</p>
            </div>
          </Link>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>

        <main className="flex-1 py-10">{children}</main>

        <footer className="border-t border-white/15 py-5 text-center text-xs text-white/60">
          {SITE.university} · Visitor Management System
        </footer>
      </div>
    </div>
  );
}
