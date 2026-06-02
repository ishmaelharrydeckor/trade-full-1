"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("tj-theme") as "dark" | "light" | null;
    const initial = stored ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("tj-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full border transition-colors duration-200",
        theme === "dark"
          ? "border-white/10 bg-white/5"
          : "border-black/10 bg-black/5",
        className
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          "absolute flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200",
          theme === "dark"
            ? "translate-x-1 bg-slate-700"
            : "translate-x-[1.625rem] bg-white shadow-sm"
        )}
      >
        {theme === "dark" ? (
          <Moon className="h-3.5 w-3.5 text-blue-300" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}
