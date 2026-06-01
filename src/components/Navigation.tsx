"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "By Person", path: "/byperson" },
    { name: "Groceries", path: "/groceries" },
    { name: "Chores", path: "/chores" },
  ];

  return (
    <nav className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
      <div style={{ marginRight: 'auto', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '1px' }}>
        Kinnect HomeBase
      </div>
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.path}
          className={`nav-link ${pathname === item.path ? 'active' : ''}`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
