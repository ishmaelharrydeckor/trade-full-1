// components/backtest/BacktestSessionStats.tsx
"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import { fmtSignedUsd, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

export default function BacktestSessionStats({
  closedTrades,
  startingBalance,
}: {
  closedTrades: Trade[];
  startingBalance: number;
}) {
  const netPnl = closedTrades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const winners = closedTrades.filter((t) => Number(t.pnl) > 0).length;
  const losers = closedTrades.filter((t) => Number(t.pnl) < 0).length;
  const winRate =
    closedTrades.length > 0 ? (winners / closedTrades.length) * 100 : 0;
  const currentEquity = startingBalance + netPnl;
  const returnPct = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur md:grid-cols-5">
      <Stat
        icon={<BarChart3 className="h-3.5 w-3.5" />}
        label="Trades"
        value={String(closedTrades.length)}
      />
      <Stat
        label="Win rate"
        value={fmtPct(winRate, 1)}
        sub={`${winners}W / ${losers}L`}
      />
      <Stat
        label="Net P&L"
        value={fmtSignedUsd(netPnl)}
        valueClass={
          netPnl > 0 ? "text-emerald-300" : netPnl < 0 ? "text-red-300" : ""
        }
      />
      <Stat
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="Return"
        value={`${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`}
        valueClass={
          returnPct > 0
            ? "text-emerald-300"
            : returnPct < 0
              ? "text-red-300"
              : ""
        }
      />
      <Stat
        label="Equity"
        value={fmtSignedUsd(currentEquity).replace("+", "")}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-mono text-base tabular-nums text-slate-100",
          valueClass
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
