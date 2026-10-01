import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
              VMS
            </div>
            <span className="text-sm font-bold tracking-tight">Account Settings</span>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-[var(--brand)] hover:underline">
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
