"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Auto-refreshes the page data every N milliseconds.
 * Essential for a passive wall-mounted display.
 */
export default function AutoRefresh({ intervalMs = 5 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh(); // Triggers server-side re-fetch without full page reload
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null; // Renders nothing — just a background refresh hook
}
