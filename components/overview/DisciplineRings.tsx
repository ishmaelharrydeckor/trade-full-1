// components/overview/DisciplineRings.tsx
"use client";

import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

interface Props {
  ruleCompliance: number;   // 0 - 100
  emotionalAwareness: number; // 0 - 100
  consistency: number;        // 0 - 100
  currentStreak: number;
  hasData: boolean;
}

export default function DisciplineRings({
  ruleCompliance,
  emotionalAwareness,
  consistency,
  currentStreak,
  hasData,
}: Props) {
  const size = 180;
  const strokeWidth = 12;
  const center = size / 2;

  // Concentric circle radii
  const r1 = 70; // Outer (Rule Compliance)
  const r2 = 54; // Middle (Emotional Awareness)
  const r3 = 38; // Inner (Consistency)

  const c1 = r1 * 2 * Math.PI;
  const c2 = r2 * 2 * Math.PI;
  const c3 = r3 * 2 * Math.PI;

  const o1 = c1 - (Math.min(ruleCompliance, 100) / 100) * c1;
  const o2 = c2 - (Math.min(emotionalAwareness, 100) / 100) * c2;
  const o3 = c3 - (Math.min(consistency, 100) / 100) * c3;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-transparent w-full h-full min-h-[220px]">
      {!hasData ? (
        <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 max-w-xs my-auto">
          <span className="text-xs font-bold text-slate-400">No behavioral reviews completed</span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
            Complete your first daily audit to begin building your discipline profile.
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          {/* SVG Concentric Rings */}
          <div className="relative flex items-center justify-center w-[130px] h-[130px] md:w-[180px] md:h-[180px] my-3">
            <svg 
              viewBox="0 0 180 180" 
              className="w-full h-full -rotate-90"
            >
              <defs>
                <linearGradient id="ring1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
                <linearGradient id="ring2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <linearGradient id="ring3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#6b21a8" />
                </linearGradient>
              </defs>

              {/* Ring 1 Base & Value (Compliance) */}
              <circle
                cx={center}
                cy={center}
                r={r1}
                fill="transparent"
                stroke="rgba(56, 189, 248, 0.05)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={r1}
                fill="transparent"
                stroke="url(#ring1Grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={c1}
                strokeDashoffset={o1}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Ring 2 Base & Value (Awareness) */}
              <circle
                cx={center}
                cy={center}
                r={r2}
                fill="transparent"
                stroke="rgba(52, 211, 153, 0.05)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={r2}
                fill="transparent"
                stroke="url(#ring2Grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={c2}
                strokeDashoffset={o2}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Ring 3 Base & Value (Consistency) */}
              <circle
                cx={center}
                cy={center}
                r={r3}
                fill="transparent"
                stroke="rgba(192, 132, 252, 0.05)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={center}
                cy={center}
                r={r3}
                fill="transparent"
                stroke="url(#ring3Grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={c3}
                strokeDashoffset={o3}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center Text Indicator */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl md:text-3xl font-black text-white font-mono leading-none">{currentStreak}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Day Streak</span>
            </div>
          </div>

          {/* Ring Legend Details */}
          <div className="grid grid-cols-3 gap-1 md:gap-2 w-full mt-3 text-center">
            <div className="flex flex-col items-center group relative cursor-help">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                Compliance
                <InfoTooltip text="Compliance: Percentage of daily checkmark rules satisfied." />
              </span>
              <span className="text-xs font-black text-white font-mono mt-0.5">{ruleCompliance}%</span>
            </div>
            <div className="flex flex-col items-center group relative cursor-help">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                Awareness
                <InfoTooltip text="Awareness: Percentage of trading days with emotional reflections logged." />
              </span>
              <span className="text-xs font-black text-white font-mono mt-0.5">{emotionalAwareness}%</span>
            </div>
            <div className="flex flex-col items-center group relative cursor-help">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-purple-400">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                Consistency
                <InfoTooltip text="Consistency: Current audit streak relative to your 7-day target." />
              </span>
              <span className="text-xs font-black text-white font-mono mt-0.5">{consistency}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
