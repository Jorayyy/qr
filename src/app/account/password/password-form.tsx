"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/lib/actions/auth";

export function PasswordForm({ mustChange }: { mustChange: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {mustChange && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          You must set a new password before continuing.
        </div>
      )}
      {state?.error && (
        <div className="rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl border border-green-300/50 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Password updated. All other sessions were signed out.
        </div>
      )}

      <div>
        <label htmlFor="currentPassword" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm focus:border-[var(--brand)] focus:ring-2 focus:ring-[#700000]/15 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm focus:border-[var(--brand)] focus:ring-2 focus:ring-[#700000]/15 focus:outline-none"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          At least 12 characters, not similar to your name or email, and not a known breached
          password.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#700000]/20 transition hover:bg-[var(--brand-strong)] disabled:opacity-50 disabled:pointer-events-none"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
