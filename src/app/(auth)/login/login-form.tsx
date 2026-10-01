"use client";

import { useActionState, useState } from "react";
import { loginAction, verifyMfaAction } from "@/lib/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, null);
  const [mfaState, mfaFormAction, mfaPending] = useActionState(verifyMfaAction, null);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const mfaStep = Boolean(loginState?.mfaRequired);

  if (mfaStep) {
    return (
      <form action={mfaFormAction} className="space-y-4">
        {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
        {mfaState?.error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200">
            {mfaState.error}
          </div>
        ) : null}

        <div>
          <label htmlFor="code" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/60">
            {useRecoveryCode ? "Recovery Code" : "Authentication Code"}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            autoComplete="one-time-code"
            inputMode={useRecoveryCode ? "text" : "numeric"}
            placeholder={useRecoveryCode ? "Enter a recovery code" : "Enter the 6-digit code"}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10 focus:outline-none"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={mfaPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[var(--brand-strong)] hover:shadow-blue-500/40 disabled:opacity-50 disabled:pointer-events-none"
        >
          {mfaPending ? "Verifying…" : "Verify"}
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setUseRecoveryCode((v) => !v)}
            className="text-xs font-medium text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            {useRecoveryCode ? "Use authenticator app instead" : "Use a recovery code instead"}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-medium text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            Start over
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={loginFormAction} className="space-y-4">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      {loginState?.error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200">
          {loginState.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/60">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@university.edu"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/60">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loginPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[var(--brand-strong)] hover:shadow-blue-500/40 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loginPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
