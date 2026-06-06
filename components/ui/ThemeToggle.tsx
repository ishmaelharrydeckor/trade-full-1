// components/ui/ThemeToggle.tsx
"use client";

import { useEffect } from "react";

export default function ThemeToggle({ className }: { className?: string }) {
  useEffect(() => {
    // Force dark theme system-wide and clean up any past light theme state
    localStorage.setItem("tj-theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return null;
}
