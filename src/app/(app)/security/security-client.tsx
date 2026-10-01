"use client";

import { useActionState, useState, type FormEvent, type ReactNode } from "react";
import type { AdminUserState } from "@/lib/actions/admin";

/** Small form button that runs a state-returning admin server action. */
export function RowAction({
  action,
  fields,
  children,
  variant = "secondary",
  confirmText,
  inline = false,
}: {
  action: (prev: AdminUserState, formData: FormData) => Promise<AdminUserState>;
  fields: Record<string, string>;
  children: ReactNode;
  variant?: "secondary" | "danger";
  confirmText?: string;
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dismissed, setDismissed] = useState(false);

  const visible = Boolean((state?.error || state?.success || state?.tempPassword) && !dismissed);

  return (
    <div className={inline ? "inline-block" : "block"}>
      <form
        action={formAction}
        onSubmit={(e: FormEvent) => {
          if (confirmText && !window.confirm(confirmText)) {
            e.preventDefault();
            return;
          }
        }}
      >
        {Object.entries(fields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button
          type="submit"
          disabled={pending}
          className={
            variant === "danger"
              ? "rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              : "rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          }
        >
          {pending ? "…" : children}
        </button>
      </form>
      {visible && (
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-slate-50 p-3 text-xs">
          {state?.error && <p className="font-medium text-red-600">{state.error}</p>}
          {state?.success && <p className="font-medium text-green-700">{state.success}</p>}
          {state?.tempPassword && (
            <div className="mt-2">
              <p className="font-semibold text-slate-700">One-time password — copy now:</p>
              <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono text-[13px] text-slate-800">
                {state.tempPassword}
              </code>
            </div>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-2 text-slate-500 underline hover:text-slate-700"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/** Per-row role selector (ADMIN only, never on your own account). */
export function RoleSelect({
  action,
  userId,
  currentRole,
  roles,
  disabled,
}: {
  action: (prev: AdminUserState, formData: FormData) => Promise<AdminUserState>;
  userId: string;
  currentRole: string;
  roles: readonly string[];
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        disabled={disabled || pending}
        className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs focus:border-[var(--brand)] focus:outline-none disabled:opacity-50"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "…" : "Set"}
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state?.success && <span className="text-xs text-green-700">{state.success}</span>}
    </form>
  );
}

/** Admin create-user form with one-time password display. */
export function CreateUserForm({
  action,
  roles,
}: {
  action: (prev: AdminUserState, formData: FormData) => Promise<AdminUserState>;
  roles: readonly string[];
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dismissed, setDismissed] = useState(false);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-[var(--border)] bg-slate-50 p-4">
      <p className="text-sm font-semibold">Create staff account</p>
      {state?.error && !dismissed && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && !dismissed && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          <p className="font-medium">{state.success}</p>
          {state.tempPassword && (
            <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono text-[13px]">
              {state.tempPassword}
            </code>
          )}
          <button type="button" onClick={() => setDismissed(true)} className="mt-1 underline">
            Dismiss
          </button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="email"
          type="email"
          required
          placeholder="email@university.edu"
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
        <input
          name="name"
          type="text"
          required
          maxLength={120}
          placeholder="Full name"
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
        <select
          name="role"
          defaultValue="STAFF"
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <input
        name="password"
        type="text"
        maxLength={128}
        placeholder="Initial password (leave blank to auto-generate)"
        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
