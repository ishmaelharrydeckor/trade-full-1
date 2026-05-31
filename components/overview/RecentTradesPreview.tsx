// components/overview/RecentTradesPreview.tsx
import type { Trade } from "@/types/database";
import { fmtSignedUsd, fmtDateTime } from "@/lib/format";
import { tradeNetPnl } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function RecentTradesPreview({
  trades,
  onOpenAll,
}: {
  trades: Trade[];
  onOpenAll: () => void;
}) {
  const recent = trades.slice(0, 8);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg">Recent trades</h3>
        {trades.length > 8 && (
          <button
            type="button"
            onClick={onOpenAll}
            className="text-xs text-blue-400 hover:underline"
          >
            View all {trades.length}
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
          No trades yet. Add one from the Trades tab.
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Dir</th>
                  <th className="px-3 py-2 text-right">Lots</th>
                  <th className="px-3 py-2 text-right">P&L</th>
                  <th className="px-3 py-2 text-left">Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((t) => {
                  const net = tradeNetPnl(t);
                  const isLong = t.direction === "long";
                  const isWin = net > 0;
                  return (
                    <tr key={t.id} className="text-slate-200">
                      <td className="px-3 py-2 font-medium">{t.symbol}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            isLong
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          )}
                        >
                          {isLong ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {Number(t.volume).toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right tabular-nums",
                          isWin
                            ? "text-emerald-300"
                            : net < 0
                              ? "text-red-300"
                              : "text-slate-400"
                        )}
                      >
                        {fmtSignedUsd(net)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {fmtDateTime(t.close_time)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[color:var(--bg-panel)] to-transparent md:hidden" />
        </div>
      )}
    </div>
  );
}
