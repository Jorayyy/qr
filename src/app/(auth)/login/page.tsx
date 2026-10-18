import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/validation";
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/20 shadow-lg backdrop-blur-xl">
          <img src="/logo.png" alt="EVSU Logo" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Visitor Management System
        </h1>
        <p className="mt-1 text-sm text-white/70">
          University QR Code-Based Visitor Management
        </p>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <h2 className="mb-4 text-sm font-bold tracking-tight text-white">Sign in to your account</h2>
        <LoginForm callbackUrl={safeCallback ?? undefined} />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to welcome page
        </Link>
      </div>
    </>
  );
}
