"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("homebase-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("homebase-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--bg-panel-hover)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-widget)'
      }}
      title="Toggle Day/Night Sunlight Mode"
    >
      {theme === "dark" ? (
        <>
          <Sun size={18} color="#f59e0b" />
          <span>Day Mode</span>
        </>
      ) : (
        <>
          <Moon size={18} color="#0ea5e9" />
          <span>Night Mode</span>
        </>
      )}
    </button>
  );
}
