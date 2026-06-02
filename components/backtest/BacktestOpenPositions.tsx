// components/backtest/BacktestOpenPositions.tsx
"use client";

import { TrendingUp, TrendingDown, X } from "lucide-react";
import type { BacktestOpenPosition } from "@/lib/backtest-trade";
import { unrealizedPnl } from "@/lib/backtest-trade";
import { fmtSignedUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function BacktestOpenPositions({
  positions,
  currentPrice,
  contractValue,
  onClose,
}: {
  positions: BacktestOpenPosition[];
  currentPrice: number;
  contractValue: number;
  onClose: (positionId: string) => void;
}) {
  if (positions.length === 0) return null;

  const totalUnrealized = positions.reduce(
    (sum, p) => sum + unrealizedPnl(p, currentPrice, contractValue),
    0
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg">Open positions</h3>
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
            ● Open · {positions.length}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Unrealized
          </div>
          <div
            className={cn(
              "font-mono text-base tabular-nums",
              totalUnrealized > 0
                ? "text-emerald-300"
                : totalUnrealized < 0
                  ? "text-red-300"
                  : "text-slate-300"
            )}
          >
            {fmtSignedUsd(totalUnrealized)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Dir</th>
              <th className="px-3 py-2 text-right">Vol</th>
              <th className="px-3 py-2 text-right">Entry</th>
              <th className="px-3 py-2 text-right">SL / TP</th>
              <th className="px-3 py-2 text-right">Unrealized</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {positions.map((p) => {
              const pnl = unrealizedPnl(p, currentPrice, contractValue);
              return (
                <tr key={p.id} className="text-slate-200">
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        p.direction === "long"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                      )}
                    >
                      {p.direction === "long" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {p.direction === "long" ? "LONG" : "SHORT"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-400">
                    {p.volume.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {p.entry_price}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-slate-400">
                    {p.stop_loss ?? "—"} / {p.take_profit ?? "—"}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono tabular-nums",
                      pnl > 0
                        ? "text-emerald-300"
                        : pnl < 0
                          ? "text-red-300"
                          : "text-slate-400"
                    )}
                  >
                    {fmtSignedUsd(pnl)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onClose(p.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-red-500/20 hover:text-red-200"
                    >
                      <X className="h-3 w-3" /> Close
                    </button>
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
