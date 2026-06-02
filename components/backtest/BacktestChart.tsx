// components/backtest/BacktestChart.tsx
// Pure rendering — takes candles, current position, and trade markers.
// Future bars are hidden so the trader can't peek ahead.
"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartMarker {
  time: number;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
}

export default function BacktestChart({
  candles,
  currentBarIndex,
  markers = [],
}: {
  candles: Candle[];
  currentBarIndex: number;
  markers?: ChartMarker[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const hasInitialFit = useRef(false);

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

  // Update visible slice + markers
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    const slice = candles.slice(0, currentBarIndex + 1);
    seriesRef.current.setData(slice as never);

    // Only show markers whose time is <= the current bar (don't reveal future trades)
    const visibleTime = slice[slice.length - 1]?.time ?? 0;
    const visibleMarkers = markers
      .filter((m) => m.time <= visibleTime)
      .sort((a, b) => a.time - b.time)
      .map<SeriesMarker<Time>>((m) => ({
        time: m.time as Time,
        position: m.position,
        color: m.color,
        shape: m.shape,
        text: m.text,
      }));
    seriesRef.current.setMarkers(visibleMarkers);

    if (!hasInitialFit.current && chartRef.current && slice.length > 0) {
      chartRef.current.timeScale().fitContent();
      hasInitialFit.current = true;
    }
  }, [candles, currentBarIndex, markers]);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
