// components/account/tabs/TradesTab.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, FileText, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Account, Trade } from "@/types/database";
import TradeForm from "@/components/trades/TradeForm";
import CsvImport from "@/components/trades/CsvImport";
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
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Listen for calendar click → open trade form
  useEffect(() => {
    const handler = () => {
      setEditingTrade(null);
      setFormOpen(true);
    };
    window.addEventListener("tradefull:opentrade", handler);
    return () => window.removeEventListener("tradefull:opentrade", handler);
  }, []);

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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="search"
            placeholder="Filter by symbol, tag, or note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tj-input w-full py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="tj-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingTrade(null);
              setFormOpen(true);
            }}
            className="tj-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" /> Add trade
          </button>
        </div>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}>
          <FileText className="mx-auto mb-3 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold hover:underline" style={{ color: 'var(--accent)' }}
            >
              <Plus className="h-3.5 w-3.5" /> Add your first trade
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--app-border)' }}>
            <table className="tj-table w-full min-w-[950px] text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Dir</th>
                  <th className="px-3 py-2 text-right">Vol</th>
                  <th className="px-3 py-2 text-right">Entry</th>
                  <th className="px-3 py-2 text-right">Exit</th>
                  <th className="px-3 py-2 text-right">R:R</th>
                  <th className="px-3 py-2 text-right">Net P&L</th>
                  <th className="px-3 py-2 text-left">Mindset</th>
                  <th className="px-3 py-2 text-left">Closed</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const net = tradeNetPnl(t);
                  const isWin = net > 0;
                  
                  // Helper to calculate risk to reward ratio
                  const entry = t.entry_price ? Number(t.entry_price) : 0;
                  const sl = t.stop_loss ? Number(t.stop_loss) : 0;
                  const tp = t.take_profit ? Number(t.take_profit) : 0;
                  let rrStr = "—";
                  if (entry && sl && tp) {
                    const risk = Math.abs(entry - sl);
                    const reward = Math.abs(tp - entry);
                    if (risk > 0) {
                      rrStr = `1:${(reward / risk).toFixed(1)}`;
                    }
                  }

                  return (
                    <tr key={t.id} style={{ color: 'var(--text-primary)' }}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{t.symbol}</div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {t.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md px-1 py-0 text-[9px] font-medium" style={{ background: 'var(--app-elevated)', color: 'var(--text-secondary)' }}
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
                            "badge uppercase",
                            t.direction === "long"
                              ? "badge-buy"
                              : "badge-sell"
                          )}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {Number(t.volume).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {fmtNumber(t.entry_price, 4)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {fmtNumber(t.exit_price, 4)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {rrStr}
                      </td>
                      <td
                        className="px-3 py-2 text-right font-bold tabular-nums"
                        style={{
                          color: isWin
                            ? 'var(--positive)'
                            : net < 0
                              ? 'var(--negative)'
                              : 'var(--text-muted)'
                        }}
                      >
                        {fmtSignedUsd(net)}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium capitalize" style={{ color: 'var(--text-muted)' }}>
                        {t.mindset ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
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
                            className="rounded-md p-1 transition duration-150"
                            style={{ color: 'var(--text-muted)' }}
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="rounded-md p-1 transition duration-150 hover:bg-red-500/10"
                            style={{ color: 'var(--text-muted)' }}
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

      {/* CSV import modal */}
      {importOpen && (
        <CsvImport
          accountId={account.id}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
