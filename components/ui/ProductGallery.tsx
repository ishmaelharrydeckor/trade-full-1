"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Calendar, Target, BookOpen, BookText } from "lucide-react";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: any;
}

const SLIDES: Slide[] = [
  {
    id: "dashboard",
    title: "Trading Dashboard",
    subtitle: "Trading Dashboard Overview",
    description: "See your performance beyond P&L. Track live open positions, historical win rate, profit factor, and recent trade metrics instantly.",
    image: "/images/Screenshot_7-6-2026_101655_www.tradejernal.com.jpeg",
    icon: RefreshCw,
  },
  {
    id: "insights",
    title: "AI Insights Coach",
    subtitle: "Gemini-Powered AI Coach",
    description: "Automated analysis of your last trades. Gemini isolates your blind spots, highlights what is working, and sets your focus area for the week.",
    image: "/images/Screenshot_7-6-2026_101814_www.tradejernal.com.jpeg",
    icon: BookText,
  },
  {
    id: "calendar",
    title: "Command Calendar",
    subtitle: "Trading Command Calendar",
    description: "Visualize your aggregate P&L distributions in a month-by-month grid layout, highlighting green winning days and red losing days.",
    image: "/images/Screenshot_7-6-2026_101726_www.tradejernal.com.jpeg",
    icon: Calendar,
  },
  {
    id: "discipline",
    title: "Habits & Heatmaps",
    subtitle: "Discipline Tracker",
    description: "Establish daily habits and guidelines, track compliance scores, monitor streaks, and log entries on a visual GitHub-style discipline heatmap.",
    image: "/images/Screenshot_7-6-2026_101759_www.tradejernal.com.jpeg",
    icon: Target,
  },
  {
    id: "journal",
    title: "Reflections Journal",
    subtitle: "Trading Reflections Journal",
    description: "Write detailed pre-session plans and review state-of-mind triggers. Connect your notes directly to log performance history.",
    image: "/images/Screenshot_7-6-2026_101739_www.tradejernal.com.jpeg",
    icon: BookOpen,
  },
];

export default function ProductGallery() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const activeSlide = SLIDES[activeIdx];

  // Reset scroll when slide changes
  useEffect(() => {
    setTranslateY(0);
  }, [activeIdx]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

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
    <div className="w-full">
      {/* Tab Selectors */}
      <div className="mb-8 flex flex-wrap justify-center gap-2 md:gap-3">
        {SLIDES.map((slide, idx) => {
          const Icon = slide.icon;
          const isActive = idx === activeIdx;
          return (
            <button
              key={slide.id}
              onClick={() => setActiveIdx(idx)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide transition-all md:text-sm"
              style={{
                border: "1px solid var(--card-border)",
                backgroundColor: isActive ? "var(--bg-hover)" : "var(--badge-bg)",
                color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                boxShadow: isActive ? "0 0 12px rgba(59, 130, 246, 0.15)" : "none",
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{slide.title}</span>
            </button>
          );
        })}
      </div>

      {/* Frame Container */}
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative mx-auto max-w-4xl overflow-hidden rounded-2xl border p-2 backdrop-blur-md transition-all duration-300 md:p-3"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "rgba(255, 255, 255, 0.01)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.05)",
        }}
      >
        {/* Decorative Top Bar for Browser Mockup */}
        <div
          className="flex items-center justify-between border-b pb-2 px-1 mb-2"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="rounded bg-black/40 px-6 py-0.5 text-[9px] tracking-wide text-slate-500 font-mono">
            {activeSlide.subtitle.toLowerCase().replace(/\s+/g, "-")}.tj
          </div>
          <div className="w-10" />
        </div>

        {/* Carousel Content Viewport */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/60">
          <div
            className="absolute top-0 left-0 w-full transition-transform ease-in-out"
            style={{
              transform: `translateY(${translateY}px)`,
              transitionDuration: `${Math.max(3000, Math.min(8000, Math.abs(translateY) * 4.5))}ms`,
            }}
          >
            <img
              ref={imageRef}
              src={activeSlide.image}
              alt={activeSlide.title}
              className="w-full h-auto block"
            />
          </div>

          {/* Navigation Controls Overlay */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 md:pl-4 z-10">
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 border border-white/10 text-white transition hover:bg-black/90 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 md:pr-4 z-10">
            <button
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 border border-white/10 text-white transition hover:bg-black/90 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Info */}
      <div className="mx-auto mt-6 max-w-xl text-center">
        <h4 className="text-lg font-bold tracking-tight text-[color:var(--text-primary)]">
          {activeSlide.subtitle}
        </h4>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {activeSlide.description}
        </p>
      </div>
    </div>
  );
}
