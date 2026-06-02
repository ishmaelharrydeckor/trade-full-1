// components/backtest/BacktestChart.tsx
// Pure rendering — takes candles + current position, draws the chart.
// Data fetching + playback state live in the parent (BacktestSessionClient).
"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function BacktestChart({
  candles,
  currentBarIndex,
}: {
  candles: Candle[];
  currentBarIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const hasInitialFit = useRef(false);

  // Initialize chart once, clean up on unmount
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
      rightPriceScale: { borderColor: "#1e293b" },
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
    hasInitialFit.current = false;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update visible slice whenever data or playback position changes.
  // Only show bars [0..currentBarIndex] — future bars are HIDDEN so the
  // trader can't peek ahead. This is the core of bar-by-bar backtesting.
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    const slice = candles.slice(0, currentBarIndex + 1);
    seriesRef.current.setData(slice as never);

    // Auto-fit only on first data load. Subsequent updates preserve
    // the user's scroll/zoom level so playback feels continuous.
    if (!hasInitialFit.current && chartRef.current && slice.length > 0) {
      chartRef.current.timeScale().fitContent();
      hasInitialFit.current = true;
    }
  }, [candles, currentBarIndex]);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
