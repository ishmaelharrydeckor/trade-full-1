// components/beta/BetaBanner.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissedTime = localStorage.getItem("tj-beta-banner-dismissed-time");
      if (dismissedTime) {
        const timePassed = Date.now() - parseInt(dismissedTime, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (timePassed < sevenDays) {
          setIsVisible(false);
          return;
        }
      }
      setIsVisible(true);
    } catch (e) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("tj-beta-banner-dismissed-time", Date.now().toString());
    } catch (e) {
      // Fail silently
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-label="Beta feedback notice"
      className="w-full border-b select-none flex flex-row items-center justify-between"
      style={{
        backgroundColor: "#0B1220",
        borderColor: "rgba(59, 130, 246, 0.25)",
      }}
    >
      {/* Desktop Banner Layout (768px and up) */}
      <div className="hidden md:flex w-full flex-row items-center justify-center gap-3 py-3 px-12 min-h-[52px]">
        <span className="text-sm font-semibold tracking-wide" style={{ color: "#F8FAFC" }}>
          🚀 Trade·Journal is currently in beta. Your feedback helps shape what we build next.
        </span>
        <a
          href="https://www.tradejernal.com/beta-feedback"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{
            backgroundColor: "#3B82F6",
            minHeight: "44px",
            minWidth: "110px",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
        >
          Give Feedback
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{ minHeight: "44px", minWidth: "44px" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Banner Layout (Below 768px) */}
      <div className="flex md:hidden w-full flex-row items-center justify-between gap-2 px-3 h-11 text-[12px] font-semibold overflow-hidden">
        <span className="truncate text-white" style={{ color: "#F8FAFC" }}>
          🚀 Help shape Trade·Journal
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="https://www.tradejernal.com/beta-feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md px-3 text-[11px] font-bold text-white transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{
              backgroundColor: "#3B82F6",
              height: "32px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
          >
            Feedback
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ width: "32px", height: "32px" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
