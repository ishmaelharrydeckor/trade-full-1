// components/backtest/BacktestChart.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { Loader2, AlertCircle } from "lucide-react";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function BacktestChart({
  symbol,
  timeframe,
  rangeStart,
  rangeEnd,
}: {
  symbol: string;
  timeframe: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [barCount, setBarCount] = useState(0);

  // -- Initialize chart once, clean up on unmount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontFamily:
          "'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(30, 41, 59, 0.5)" },
        horzLines: { color: "rgba(30, 41, 59, 0.5)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1e293b",
      },
      rightPriceScale: {
        borderColor: "#1e293b",
      },
      crosshair: {
        vertLine: { color: "#475569", labelBackgroundColor: "#1e293b" },
        horzLine: { color: "#475569", labelBackgroundColor: "#1e293b" },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // -- Fetch and load candles whenever inputs change
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setBarCount(0);

    const startMs = new Date(rangeStart).getTime();
    const endMs = new Date(rangeEnd).getTime();

    fetch(
      `/api/backtest/data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&start=${startMs}&end=${endMs}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const candles = (data.candles ?? []) as Candle[];
        if (seriesRef.current) {
          // Cast satisfies lightweight-charts' CandlestickData type
          seriesRef.current.setData(candles as never);
          if (chartRef.current && candles.length > 0) {
            chartRef.current.timeScale().fitContent();
          }
        }
        setBarCount(candles.length);
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
  }, [symbol, timeframe, rangeStart, rangeEnd]);

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div ref={containerRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading {symbol} {timeframe}…
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-x-4 top-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Failed to load data</div>
            <div className="mt-0.5 text-xs">{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-black/60 px-2 py-1 text-[10px] text-slate-300">
          {barCount} bars
        </div>
      )}
    </div>
  );
}
