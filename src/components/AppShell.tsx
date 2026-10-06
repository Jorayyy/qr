"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

type Props = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
};

/**
 * App shell: fixed sidebar on desktop, hamburger + slide-in drawer on phones.
 * The old shell always reserved 240 px for the sidebar, which left ~130 px of
 * usable width on a 375 px phone.
 */
export function AppShell({ children, userName, userRole }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer when the route changes (derived during render rather
  // than in an effect, so a back/forward navigation cannot leave it open).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--background)] lg:flex-row">
      {/* Phone/tablet header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate text-sm font-bold tracking-tight">Visitor Management</span>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar userName={userName} userRole={userRole} />
      </div>

      {/* Phone/tablet drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] shadow-2xl"
            onClickCapture={(e) => {
              // Any navigation inside the drawer closes it.
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute -right-11 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar userName={userName} userRole={userRole} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
