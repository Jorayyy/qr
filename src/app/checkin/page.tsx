import Link from "next/link";
import { SITE } from "@/lib/site-info";
import { ArrowLeft, QrCode } from "lucide-react";
import CheckinForm from "./checkin-form";

export const metadata = {
  title: `Self check-in · ${SITE.shortName} Visitor System`,
  description: "Check yourself in or out using your visitor pass and ID number.",
};

export default function CheckinPage() {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--brand)] text-white">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white/80">
            <QrCode className="h-4 w-4" />
            Self check-in
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Check in or out</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Enter the pass code on your visitor pass and the ID number you presented at the
          Front Desk. Staff can help if you need assistance.
        </p>

        <div className="mt-6">
          <CheckinForm />
        </div>

        <div className="mt-6 text-center">
          <Link href="/visit" className="text-sm font-semibold text-[var(--brand)] hover:underline">
            New visitor? See how to enter
          </Link>
        </div>
      </main>
    </div>
  );
}
