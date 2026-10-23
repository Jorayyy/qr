import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/validation";
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
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--brand)]">
          Staff sign in
        </h1>
        <p className="mb-5 mt-1 text-sm text-[var(--muted)]">
          Visitor Management System
        </p>
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
