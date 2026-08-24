"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ScanLine,
} from "lucide-react";
import { cx, buttonClass } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/visitors", label: "Visitors", icon: Users },
  { href: "/scanner", label: "Scan QR", icon: ScanLine },
] as const;

type SidebarProps = {
  userName?: string;
  userRole?: string;
};

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="no-print flex w-60 flex-col border-r border-[var(--border)] bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
          VMS
        </div>
        <span className="text-sm font-bold tracking-tight">Visitor Management</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-blue-50 text-[var(--brand)]"
                  : "text-slate-600 hover:bg-blue-50 hover:text-[var(--brand)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] px-4 py-3">
        {userName && (
          <div className="mb-2">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-[var(--muted)] capitalize">{userRole?.toLowerCase()}</p>
          </div>
        )}
        <form action={logoutAction}>
          <button type="submit" className={buttonClass("ghost", "w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700")}>
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
