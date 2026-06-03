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
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Recent trades</h3>
        {trades.length > 8 && (
          <button
            type="button"
            onClick={onOpenAll}
            className="text-xs font-bold hover:underline" style={{ color: 'var(--accent)' }}
          >
            View all {trades.length}
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-sm" style={{ borderColor: 'var(--app-border)', color: 'var(--text-muted)' }}>
          No trades yet. Add one from the Trades tab.
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--app-border)' }}>
            <table className="tj-table w-full min-w-[600px] text-sm">
              <thead className="text-[10px] uppercase tracking-wider font-semibold" style={{ backgroundColor: 'var(--app-elevated)', color: 'var(--text-muted)' }}>
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Dir</th>
                  <th className="px-3 py-2 text-right">Lots</th>
                  <th className="px-3 py-2 text-right">P&L</th>
                  <th className="px-3 py-2 text-left">Closed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => {
                  const net = tradeNetPnl(t);
                  const isLong = t.direction === "long";
                  const isWin = net > 0;
                  return (
                    <tr key={t.id} className="transition-colors duration-150" style={{ color: 'var(--text-primary)' }}>
                      <td className="px-3 py-2 font-medium">{t.symbol}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "badge inline-flex items-center gap-1",
                            isLong
                              ? "badge-buy"
                              : "badge-sell"
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
                        className="px-3 py-2 text-right tabular-nums"
                        style={{
                          color: isWin
                            ? 'var(--positive)'
                            : net < 0
                              ? 'var(--negative)'
                              : 'var(--text-secondary)'
                        }}
                      >
                        {fmtSignedUsd(net)}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
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
