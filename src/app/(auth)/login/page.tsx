import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

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
        <LoginForm />
      </div>

      <a
        href="/kiosk"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition hover:bg-white/20"
      >
        <svg className="h-5 w-5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Kiosk Mode
      </a>
    </>
  );
}
