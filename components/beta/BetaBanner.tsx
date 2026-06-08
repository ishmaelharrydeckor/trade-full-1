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
      // Fallback if localStorage is disabled or errors out
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
      className="relative w-full border-b px-4 py-3 md:px-12 flex flex-col md:flex-row items-center justify-center gap-3 text-center transition-all duration-300 select-none min-h-[48px] md:min-h-[52px]"
      style={{
        backgroundColor: "#0B1220",
        borderColor: "rgba(59, 130, 246, 0.25)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-[85%]">
        <span
          className="text-xs md:text-sm font-semibold tracking-wide"
          style={{ color: "#F8FAFC" }}
        >
          🚀 TradeJournal is currently in beta. Your feedback helps shape what we build next.
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
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
    </div>
  );
}
