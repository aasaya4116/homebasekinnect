"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Monthly", path: "/monthly" },
    { name: "By Person", path: "/byperson" },
    { name: "Groceries", path: "/groceries" },
  ];

  return (
    <nav className="wall-nav">
      <div className="wall-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--accent-orange)', fontWeight: 900, letterSpacing: '0.12em', textShadow: '0 0 15px rgba(245, 158, 11, 0.3)' }}>ASAYA</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.08em' }}>HOMEBASE</span>
        <span style={{ 
          background: 'linear-gradient(135deg, var(--accent-blue), #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
          letterSpacing: '0.1em'
        }}>KINNect</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        <ThemeToggle />
      </div>
    </nav>
  );
}
