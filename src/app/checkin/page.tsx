import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { PublicShell } from "@/components/public-shell";
import { SITE } from "@/lib/site-info";
import { ArrowLeft } from "lucide-react";
import CheckinForm from "./checkin-form";

export const metadata = {
  title: `Self check-in · ${SITE.shortName} Visitor System`,
  description: "Check yourself in or out using your visitor pass and ID number.",
};

export default function CheckinPage() {
  return (
    <PublicShell
      right={
        <Link href="/" className={buttonClass("secondary", "shrink-0")}>
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      }
    >
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Check in or out</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Scan your pass or type the pass code, then enter the ID number you
          presented at the Front Desk. Staff can help if you need assistance.
        </p>

        <div className="mt-6">
          <CheckinForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/visit"
            className="text-sm font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline"
          >
            New visitor? See how to enter
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
