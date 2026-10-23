import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/components/ui";
import { PublicShell, ACCENT_BUTTON } from "@/components/public-shell";
import {
  SITE,
  ABOUT,
  QUICK_LINKS,
  ENTRY_STEPS,
  ENTRY_REQUIREMENTS,
  PRIVACY_NOTICE,
} from "@/lib/site-info";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Landmark,
  Link2,
  LogIn,
  MapPin,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: `Welcome · ${SITE.shortName} Visitor Management`,
  description:
    "Visitor entry, campus map, departments and visitor guidelines for Eastern Visayas State University.",
};

const SECTION = "scroll-mt-28 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  const departments = await db.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 6,
    select: { id: true, name: true, building: true },
  });

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[var(--brand-strong)]/95 via-[var(--brand)]/85 to-[var(--brand-strong)]/55"
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--accent)]">Welcome to</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {SITE.university}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              A premier state university in Eastern Visayas, committed to academic excellence,
              innovation, and community development.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#map" className={ACCENT_BUTTON}>
                Explore Our Campus
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/checkin"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <QrCode className="h-4 w-4" />
                I have a pass
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)]">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[var(--brand)]">
              Visitor Registration
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Log your visit, verify your identity, and get your QR code pass from the Front Desk.
            </p>
            <Link href="#steps" className={buttonClass("primary", "mt-5 w-full py-3")}>
              Start Registration
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="map" className={SECTION}>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--brand)]">
              <MapPin className="h-6 w-6" />
              Campus Map
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Find your destination easily. Explore the university buildings, departments, and
              offices — the Main Gate is where visitors enter and register.
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm text-[var(--foreground)]">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
                1
              </span>
              <span>
                <strong className="font-semibold">Main Gate</strong> — present your ID at the
                Front Desk to register and receive your QR pass.
              </span>
            </p>
            <a
              href={SITE.campusMap}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("primary", "mt-6")}
            >
              <MapPin className="h-4 w-4" />
              View Full Map
            </a>
          </div>

          <a href={SITE.campusMap} target="_blank" rel="noreferrer" className="group block">
            <img
              src={SITE.campusMap}
              alt="EVSU campus map showing numbered buildings, roads and the main gate"
              className="w-full rounded-2xl border border-[var(--border)] bg-white shadow-sm transition group-hover:shadow-md"
            />
          </a>
        </div>
      </section>

      <div className="border-y border-[var(--border)] bg-white">
        <section id="departments" className={SECTION}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--brand)]">
                <Landmark className="h-6 w-6" />
                Our Departments &amp; Offices
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Explore our colleges, academic departments, and administrative offices.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Ask the Front Desk for directions
            </p>
          </div>

          {departments.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              The department directory is being updated. Please ask the Front Desk for assistance.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((d) => (
                <article
                  key={d.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
                >
                  <div className="relative h-36 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)]">
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('/departments/${slugify(d.name)}.jpg')` }}
                    />
                    <Landmark
                      aria-hidden
                      className="absolute right-4 top-4 h-8 w-8 text-white/25"
                    />
                  </div>
                  <div className="relative px-5 pb-5">
                    <span className="-mt-5 mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-[var(--border)]">
                      <Landmark className="h-5 w-5 text-[var(--brand)]" />
                    </span>
                    <h3 className="text-sm font-bold leading-snug tracking-tight">{d.name}</h3>
                    {d.building ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">{d.building}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section id="steps" className={SECTION}>
        <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--brand)]">
          <QrCode className="h-6 w-6" />
          How to enter
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Five simple steps from the gate to your destination.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ENTRY_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-bold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="border-y border-[var(--border)] bg-white">
        <div className={SECTION}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <section className="rounded-2xl border border-[var(--border)] p-6">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--brand)]">
                <BookOpen className="h-5 w-5" />
                About EVSU
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{ABOUT}</p>
              <a
                href="https://evsu.edu.ph"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                Learn More About Us
                <ArrowRight className="h-4 w-4" />
              </a>
            </section>

            <section id="guidelines" className="scroll-mt-28 rounded-2xl border border-[var(--border)] p-6">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--brand)]">
                <ClipboardList className="h-5 w-5" />
                Visitor Guidelines
              </h2>
              <ul className="mt-3 space-y-2">
                {ENTRY_REQUIREMENTS.map((req) => (
                  <li key={req} className="flex gap-2 text-sm text-[var(--muted)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--border)] p-6">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--brand)]">
                <Link2 className="h-5 w-5" />
                Quick Links
              </h2>
              <ul className="mt-3 space-y-2.5">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] hover:text-[var(--brand)] hover:underline"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted)]" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative isolate flex min-h-48 items-end overflow-hidden rounded-2xl p-6">
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/bg.jpg')" }}
              />
              <div aria-hidden className="absolute inset-0 bg-[var(--brand-strong)]/75" />
              <blockquote className="relative text-sm italic leading-relaxed text-white">
                “Together, we build a brighter future.”
                <footer className="mt-2 text-xs not-italic text-white/70">— {SITE.university}</footer>
              </blockquote>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] p-6">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--brand)]">
                <Clock className="h-5 w-5" />
                Office hours
              </h2>
              <ul className="mt-3 space-y-2">
                {SITE.officeHours.map((h) => (
                  <li key={h.days} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--muted)]">{h.days}</span>
                    <span className="font-semibold tabular-nums">{h.hours}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--border)] p-6">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--brand)]">
                <ShieldCheck className="h-5 w-5" />
                Privacy notice
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{PRIVACY_NOTICE}</p>
            </section>
          </div>
        </div>
      </div>

      <section className={SECTION}>
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--brand)] px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-white">Ready to check in?</h2>
            <p className="mt-1 text-sm text-white/80">
              Scan your pass at the entrance, or self check-in with your pass code.
            </p>
          </div>
          <Link href="/checkin" className={`${ACCENT_BUTTON} shrink-0`}>
            <LogIn className="h-4 w-4" />
            Check in / out
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
