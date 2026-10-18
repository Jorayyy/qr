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

/** Same glass treatment as the login page so both entry screens match. */
const GLASS = "rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl";

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 shadow-lg backdrop-blur-xl">
              <img src="/logo.png" alt={`${SITE.shortName} logo`} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight tracking-tight text-white">
                Visitor Management System
              </p>
              <p className="truncate text-xs text-white/70">{SITE.university}</p>
            </div>
          </div>
          <Link href="/login" className={buttonClass("secondary", "shrink-0")}>
            <ShieldCheck className="h-4 w-4" />
            Staff Sign In
          </Link>
        </header>

        <main className="flex-1 py-10 sm:py-14">
          <section className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur-xl">
                <QrCode className="h-4 w-4" />
                QR Entry System
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
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
          </section>

          <section id="steps" className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-white">How to enter</h2>
            <p className="mt-1 text-sm text-white/70">Five simple steps from the gate to your destination.</p>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {ENTRY_STEPS.map((step, i) => (
                <li key={step.title} className={`${GLASS} p-5`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[var(--brand)]">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 text-base font-bold tracking-tight text-white">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <section className={`${GLASS} p-6`}>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="text-lg font-bold tracking-tight">What to bring</h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {ENTRY_REQUIREMENTS.map((req) => (
                  <li key={req} className="flex gap-2.5 text-sm text-white/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${GLASS} p-6`}>
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <h2 className="text-lg font-bold tracking-tight">Office hours</h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {SITE.officeHours.map((h) => (
                  <li key={h.days} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/85">{h.days}</span>
                    <span className="font-semibold tabular-nums text-white">{h.hours}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${GLASS} p-6`}>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5" />
                <h2 className="text-lg font-bold tracking-tight">Location &amp; contact</h2>
              </div>
              <p className="mt-4 flex gap-2.5 text-sm text-white/85">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                <span>{SITE.university}, {SITE.address}</span>
              </p>
              <p className="mt-2.5 flex gap-2.5 text-sm text-white/85">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                <span>{SITE.contactPhone}</span>
              </p>
              <p className="mt-2.5 flex gap-2.5 text-sm text-white/85">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                <span className="break-all">{SITE.contactEmail}</span>
              </p>
            </section>
          </div>

          <section className={`mt-4 ${GLASS} p-6 sm:p-8`}>
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold tracking-tight">Privacy notice</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85">{PRIVACY_NOTICE}</p>
          </section>

          <div className="mt-10 text-center">
            <Link href="/visit" className={buttonClass("secondary", "px-6 py-3 text-base")}>
              Open the full visitor guide
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </main>

        <footer className="border-t border-white/15 py-5 text-center text-xs text-white/60">
          {SITE.university} · Visitor Management System
        </footer>
      </div>
    </div>
  );
}
