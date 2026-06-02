// components/backtest/BacktestClosedTrades.tsx
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { fmtSignedUsd, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

export default function BacktestClosedTrades({
  trades,
}: {
  trades: Trade[];
}) {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500 backdrop-blur">
        No trades closed in this session yet. Open a position and let the bars
        play out, or close it manually.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <h3 className="mb-3 font-serif text-lg">
        Closed trades · {trades.length}
      </h3>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Dir</th>
              <th className="px-3 py-2 text-right">Vol</th>
              <th className="px-3 py-2 text-right">Entry → Exit</th>
              <th className="px-3 py-2 text-right">P&L</th>
              <th className="px-3 py-2 text-left">Closed</th>
              <th className="px-3 py-2 text-left">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {trades.map((t) => {
              const pnl = Number(t.pnl) || 0;
              const isWin = pnl > 0;
              const reason = (t.notes ?? "").startsWith("[Stopped out]")
                ? "Stop loss"
                : (t.notes ?? "").startsWith("[Take profit hit]")
                  ? "Take profit"
                  : "Manual";

              return (
                <tr key={t.id} className="text-slate-200">
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        t.direction === "long"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                      )}
                    >
                      {t.direction === "long" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {t.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-400">
                    {Number(t.volume).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-slate-400">
                    {t.entry_price} → {t.exit_price}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono tabular-nums",
                      isWin
                        ? "text-emerald-300"
                        : pnl < 0
                          ? "text-red-300"
                          : "text-slate-400"
                    )}
                  >
                    {fmtSignedUsd(pnl)}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {fmtDateTime(t.close_time)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-xs",
                      reason === "Stop loss"
                        ? "text-red-300"
                        : reason === "Take profit"
                          ? "text-emerald-300"
                          : "text-slate-400"
                    )}
                  >
                    {reason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
