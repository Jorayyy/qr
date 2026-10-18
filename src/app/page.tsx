import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/components/ui";
import { PublicShell, GLASS } from "@/components/public-shell";
import {
  SITE,
  ENTRY_STEPS,
  ENTRY_REQUIREMENTS,
  PRIVACY_NOTICE,
} from "@/lib/site-info";
import {
  CheckCircle2,
  Clock,
  LogIn,
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
    <PublicShell
      right={
        <Link href="/login" className={buttonClass("secondary", "shrink-0")}>
          <ShieldCheck className="h-4 w-4" />
          Staff Sign In
        </Link>
      }
    >
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur-xl">
          <QrCode className="h-4 w-4" />
          QR Entry System
        </span>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Welcome to {SITE.shortName}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Already have a QR pass? Check yourself in. New visitor? The steps
          below show how entry works — our Front Desk will register your visit
          and issue your pass.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkin"
            className={buttonClass("primary", "px-6 py-3 text-base shadow-lg ring-1 ring-white/25")}
          >
            <LogIn className="h-5 w-5" />
            I have a pass — check in
          </Link>
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

    </PublicShell>
  );
}
