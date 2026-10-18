import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { PublicShell, GLASS } from "@/components/public-shell";
import {
  SITE,
  ENTRY_STEPS,
  ENTRY_REQUIREMENTS,
  PRIVACY_NOTICE,
} from "@/lib/site-info";
import { ArrowLeft, CheckCircle2, Clock, LogIn, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

export const metadata = {
  title: `How to enter · ${SITE.shortName} Visitor Guide`,
  description: "Simple steps for visiting the EVSU campus and using the QR entry system.",
};

export default function VisitGuidePage() {
  return (
    <PublicShell
      right={
        <Link href="/" className={buttonClass("secondary", "shrink-0")}>
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
          How to enter {SITE.shortName}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/80">
          Follow these steps and you will be inside in a few minutes. Our Front Desk
          staff will assist you at every step.
        </p>

        <ol className="mt-7 space-y-3">
          {ENTRY_STEPS.map((step, i) => (
            <li key={step.title} className={`${GLASS} flex gap-4 p-5`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-[var(--brand)]">
                {i + 1}
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/75">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className={`mt-8 ${GLASS} p-6`}>
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

        <section className={`mt-4 ${GLASS} p-6`}>
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

        <section className={`mt-4 ${GLASS} p-6`}>
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

        <section className={`mt-4 ${GLASS} p-6`}>
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold tracking-tight">Privacy notice</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{PRIVACY_NOTICE}</p>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3 pb-6">
          <Link
            href="/checkin"
            className={buttonClass("primary", "px-6 py-3 text-base shadow-lg ring-1 ring-white/25")}
          >
            <LogIn className="h-5 w-5" />
            I have a pass — check in
          </Link>
          <Link href="/" className={buttonClass("secondary", "px-6 py-3 text-base")}>
            Back to welcome page
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
