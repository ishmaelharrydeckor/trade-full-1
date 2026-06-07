"use client";

import { useState, useRef } from "react";

interface BrowserScrollMockupProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  urlText?: string;
}

export default function BrowserScrollMockup({
  src,
  alt,
  aspectRatio = "aspect-[16/11]",
  urlText = "app.trade-journal.io",
}: BrowserScrollMockupProps) {
  const [translateY, setTranslateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current && imageRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const imageHeight = imageRef.current.clientHeight;
      if (imageHeight > containerHeight) {
        setTranslateY(containerHeight - imageHeight);
      }
    }
  };

  const handleMouseLeave = () => {
    setTranslateY(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative ${aspectRatio} w-full overflow-hidden rounded-2xl border p-2 backdrop-blur-md transition-all duration-300 md:p-3`}
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "rgba(255, 255, 255, 0.01)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.05)",
      }}
    >
      {/* Browser Bar */}
      <div
        className="flex items-center justify-between border-b pb-2 px-1 mb-2"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="rounded bg-black/40 px-4 py-0.5 text-[9px] tracking-wide text-slate-500 font-mono">
          {urlText}
        </div>
        <div className="w-8" />
      </div>

      {/* Viewport */}
      <div className="relative h-[calc(100%-28px)] w-full overflow-hidden rounded-lg bg-black/40">
        <div
          className="absolute top-0 left-0 w-full transition-transform ease-in-out"
          style={{
            transform: `translateY(${translateY}px)`,
            transitionDuration: `${Math.max(3000, Math.min(8000, Math.abs(translateY) * 4.5))}ms`,
          }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="w-full h-auto block"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
