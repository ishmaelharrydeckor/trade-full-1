// components/backtest/BacktestSessionClient.tsx
// Orchestrates: data fetching, playback state, open positions, SL/TP hit
// detection, closed-trade persistence to the trades table.
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Info, Loader2, AlertCircle } from "lucide-react";
import BacktestChart, { type Candle, type ChartMarker } from "./BacktestChart";
import PlaybackControls, { type PlaybackSpeed } from "./PlaybackControls";
import NewTradePanel from "./NewTradePanel";
import BacktestOpenPositions from "./BacktestOpenPositions";
import BacktestClosedTrades from "./BacktestClosedTrades";
import BacktestSessionStats from "./BacktestSessionStats";
import {
  type BacktestOpenPosition,
  computePnl,
  checkSlTpHit,
  uuid,
} from "@/lib/backtest-trade";
import { getInstrument } from "@/lib/backtest-instruments";
import { fmtUsd } from "@/lib/format";
import type { Trade } from "@/types/database";

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
  open_positions: BacktestOpenPosition[];
  status: "active" | "completed" | "archived";
}

const SPEED_MS: Record<Exclude<PlaybackSpeed, "instant">, number> = {
  1: 1000,
  5: 200,
  10: 100,
};

export default function BacktestSessionClient({
  session: initialSession,
}: {
  session: BacktestSession;
}) {
  // === Constants for this session
  const instrument = getInstrument(initialSession.symbol);
  const contractValue = instrument?.contractValue ?? 1;

  // === State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [openPositions, setOpenPositions] = useState<BacktestOpenPosition[]>(
    initialSession.open_positions ?? []
  );
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);

  // === Refs for debounced persistence
  const saveBarTimer = useRef<NodeJS.Timeout | null>(null);
  const savePositionsTimer = useRef<NodeJS.Timeout | null>(null);
  const playTimer = useRef<NodeJS.Timeout | null>(null);

  // === Fetch candles + existing closed trades on mount
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const startMs = new Date(initialSession.range_start).getTime();
    const endMs = new Date(initialSession.range_end).getTime();

    Promise.all([
      fetch(
        `/api/backtest/data?symbol=${encodeURIComponent(initialSession.symbol)}&timeframe=${initialSession.timeframe}&start=${startMs}&end=${endMs}`
      ).then((r) => r.json()),
      fetch(`/api/backtest/sessions/${initialSession.id}/trade`).then((r) =>
        r.json()
      ),
    ])
      .then(([dataRes, tradesRes]) => {
        if (!alive) return;
        if (dataRes.error) {
          setError(dataRes.error);
          return;
        }
        const c = (dataRes.candles ?? []) as Candle[];
        setCandles(c);
        setClosedTrades((tradesRes.trades ?? []) as Trade[]);

        if (initialSession.current_bar_time && c.length > 0) {
          const savedTime = Math.floor(
            new Date(initialSession.current_bar_time).getTime() / 1000
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
  }, [
    initialSession.id,
    initialSession.symbol,
    initialSession.timeframe,
    initialSession.range_start,
    initialSession.range_end,
    initialSession.current_bar_time,
  ]);

  // === Debounced saves
  const saveBarPosition = useCallback(
    (barIndex: number) => {
      if (saveBarTimer.current) clearTimeout(saveBarTimer.current);
      saveBarTimer.current = setTimeout(async () => {
        const bar = candles[barIndex];
        if (!bar) return;
        fetch(`/api/backtest/sessions/${initialSession.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_bar_time: new Date(bar.time * 1000).toISOString(),
          }),
        }).catch(() => {});
      }, 1000);
    },
    [candles, initialSession.id]
  );

  const saveOpenPositions = useCallback(
    (positions: BacktestOpenPosition[]) => {
      if (savePositionsTimer.current) clearTimeout(savePositionsTimer.current);
      savePositionsTimer.current = setTimeout(async () => {
        fetch(`/api/backtest/sessions/${initialSession.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ open_positions: positions }),
        }).catch(() => {});
      }, 500);
    },
    [initialSession.id]
  );

  // Persist position changes
  useEffect(() => {
    if (candles.length > 0) saveBarPosition(currentBarIndex);
  }, [currentBarIndex, candles.length, saveBarPosition]);
  useEffect(() => {
    saveOpenPositions(openPositions);
  }, [openPositions, saveOpenPositions]);

  // === SL/TP hit detection — runs whenever bar advances forward
  const closeTrade = useCallback(
    async (
      position: BacktestOpenPosition,
      exitPrice: number,
      exitTime: string,
      exitReason: "sl" | "tp" | "manual"
    ) => {
      const pnl = computePnl({
        direction: position.direction,
        entry: position.entry_price,
        exit: exitPrice,
        volume: position.volume,
        contractValue,
      });

      try {
        const res = await fetch(
          `/api/backtest/sessions/${initialSession.id}/trade`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              symbol: position.symbol,
              asset_class: instrument?.assetClass,
              direction: position.direction,
              volume: position.volume,
              entry_price: position.entry_price,
              exit_price: exitPrice,
              open_time: position.entry_time,
              close_time: exitTime,
              pnl,
              stop_loss: position.stop_loss,
              take_profit: position.take_profit,
              mindset: position.mindset,
              notes: position.notes,
              tags: position.tags,
              exit_reason: exitReason,
            }),
          }
        );
        const data = await res.json();
        if (res.ok && data.trade) {
          setClosedTrades((prev) => [data.trade, ...prev]);
        }
      } catch {
        /* fail silently for now — could surface error toast later */
      }

      // Remove from open positions
      setOpenPositions((prev) => prev.filter((p) => p.id !== position.id));
    },
    [contractValue, initialSession.id, instrument?.assetClass]
  );

  // Check SL/TP on bar advance
  const prevBarIndex = useRef(currentBarIndex);
  useEffect(() => {
    // Only check when advancing forward (not when stepping back / jumping to start)
    if (
      currentBarIndex > prevBarIndex.current &&
      candles.length > 0 &&
      openPositions.length > 0
    ) {
      const bar = candles[currentBarIndex];
      if (bar) {
        for (const position of openPositions) {
          // Don't fire on the bar where we just opened
          if (position.entry_bar_index >= currentBarIndex) continue;
          const hit = checkSlTpHit(position, bar);
          if (hit) {
            closeTrade(
              position,
              hit.hit_price,
              new Date(bar.time * 1000).toISOString(),
              hit.type
            );
          }
        }
      }
    }
    prevBarIndex.current = currentBarIndex;
  }, [currentBarIndex, candles, openPositions, closeTrade]);

  // === Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimer.current) {
        clearInterval(playTimer.current);
        playTimer.current = null;
      }
      return;
    }
    if (speed === "instant") {
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

  // === Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
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

  // === Handlers
  function handleOpenTrade(input: {
    direction: "long" | "short";
    volume: number;
    entry_price: number;
    stop_loss: number | null;
    take_profit: number | null;
    mindset: string | null;
    notes: string | null;
    tags: string[];
  }) {
    const bar = candles[currentBarIndex];
    if (!bar) return;
    const newPosition: BacktestOpenPosition = {
      id: uuid(),
      symbol: initialSession.symbol,
      direction: input.direction,
      volume: input.volume,
      entry_price: input.entry_price,
      entry_time: new Date(bar.time * 1000).toISOString(),
      entry_bar_index: currentBarIndex,
      stop_loss: input.stop_loss,
      take_profit: input.take_profit,
      mindset: input.mindset,
      notes: input.notes,
      tags: input.tags,
    };
    setOpenPositions((prev) => [...prev, newPosition]);
  }

  function handleManualClose(positionId: string) {
    const position = openPositions.find((p) => p.id === positionId);
    const bar = candles[currentBarIndex];
    if (!position || !bar) return;
    closeTrade(
      position,
      bar.close,
      new Date(bar.time * 1000).toISOString(),
      "manual"
    );
  }

  // === Build chart markers from open positions + closed trades
  const markers = useMemo<ChartMarker[]>(() => {
    const m: ChartMarker[] = [];
    // Closed trades: entry + exit markers
    for (const t of closedTrades) {
      if (t.open_time) {
        m.push({
          time: Math.floor(new Date(t.open_time).getTime() / 1000),
          position: t.direction === "long" ? "belowBar" : "aboveBar",
          color: t.direction === "long" ? "#22c55e" : "#ef4444",
          shape: t.direction === "long" ? "arrowUp" : "arrowDown",
          text: t.direction === "long" ? "BUY" : "SELL",
        });
      }
      if (t.close_time) {
        const pnl = Number(t.pnl) || 0;
        m.push({
          time: Math.floor(new Date(t.close_time).getTime() / 1000),
          position: t.direction === "long" ? "aboveBar" : "belowBar",
          color: pnl > 0 ? "#22c55e" : pnl < 0 ? "#ef4444" : "#94a3b8",
          shape: "circle",
          text: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE",
        });
      }
    }
    // Open positions: entry markers
    for (const p of openPositions) {
      m.push({
        time: Math.floor(new Date(p.entry_time).getTime() / 1000),
        position: p.direction === "long" ? "belowBar" : "aboveBar",
        color: p.direction === "long" ? "#3b82f6" : "#a855f7",
        shape: p.direction === "long" ? "arrowUp" : "arrowDown",
        text: p.direction === "long" ? "BUY" : "SELL",
      });
    }
    return m;
  }, [closedTrades, openPositions]);

  const currentBar = candles[currentBarIndex];
  const currentPrice = currentBar?.close ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl">{initialSession.name}</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {initialSession.symbol} · {initialSession.timeframe} ·{" "}
              <span className="capitalize">{initialSession.asset_class}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Starting balance
            </div>
            <div className="font-mono text-xl tabular-nums">
              {fmtUsd(initialSession.starting_balance)}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[480px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading {initialSession.symbol} {initialSession.timeframe} candles…
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
          <BacktestChart
            candles={candles}
            currentBarIndex={currentBarIndex}
            markers={markers}
          />

          <PlaybackControls
            isPlaying={isPlaying}
            speed={speed}
            currentBarIndex={currentBarIndex}
            totalBars={candles.length}
            currentTime={currentBar?.time ?? null}
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

          <BacktestSessionStats
            closedTrades={closedTrades}
            startingBalance={initialSession.starting_balance}
          />

          <BacktestOpenPositions
            positions={openPositions}
            currentPrice={currentPrice}
            contractValue={contractValue}
            onClose={handleManualClose}
          />

          <div>
            <NewTradePanel
              symbol={initialSession.symbol}
              currentPrice={currentPrice}
              onOpen={handleOpenTrade}
            />
          </div>

          <BacktestClosedTrades trades={closedTrades} />
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-sm text-emerald-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <p className="font-semibold">M4.3 — Trade simulation shipped.</p>
          <p className="mt-1 text-xs text-emerald-100/80">
            Open positions auto-close when price touches SL or TP as bars
            advance. All closed trades land in your <strong>trades</strong>{" "}
            table flagged as backtest. Open positions persist across page
            refreshes. Next: M4.4 — analytics integration (toggle to include
            backtest trades in main dashboard charts).
          </p>
        </div>
      </div>
    </div>
  );
}
