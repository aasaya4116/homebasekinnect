"use client";

import { usePathname } from "next/navigation";
import AutoRefresh from "./AutoRefresh";
import Navigation from "./Navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <AutoRefresh intervalMs={5 * 60 * 1000} />
      <div className="container">
        <Navigation />
        {children}
      </div>
    </>
  );
}
