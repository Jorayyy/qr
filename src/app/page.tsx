import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/components/ui";
import { UserPlus, ScanLine, ShieldCheck, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: UserPlus,
    title: "Register visitors",
    body: "Log a walk-in in seconds. A scannable QR pass is issued and can be emailed to the guest.",
  },
  {
    icon: ScanLine,
    title: "Scan to check in or out",
    body: "Point the camera at a visitor's QR pass to record their arrival, movement, and exit.",
  },
  {
    icon: ShieldCheck,
    title: "Track and report",
    body: "See who is inside right now, review the day's arrivals, and export reports per day, week, month or year.",
  },
];

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--border)]">
            <img src="/logo.png" alt="EVSU Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight">Visitor Management</p>
            <p className="text-xs text-[var(--muted)]">Eastern Visayas State University</p>
          </div>
        </div>
        <Link href="/login" className={buttonClass("primary")}>
          Staff Sign In
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-8">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="inline-flex items-center rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">
              QR-Based Visitor System
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Welcome to EVSU&apos;s Visitor Management System
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              A simple, friendly way to register guests, issue QR passes, and keep
              track of everyone on campus — for staff, security, and front-desk teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={buttonClass("primary", "px-6 py-3 text-base")}>
                Staff Sign In
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#how" className={buttonClass("secondary", "px-6 py-3 text-base")}>
                How it works
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
            <img
              src="/bg.jpg"
              alt="EVSU campus"
              className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand)]/85 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <p className="text-lg font-bold">Register. Scan. Track.</p>
              <p className="text-sm text-white/80">One pass per visit, valid for 7 days.</p>
            </div>
          </div>
        </section>

        <section id="how" className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-bold tracking-tight">Visiting the campus?</h2>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Registration is handled by our staff at the front desk. Please present a
            valid ID and they will issue your QR pass.
          </p>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        Eastern Visayas State University · Visitor Management System
      </footer>
    </div>
  );
}
