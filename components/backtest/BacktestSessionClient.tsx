// components/backtest/BacktestSessionClient.tsx
// Owns: candles data, playback state (current bar, isPlaying, speed),
// and debounced persistence of position back to the DB.
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Info, Loader2, AlertCircle } from "lucide-react";
import BacktestChart, { type Candle } from "./BacktestChart";
import PlaybackControls, { type PlaybackSpeed } from "./PlaybackControls";
import { fmtUsd } from "@/lib/format";

interface BacktestSession {
  id: string;
  account_id: string;
  name: string;
  symbol: string;
  asset_class: string;
  timeframe: string;
  range_start: string;
  range_end: string;
  current_bar_time: string | null;
  starting_balance: number;
  status: "active" | "completed" | "archived";
}

const SPEED_MS: Record<Exclude<PlaybackSpeed, "instant">, number> = {
  1: 1000,
  5: 200,
  10: 100,
};

export default function BacktestSessionClient({
  session,
}: {
  session: BacktestSession;
}) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const playTimer = useRef<NodeJS.Timeout | null>(null);

  // -- Fetch candles once on mount
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const startMs = new Date(session.range_start).getTime();
    const endMs = new Date(session.range_end).getTime();

    fetch(
      `/api/backtest/data?symbol=${encodeURIComponent(session.symbol)}&timeframe=${session.timeframe}&start=${startMs}&end=${endMs}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const c = (data.candles ?? []) as Candle[];
        setCandles(c);

        // Restore prior playback position if the session has one
        if (session.current_bar_time && c.length > 0) {
          const savedTime = Math.floor(
            new Date(session.current_bar_time).getTime() / 1000
          );
          const idx = c.findIndex((bar) => bar.time >= savedTime);
          setCurrentBarIndex(idx >= 0 ? idx : 0);
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [session.id, session.symbol, session.timeframe, session.range_start, session.range_end, session.current_bar_time]);

  // -- Debounced save of current bar position to DB
  const saveCurrentPosition = useCallback(
    (barIndex: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const bar = candles[barIndex];
        if (!bar) return;
        await fetch(`/api/backtest/sessions/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_bar_time: new Date(bar.time * 1000).toISOString(),
          }),
        }).catch(() => {
          /* silent — playback continues even if save fails */
        });
      }, 1000);
    },
    [candles, session.id]
  );

  // Save when index changes (debounced)
  useEffect(() => {
    if (candles.length > 0) saveCurrentPosition(currentBarIndex);
  }, [currentBarIndex, candles.length, saveCurrentPosition]);

  // -- Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimer.current) {
        clearInterval(playTimer.current);
        playTimer.current = null;
      }
      return;
    }
    if (speed === "instant") {
      // Jump straight to the end
      setCurrentBarIndex(candles.length - 1);
      setIsPlaying(false);
      return;
    }
    const intervalMs = SPEED_MS[speed];
    playTimer.current = setInterval(() => {
      setCurrentBarIndex((idx) => {
        if (idx >= candles.length - 1) {
          setIsPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, intervalMs);
    return () => {
      if (playTimer.current) {
        clearInterval(playTimer.current);
        playTimer.current = null;
      }
    };
  }, [isPlaying, speed, candles.length]);

  // -- Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore when typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setCurrentBarIndex((i) => Math.min(i + 1, candles.length - 1));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentBarIndex((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [candles.length]);

  const currentBarTime = candles[currentBarIndex]?.time ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl">{session.name}</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {session.symbol} · {session.timeframe} ·{" "}
              <span className="capitalize">{session.asset_class}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Starting balance
            </div>
            <div className="font-mono text-xl tabular-nums">
              {fmtUsd(session.starting_balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex h-[480px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading {session.symbol} {session.timeframe} candles…
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Failed to load chart data</div>
            <div className="mt-0.5 text-xs">{error}</div>
          </div>
        </div>
      ) : (
        <>
          <BacktestChart candles={candles} currentBarIndex={currentBarIndex} />

          <PlaybackControls
            isPlaying={isPlaying}
            speed={speed}
            currentBarIndex={currentBarIndex}
            totalBars={candles.length}
            currentTime={currentBarTime}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onStepForward={() =>
              setCurrentBarIndex((i) => Math.min(i + 1, candles.length - 1))
            }
            onStepBack={() =>
              setCurrentBarIndex((i) => Math.max(i - 1, 0))
            }
            onJumpToStart={() => setCurrentBarIndex(0)}
            onJumpToEnd={() => setCurrentBarIndex(candles.length - 1)}
            onSpeedChange={setSpeed}
          />
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold">M4.2 — Playback shipped.</p>
          <p className="mt-1 text-xs text-amber-100/80">
            Use <kbd className="rounded border border-amber-500/30 bg-black/30 px-1 font-mono text-[10px]">Space</kbd> to play/pause,{" "}
            <kbd className="rounded border border-amber-500/30 bg-black/30 px-1 font-mono text-[10px]">→</kbd> /{" "}
            <kbd className="rounded border border-amber-500/30 bg-black/30 px-1 font-mono text-[10px]">←</kbd> to step.
            Position is auto-saved 1s after each change. Trade simulation (click chart to enter, set SL/TP) arrives in M4.3.
          </p>
        </div>
      </div>
    </div>
  );
}
