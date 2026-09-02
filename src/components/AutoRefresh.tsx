"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

/**
 * Auto-refreshes the page data every N milliseconds.
 * Essential for a passive wall-mounted display.
 */
export default function AutoRefresh({ intervalMs = 5 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // A chess quest is an active session, unlike the passive wall pages.
    // Leave it alone while someone is thinking through a move.
    if (pathname === "/chess") return;

    const timer = setInterval(() => {
      router.refresh(); // Triggers server-side re-fetch without full page reload
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs, pathname]);

  return null; // Renders nothing — just a background refresh hook
}
