// components/backtest/PlaybackControls.tsx
"use client";

import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  FastForward,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PlaybackSpeed = 1 | 5 | 10 | "instant";

export default function PlaybackControls({
  isPlaying,
  speed,
  currentBarIndex,
  totalBars,
  currentTime,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onJumpToStart,
  onJumpToEnd,
  onSpeedChange,
}: {
  isPlaying: boolean;
  speed: PlaybackSpeed;
  currentBarIndex: number;
  totalBars: number;
  currentTime: number | null;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSpeedChange: (s: PlaybackSpeed) => void;
}) {
  const atStart = currentBarIndex <= 0;
  const atEnd = currentBarIndex >= totalBars - 1;
  const progress = totalBars > 0 ? ((currentBarIndex + 1) / totalBars) * 100 : 0;

  const timeLabel = currentTime
    ? new Date(currentTime * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur">
      {/* Progress bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-blue-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: transport controls */}
        <div className="flex items-center gap-1">
          <CtrlButton
            onClick={onJumpToStart}
            disabled={atStart}
            title="Restart (jump to first bar)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </CtrlButton>
          <CtrlButton
            onClick={onStepBack}
            disabled={atStart}
            title="Step back one bar"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </CtrlButton>
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            disabled={atEnd && !isPlaying}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
              isPlaying
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>
          <CtrlButton
            onClick={onStepForward}
            disabled={atEnd}
            title="Step forward one bar"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </CtrlButton>
          <CtrlButton
            onClick={onJumpToEnd}
            disabled={atEnd}
            title="Jump to last bar"
          >
            <FastForward className="h-3.5 w-3.5" />
          </CtrlButton>
        </div>

        {/* Middle: bar position + time */}
        <div className="flex flex-1 min-w-0 flex-col items-center px-2 text-center">
          <div className="font-mono text-sm tabular-nums text-slate-200">
            Bar {currentBarIndex + 1} / {totalBars}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">{timeLabel}</div>
        </div>

        {/* Right: speed selector */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-slate-400">
            Speed
          </span>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
            {([1, 5, 10, "instant"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition",
                  speed === s
                    ? "bg-white font-semibold text-slate-900"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {s === "instant" ? "⏩" : `${s}x`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 transition",
        "hover:bg-white/10 hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/[0.02]"
      )}
    >
      {children}
    </button>
  );
}
