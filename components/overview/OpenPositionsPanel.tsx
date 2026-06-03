// components/overview/OpenPositionsPanel.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Wifi } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtSignedUsd, fmtNumber, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OpenPosition } from "@/types/database";

const POLL_INTERVAL_MS = 8_000;

export default function OpenPositionsPanel({ accountId }: { accountId: string }) {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const fetchPositions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("open_positions")
      .select("*")
      .eq("account_id", accountId)
      .order("open_time", { ascending: false });

    setPositions((data ?? []) as OpenPosition[]);
    setLoaded(true);

    // Track the most-recent synced_at across all rows
    if (data && data.length > 0) {
      const latest = data
        .map((p) => new Date(p.synced_at).getTime())
        .reduce((a, b) => Math.max(a, b), 0);
      setLastSyncedAt(new Date(latest));
    } else {
      setLastSyncedAt(null);
    }
  }, [accountId]);

  useEffect(() => {
    let alive = true;
    fetchPositions();
    const t = setInterval(() => {
      if (alive) fetchPositions();
    }, POLL_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [fetchPositions]);

  // Hide entirely until we have a confirmed empty/non-empty state.
  // No need to clutter the overview with an empty position panel for users
  // who haven't connected the EA yet.
  if (!loaded) return null;
  if (positions.length === 0) return null;

  const totalUnrealized = positions.reduce(
    (s, p) => s + (p.unrealized_pnl ?? 0),
    0
  );

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h3 className="text-lg font-bold">Open positions</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>
            Unrealized:{" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                totalUnrealized > 0
                  ? "text-emerald-300"
                  : totalUnrealized < 0
                    ? "text-red-300"
                    : "text-slate-300"
              )}
            >
              {fmtSignedUsd(totalUnrealized)}
            </span>
          </span>
          {lastSyncedAt && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <Wifi className="h-2.5 w-2.5" />
              synced {secondsAgo(lastSyncedAt)}s ago
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--app-border)' }}>
          <table className="tj-table w-full min-w-[700px] text-sm">
            <thead className="text-[10px] uppercase tracking-wider font-semibold" style={{ backgroundColor: 'var(--app-elevated)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Dir</th>
                <th className="px-3 py-2 text-right">Vol</th>
                <th className="px-3 py-2 text-right">Entry</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">SL / TP</th>
                <th className="px-3 py-2 text-right">Unrealized</th>
                <th className="px-3 py-2 text-left">Opened</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const isLong = p.direction === "long";
                const unrealized = p.unrealized_pnl ?? 0;
                return (
                  <tr key={p.id} className="transition-colors duration-150" style={{ color: 'var(--text-primary)' }}>
                    <td className="px-3 py-2 font-medium">{p.symbol}</td>
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
                        {p.direction}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Number(p.volume).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {fmtNumber(p.entry_price, 4)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {p.current_price != null
                        ? fmtNumber(p.current_price, 4)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums font-medium" style={{ color: 'var(--text-muted)' }}>
                      {p.stop_loss != null && p.stop_loss > 0
                        ? fmtNumber(p.stop_loss, 4)
                        : "—"}
                      {" / "}
                      {p.take_profit != null && p.take_profit > 0
                        ? fmtNumber(p.take_profit, 4)
                        : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-semibold tabular-nums",
                        unrealized > 0
                          ? "text-emerald-300"
                          : unrealized < 0
                            ? "text-red-300"
                            : "text-slate-400"
                      )}
                    >
                      {fmtSignedUsd(unrealized)}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {fmtDateTime(p.open_time)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[color:var(--bg-panel)] to-transparent md:hidden" />
      </div>
    </div>
  );
}

function secondsAgo(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}
