"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Unattended kiosk: after a period with no touch/keyboard/mouse activity the
 * terminal returns to the home screen so the next visitor never sees the
 * previous visitor's data.
 */
export function KioskIdleReset({ idleMs = 60_000 }: { idleMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const events = ["pointerdown", "keydown", "touchstart"] as const;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        router.replace("/kiosk");
      }, idleMs);
    };

    // Already on the home screen: nothing sensitive to clear.
    if (pathname === "/kiosk") return;

    for (const event of events) {
      window.addEventListener(event, schedule, { passive: true });
    }
    schedule();

    return () => {
      clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, schedule);
      }
    };
  }, [pathname, router, idleMs]);

  return null;
}
