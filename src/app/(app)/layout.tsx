import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";

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
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar userName={user?.name} userRole={user?.role} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
