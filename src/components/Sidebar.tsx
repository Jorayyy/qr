"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ScanLine,
  Building2,
  ShieldCheck,
  FileBarChart,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cx, buttonClass, Avatar } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { can } from "@/lib/rbac";

type NavItem = { href: string; label: string; icon: LucideIcon; exclude?: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // /visitors/register has its own entry below — without this it lit up both.
  { href: "/visitors", label: "Visitors", icon: Users, exclude: ["/visitors/register"] },
  { href: "/scanner", label: "Scan QR", icon: ScanLine },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/security", label: "Security", icon: ShieldCheck },
];

function NavLink({
  item,
  active,
  children,
}: {
  item: NavItem;
  active: boolean;
  children?: React.ReactNode;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-[var(--brand-soft)] text-[var(--brand)]"
          : "text-slate-600 hover:bg-slate-50 hover:text-[var(--brand)]"
      )}
    >
      <Icon className={cx("h-4 w-4", active ? "text-[var(--brand)]" : "text-slate-400")} />
      {children ?? item.label}
    </Link>
  );
}

type SidebarProps = {
  userName?: string;
  userRole?: string;
};

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN";
  const mayRegister = userRole ? can(userRole, "visitor:write") : false;

  return (
    <aside className="no-print flex h-full w-60 flex-col border-r border-[var(--border)] bg-white">
      <div className="bg-[var(--brand)] px-4 py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
            <img src="/logo.png" alt="EVSU Logo" className="h-full w-full object-contain" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-display text-[15px] font-bold leading-tight tracking-tight text-white">
              Visitor Management
            </p>
            <p className="mt-1.5 text-[9px] font-semibold uppercase leading-[1.6] tracking-[0.14em] text-[var(--accent)]">
              Eastern Visayas
              <br />
              State University
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active =
            pathname.startsWith(item.href) &&
            !(item.exclude ?? []).some((prefix) => pathname.startsWith(prefix));
          return <NavLink key={item.href} item={item} active={active} />;
        })}

        {mayRegister && (
          <NavLink item={{ href: "/visitors/register", label: "Register Walk-in", icon: UserPlus }} active={pathname.startsWith("/visitors/register")} />
        )}

        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Administration
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        {userName && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2">
            <Avatar name={userName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{userName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                {userRole?.toLowerCase()}
              </p>
            </div>
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
