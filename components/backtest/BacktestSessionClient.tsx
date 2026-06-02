// components/backtest/BacktestSessionClient.tsx
"use client";

import BacktestChart from "./BacktestChart";
import { fmtUsd } from "@/lib/format";
import { Info } from "lucide-react";

interface BacktestSession {
  id: string;
  name: string;
  symbol: string;
  asset_class: string;
  timeframe: string;
  range_start: string;
  range_end: string;
  starting_balance: number;
  status: "active" | "completed" | "archived";
}

export default function BacktestSessionClient({
  session,
}: {
  session: BacktestSession;
}) {
  const days = Math.ceil(
    (new Date(session.range_end).getTime() -
      new Date(session.range_start).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl">{session.name}</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {session.symbol} · {session.timeframe} ·{" "}
              <span className="capitalize">{session.asset_class}</span> · {days}{" "}
              days
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

      <BacktestChart
        symbol={session.symbol}
        timeframe={session.timeframe}
        rangeStart={session.range_start}
        rangeEnd={session.range_end}
      />

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold">M4.1 — Foundation only.</p>
          <p className="mt-1 text-xs text-amber-100/80">
            This drop ships data fetching + chart rendering. Coming next: playback
            controls (M4.2), trade simulation (M4.3), and analytics integration
            (M4.4). For now you can scroll/zoom the chart and verify the data
            source works for your chosen instrument.
          </p>
        </div>
      </div>
    </div>
  );
}
