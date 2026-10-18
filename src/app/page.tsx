import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/components/ui";
import { VisitQr } from "@/components/visit-qr";
import {
  SITE,
  ENTRY_STEPS,
  ENTRY_REQUIREMENTS,
  PRIVACY_NOTICE,
} from "@/lib/site-info";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--border)]">
              <img src="/logo.png" alt={`${SITE.shortName} logo`} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight tracking-tight">Visitor Management</p>
              <p className="truncate text-xs text-[var(--muted)]">{SITE.university}</p>
            </div>
          </div>
          <Link href="/login" className={buttonClass("secondary", "shrink-0")}>
            <ShieldCheck className="h-4 w-4" />
            Staff Sign In
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[var(--brand)] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/bg.jpg')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)] via-[var(--brand)]/90 to-[var(--brand-strong)]/80" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]">
              <QrCode className="h-4 w-4" />
              QR Entry System
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Welcome to {SITE.shortName}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Visiting the campus? Scan the QR code to see how entry works, then
              our staff at the Front Desk will register your visit and give you a
              personal QR pass.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/visit" className={buttonClass("secondary", "px-6 py-3 text-base")}>
                How to enter
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#steps" className={buttonClass("ghost", "px-6 py-3 text-base text-white hover:bg-white/15")}>
                See the steps
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white/95 p-6 text-center shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Scan to begin</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Point your phone camera here</p>
            <div className="mt-4">
              <VisitQr />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <section id="steps">
          <h2 className="text-2xl font-bold tracking-tight">How to enter</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Five simple steps from the gate to your destination.</p>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ENTRY_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-bold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--brand)]">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="text-lg font-bold tracking-tight">What to bring</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {ENTRY_REQUIREMENTS.map((req) => (
                <li key={req} className="flex gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--brand)]">
              <Clock className="h-5 w-5" />
              <h2 className="text-lg font-bold tracking-tight">Office hours</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {SITE.officeHours.map((h) => (
                <li key={h.days} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700">{h.days}</span>
                  <span className="font-semibold tabular-nums">{h.hours}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[var(--brand)]">
              <MapPin className="h-5 w-5" />
              <h2 className="text-lg font-bold tracking-tight">Location &amp; contact</h2>
            </div>
            <p className="mt-4 flex gap-2.5 text-sm text-slate-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
              <span>{SITE.university}, {SITE.address}</span>
            </p>
            <p className="mt-2.5 flex gap-2.5 text-sm text-slate-700">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
              <span>{SITE.contactPhone}</span>
            </p>
            <p className="mt-2.5 flex gap-2.5 text-sm text-slate-700">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
              <span className="break-all">{SITE.contactEmail}</span>
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[var(--brand)]">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold tracking-tight">Privacy notice</h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">{PRIVACY_NOTICE}</p>
        </section>

        <div className="mt-10 text-center">
          <Link href="/visit" className={buttonClass("primary", "px-6 py-3 text-base")}>
            Open the full visitor guide
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        {SITE.university} · Visitor Management System
      </footer>
    </div>
  );
}
