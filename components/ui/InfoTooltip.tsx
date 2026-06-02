// components/ui/InfoTooltip.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InfoTooltip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // If too close to top, show below
      setPosition(rect.top < 80 ? "bottom" : "top");
    }
  }, [show]);

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center rounded-full p-0.5 text-slate-500 transition hover:text-slate-300 focus:outline-none"
        aria-label="More info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {show && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 w-56 rounded-lg border border-white/10 bg-[#1a2235] px-3 py-2.5 text-xs leading-relaxed text-slate-300 shadow-xl shadow-black/40",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            position === "top"
              ? "bottom-full left-1/2 mb-2 -translate-x-1/2"
              : "top-full left-1/2 mt-2 -translate-x-1/2"
          )}
        >
          {text}
          {/* Arrow */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent",
              position === "top"
                ? "top-full border-t-[#1a2235]"
                : "bottom-full border-b-[#1a2235]"
            )}
          />
        </div>
      )}
    </span>
  );
}
