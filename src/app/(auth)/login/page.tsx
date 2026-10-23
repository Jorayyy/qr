import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/validation";
import { SITE } from "@/lib/site-info";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback = safeCallbackUrl(callbackUrl);

  const user = await getSession();
  if (user) redirect(safeCallback ?? "/dashboard");

  return (
    <>
      <div className="mb-8 text-center">
        <img src="/logo.png" alt={`${SITE.shortName} logo`} className="mx-auto mb-4 h-14 w-14 object-contain" />
        <h1 className="text-lg font-extrabold uppercase tracking-tight text-[var(--brand)]">
          {SITE.university}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Visitor Management System</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-sm font-bold tracking-tight">Sign in to your account</h2>
        <LoginForm callbackUrl={safeCallback ?? undefined} />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-[var(--brand)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to welcome page
        </Link>
      </div>
    </>
  );
}
