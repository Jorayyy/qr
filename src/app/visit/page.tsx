import Link from "next/link";
import { buttonClass } from "@/components/ui";
import {
  SITE,
  ENTRY_STEPS,
  ENTRY_REQUIREMENTS,
  PRIVACY_NOTICE,
} from "@/lib/site-info";
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, Phone, QrCode } from "lucide-react";

export const metadata = {
  title: `How to enter · ${SITE.shortName} Visitor Guide`,
  description: "Simple steps for visiting the EVSU campus and using the QR entry system.",
};

export default function VisitGuidePage() {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--brand)] text-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white/80">
            <QrCode className="h-4 w-4" />
            Visitor Guide
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:py-10">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">How to enter {SITE.shortName}</h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
          Follow these steps and you will be inside in a few minutes. Our Front Desk
          staff will assist you at every step.
        </p>

        <ol className="mt-7 space-y-3">
          {ENTRY_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-base font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
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

        <section className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
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

        <section className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
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

        <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] p-6">
          <h2 className="text-lg font-bold tracking-tight text-[var(--brand)]">Privacy notice</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{PRIVACY_NOTICE}</p>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3 pb-6">
          <Link href="/checkin" className={buttonClass("primary", "px-6 py-3 text-base")}>
            I have a pass — check in
          </Link>
          <Link href="/" className={buttonClass("secondary", "px-6 py-3 text-base")}>
            Back to welcome page
          </Link>
        </div>
      </main>
    </div>
  );
}
