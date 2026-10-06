import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Real authentication check (not the optimistic proxy cookie check).
  const session = await requireSession();

  // Users flagged for a password change are held on /account/password until done.
  if (session.mustChangePassword) {
    redirect("/account/password");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true },
  });

  return (
    <AppShell userName={user?.name} userRole={user?.role}>
      {children}
    </AppShell>
  );
}
