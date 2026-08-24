import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const user = session
    ? await db.user.findUnique({ where: { id: session.userId }, select: { name: true, role: true } })
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar userName={user?.name} userRole={user?.role} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
