"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200">
          {state.error}
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
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[var(--brand-strong)] hover:shadow-blue-500/40 disabled:opacity-50 disabled:pointer-events-none"
      >
        {pending ? (
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
