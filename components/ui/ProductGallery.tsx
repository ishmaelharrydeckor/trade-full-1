"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, RefreshCw, Calendar, Target, BookOpen, BookText, Calculator } from "lucide-react";

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
    id: "sync",
    title: "Live MT5 Sync",
    subtitle: "Auto-sync Trades",
    description: "Run our MetaTrader 5 Expert Advisor for hands-off transaction logging. Sync entry, exit, swaps, and execution parameters automatically.",
    image: "/images/dashboard-sync.png",
    icon: RefreshCw,
  },
  {
    id: "calculator",
    title: "Calculator",
    subtitle: "Risk Strategy & Sizing",
    description: "Define your risk strategy parameters and calculate exact lot sizing dynamically based on your current account equity.",
    image: "/images/dashboard-habits.png",
    icon: Calculator,
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "Trading Calendar",
    description: "Visualize performance patterns, daily outcomes, and win-loss distribution on a clean calendar interface.",
    image: "/images/dashboard-calendar.png",
    icon: Calendar,
  },
  {
    id: "discipline",
    title: "Discipline",
    subtitle: "Discipline Scoreboard",
    description: "Enforce consistency rules, build habit check-in streaks, and grow your behavior heatmap.",
    image: "/images/dashboard-progress.png",
    icon: Target,
  },
  {
    id: "playbook",
    title: "Playbook",
    subtitle: "Strategy Rules",
    description: "Define strategies, checklist items, and entry conditions. See trade performance analytics broken down by strategy.",
    image: "/images/dashboard-playbook.png",
    icon: BookOpen,
  },
  {
    id: "journal",
    title: "Journal",
    subtitle: "Psychology Notebook",
    description: "Document daily pre-session plans, directional bias, market conditions, and mental states alongside post-session reviews.",
    image: "/images/dashboard-journal.png",
    icon: BookText,
  },
];

export default function ProductGallery() {
  const [activeIdx, setActiveIdx] = useState(0);

  const activeSlide = SLIDES[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
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
      <div className="relative mx-auto max-w-5xl rounded-2xl border p-2 backdrop-blur-md transition-all duration-300 md:p-3"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "rgba(255, 255, 255, 0.01)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.05)",
        }}
      >
        {/* Decorative Top Bar for Browser Mockup */}
        <div className="flex items-center justify-between border-b pb-2.5 px-3 mb-2 md:mb-3"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
          </div>
          <div className="rounded bg-black/40 px-6 py-0.5 text-[10px] tracking-wide text-slate-500 font-mono">
            {activeSlide.subtitle.toLowerCase().replace(/\s+/g, "-")}.tj
          </div>
          <div className="w-10" />
        </div>

        {/* Carousel Content */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/60">
          <Image
            src={activeSlide.image}
            alt={activeSlide.title}
            fill
            priority
            unoptimized
            className="object-contain object-top transition-all duration-300 ease-in-out"
          />

          {/* Navigation Controls Overlay */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 md:pl-4">
            <button
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 border border-white/10 text-white transition hover:bg-black/90 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 md:pr-4">
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
