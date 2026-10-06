import Link from "next/link";

/**
 * Attract / splash screen. Pure static markup (no client component) so it is
 * the very first thing a phone or kiosk terminal paints. The whole screen is
 * the target, so there is no precision tap needed.
 */
export default function KioskSplashPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-8 text-center text-white">
      <Link
        href="/kiosk/home"
        aria-label="Touch screen to begin"
        className="group flex w-full max-w-lg flex-col items-center gap-10 rounded-3xl p-6 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl transition group-hover:scale-105 group-hover:bg-white/15">
          <img src="/logo.png" alt="EVSU Logo" className="h-full w-full object-contain p-2" />
        </div>

        <div>
          <h1 className="text-3xl font-bold drop-shadow-lg sm:text-4xl">
            Visitor Management
          </h1>
          <p className="mt-3 text-white/70 drop-shadow">
            Eastern Visayas State University
          </p>
        </div>

        <span className="animate-pulse rounded-full border border-white/25 bg-white/10 px-8 py-4 text-lg font-bold shadow-xl backdrop-blur-xl transition group-hover:scale-105 group-hover:bg-white/20 group-hover:animate-none">
          Touch screen to begin
        </span>

        <p className="max-w-sm text-xs leading-relaxed text-white/45">
          University QR Code-Based Visitor Management — registration, check-in
          and check-out.
        </p>
      </Link>
    </main>
  );
}
