"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar as CalendarIcon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Clock from "./Clock";
import Weather from "./Weather";
import { regenerateAction } from "@/lib/actions";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Chores", path: "/chores" },
    { name: "History", path: "/history" },
    { name: "Monthly", path: "/monthly" },
    { name: "By Person", path: "/byperson" },
    { name: "Groceries", path: "/groceries" },
  ];

  const isDashboard = pathname === "/";

  return (
    <nav className="wall-nav">
      <div className="wall-nav-brand">
        <span className="b1">Asaya</span>
        <span className="b2">Homebase</span>
        <span className="b3">Kinnect</span>
      </div>

      <div className="wall-nav-links">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`wall-nav-link ${pathname === item.path ? "active" : ""}`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        <Weather />
        <ThemeToggle />
        {isDashboard && (
          <form action={regenerateAction}>
            <button type="submit" className="btn-primary sm">
              <CalendarIcon size={16} />
              Regenerate
            </button>
          </form>
        )}
        <Clock />
      </div>
    </nav>
  );
}
