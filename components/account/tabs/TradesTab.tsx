// components/account/tabs/TradesTab.tsx
"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Account, Trade } from "@/types/database";
import TradeForm from "@/components/trades/TradeForm";
import { fmtSignedUsd, fmtDateTime, fmtNumber } from "@/lib/format";
import { tradeNetPnl } from "@/lib/stats";
import { cn } from "@/lib/utils";

export default function TradesTab({
  account,
  trades,
}: {
  account: Account;
  trades: Trade[];
}) {
  const router = useRouter();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return trades;
    const q = search.toLowerCase();
    return trades.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [trades, search]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this trade? This can't be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            placeholder="Filter by symbol, tag, or note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500/50"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTrade(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          <Plus className="h-4 w-4" /> Add trade
        </button>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <p className="text-sm text-slate-400">
            {trades.length === 0
              ? "No trades yet."
              : "No trades match your filter."}
          </p>
          {trades.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingTrade(null);
                setFormOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add your first trade
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Dir</th>
                  <th className="px-3 py-2 text-right">Vol</th>
                  <th className="px-3 py-2 text-right">Entry</th>
                  <th className="px-3 py-2 text-right">Exit</th>
                  <th className="px-3 py-2 text-right">Net P&L</th>
                  <th className="px-3 py-2 text-left">Mindset</th>
                  <th className="px-3 py-2 text-left">Closed</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t) => {
                  const net = tradeNetPnl(t);
                  const isWin = net > 0;
                  return (
                    <tr key={t.id} className="text-slate-200">
                      <td className="px-3 py-2">
                        <div className="font-medium">{t.symbol}</div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {t.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-white/5 px-1 py-0 text-[9px] text-slate-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            t.direction === "long"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          )}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {Number(t.volume).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {fmtNumber(t.entry_price, 4)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {fmtNumber(t.exit_price, 4)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-semibold tabular-nums",
                          isWin
                            ? "text-emerald-300"
                            : net < 0
                              ? "text-red-300"
                              : "text-slate-400"
                        )}
                      >
                        {fmtSignedUsd(net)}
                      </td>
                      <td className="px-3 py-2 text-xs capitalize text-slate-400">
                        {t.mindset ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {fmtDateTime(t.close_time)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTrade(t);
                              setFormOpen(true);
                            }}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

      {/* Trade form modal */}
      {formOpen && (
        <TradeForm
          accountId={account.id}
          initial={editingTrade}
          onClose={() => {
            setFormOpen(false);
            setEditingTrade(null);
          }}
        />
      )}
    </div>
  );
}
