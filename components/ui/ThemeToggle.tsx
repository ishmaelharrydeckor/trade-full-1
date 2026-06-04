"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
];

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("tj-theme") as Theme | null;
    const initial = (stored === "dark" || stored === "light") ? stored : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-theme-toggle]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  function select(t: Theme) {
    setTheme(t);
    localStorage.setItem("tj-theme", t);
    document.documentElement.setAttribute("data-theme", t);
    setOpen(false);
  }

  if (!mounted) return null;

  const current = THEMES.find((t) => t.id === theme)!;
  const CurrentIcon = current.icon;

  return (
    <div className={cn("relative", className)} data-theme-toggle>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={`Theme: ${current.label}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition duration-150"
        style={{
          backgroundColor: 'var(--app-elevated)',
          border: '1px solid var(--app-border)',
          color: 'var(--text-secondary)',
        }}
        aria-label="Change theme"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[140px] rounded-xl p-1 shadow-xl"
          style={{
            backgroundColor: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
          }}
        >
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => select(t.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition duration-150",
                )}
                style={{
                  backgroundColor: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {active && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
