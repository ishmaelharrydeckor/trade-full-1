"use client";

// components/ui/AnimatedFeatureIcons.tsx
// Lightweight SVG + CSS animations for landing page feature highlights.
// These replace static icons with eye-catching micro-animations.

import { useEffect, useState } from "react";

/* ───────────────────────────────────────────────────────────
   1. AUTO-SYNC — Rotating arrows + live chart drawing itself
   ─────────────────────────────────────────────────────────── */
export function SyncAnimation() {
  return (
    <div className="feature-icon-wrap">
      <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
        {/* Background glow */}
        <circle cx="60" cy="60" r="50" fill="url(#syncGlow)" opacity="0.15" />

        {/* Rotating sync arrows */}
        <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: "60px 60px" }}>
          <path
            d="M60 25 C75 25, 85 35, 85 50"
            stroke="var(--accent-blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="87,45 85,53 79,47" fill="var(--accent-blue)" />
          <path
            d="M60 95 C45 95, 35 85, 35 70"
            stroke="var(--accent-blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="33,75 35,67 41,73" fill="var(--accent-blue)" />
        </g>

        {/* Live chart line drawing itself */}
        <polyline
          points="30,78 42,72 50,75 58,62 68,65 76,52 90,48"
          stroke="var(--accent-profit)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="chart-draw"
        />

        {/* Pulsing dot at chart end */}
        <circle cx="90" cy="48" r="3" fill="var(--accent-profit)" className="animate-pulse" />

        <defs>
          <radialGradient id="syncGlow">
            <stop offset="0%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   2. AI INSIGHTS — Brain with orbiting sparkle particles
   ─────────────────────────────────────────────────────────── */
export function AiAnimation() {
  return (
    <div className="feature-icon-wrap">
      <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
        {/* Background glow */}
        <circle cx="60" cy="60" r="50" fill="url(#aiGlow)" opacity="0.12" />

        {/* Brain outline */}
        <g transform="translate(35, 30)" stroke="var(--accent-indigo)" strokeWidth="2" strokeLinecap="round" fill="none">
          {/* Left hemisphere */}
          <path d="M25 55 C25 55, 5 50, 5 35 C5 20, 15 10, 25 10 C28 5, 22 0, 25 0" className="brain-pulse" />
          {/* Right hemisphere */}
          <path d="M25 55 C25 55, 45 50, 45 35 C45 20, 35 10, 25 10 C22 5, 28 0, 25 0" className="brain-pulse" style={{ animationDelay: "0.5s" }} />
          {/* Center line */}
          <line x1="25" y1="0" x2="25" y2="55" strokeWidth="1.5" opacity="0.3" />
          {/* Neural connections */}
          <path d="M15 20 Q25 25, 35 20" strokeWidth="1" opacity="0.5" />
          <path d="M10 35 Q25 40, 40 35" strokeWidth="1" opacity="0.5" />
        </g>

        {/* Orbiting sparkle particles */}
        <g className="animate-[spin_6s_linear_infinite]" style={{ transformOrigin: "60px 60px" }}>
          <circle cx="60" cy="15" r="2" fill="var(--accent-indigo)" opacity="0.8">
            <animate attributeName="r" values="1.5;3;1.5" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
        <g className="animate-[spin_8s_linear_infinite_reverse]" style={{ transformOrigin: "60px 60px" }}>
          <circle cx="100" cy="55" r="1.5" fill="var(--accent-blue)" opacity="0.7">
            <animate attributeName="r" values="1;2.5;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
        <g className="animate-[spin_10s_linear_infinite]" style={{ transformOrigin: "60px 60px" }}>
          <circle cx="25" cy="90" r="1.5" fill="var(--accent-profit)" opacity="0.6">
            <animate attributeName="r" values="1;2;1" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Static sparkles */}
        <Star cx={95} cy={28} delay={0} />
        <Star cx={20} cy={35} delay={1.2} />
        <Star cx={85} cy={88} delay={0.6} />

        <defs>
          <radialGradient id="aiGlow">
            <stop offset="0%" stopColor="var(--accent-indigo)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

function Star({ cx, cy, delay }: { cx: number; cy: number; delay: number }) {
  return (
    <g transform={`translate(${cx}, ${cy})`} opacity="0.7">
      <line x1="-4" y1="0" x2="4" y2="0" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
      </line>
      <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
      </line>
    </g>
  );
}

/* ───────────────────────────────────────────────────────────
   3. POSITION CALCULATOR — Gauge with animated needle
   ─────────────────────────────────────────────────────────── */
export function CalculatorAnimation() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="feature-icon-wrap">
      <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
        {/* Background glow */}
        <circle cx="60" cy="65" r="45" fill="url(#calcGlow)" opacity="0.12" />

        {/* Gauge arc background */}
        <path
          d="M25 80 A40 40 0 0 1 95 80"
          stroke="var(--card-border)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Gauge arc fill — animated */}
        <path
          d="M25 80 A40 40 0 0 1 95 80"
          stroke="url(#gaugeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          className="gauge-fill"
        />

        {/* Tick marks */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = -180 + i * 45;
          const rad = (angle * Math.PI) / 180;
          const x1 = 60 + 35 * Math.cos(rad);
          const y1 = 80 + 35 * Math.sin(rad);
          const x2 = 60 + 40 * Math.cos(rad);
          const y2 = 80 + 40 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle — swings to ~65% */}
        <line
          x1="60" y1="80"
          x2="60" y2="48"
          stroke="var(--accent-blue)"
          strokeWidth="2"
          strokeLinecap="round"
          className="gauge-needle"
          style={{ transformOrigin: "60px 80px" }}
        />

        {/* Center dot */}
        <circle cx="60" cy="80" r="4" fill="var(--accent-blue)" />
        <circle cx="60" cy="80" r="2" fill="var(--bg-app)" />

        {/* Lot size text */}
        <text
          x="60" y="100"
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="11"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          className={mounted ? "calc-number" : ""}
        >
          0.42 lots
        </text>
        <text
          x="60" y="112"
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="8"
          fontFamily="Inter, sans-serif"
        >
          1% risk · 50 pip SL
        </text>

        <defs>
          <radialGradient id="calcGlow">
            <stop offset="0%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-profit)" />
            <stop offset="50%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="var(--accent-loss)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
