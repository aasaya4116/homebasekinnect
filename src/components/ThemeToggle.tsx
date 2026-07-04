"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("homebase-theme") as Theme | null;
    const initial: Theme = saved ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    localStorage.setItem("homebase-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Segmented control: the highlighted segment IS the current theme.
  return (
    <div className="theme-seg" role="group" aria-label="Display theme">
      <button
        type="button"
        className={theme === "light" ? "on" : ""}
        aria-pressed={theme === "light"}
        onClick={() => apply("light")}
      >
        <Sun size={16} /> Day
      </button>
      <button
        type="button"
        className={theme === "dark" ? "on" : ""}
        aria-pressed={theme === "dark"}
        onClick={() => apply("dark")}
      >
        <Moon size={16} /> Night
      </button>
    </div>
  );
}
