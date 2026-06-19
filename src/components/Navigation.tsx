"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "By Person", path: "/byperson" },
    { name: "Groceries", path: "/groceries" },
  ];

  return (
    <nav className="wall-nav">
      <div className="wall-nav-brand">Kinnect HomeBase</div>
      <div className="wall-nav-links">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`wall-nav-link ${pathname === item.path ? 'active' : ''}`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
