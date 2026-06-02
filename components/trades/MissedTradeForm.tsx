"use client";

import { useState } from "react";
import { Loader2, X, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AssetClass, Direction } from "@/types/database";
import { useRouter } from "next/navigation";

const ASSET_CLASSES: { id: AssetClass; label: string }[] = [
  { id: "forex", label: "Forex" },
  { id: "crypto", label: "Crypto" },
  { id: "commodities", label: "Commodities" },
  { id: "indices", label: "Indices" },
  { id: "synthetics", label: "Synthetics (Deriv)" },
  { id: "stocks", label: "Stocks" },
];

export default function MissedTradeForm({
  accountId,
  onClose,
  onSaved,
}: {
  accountId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();

  const [symbol, setSymbol] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass>("forex");
  const [direction, setDirection] = useState<Direction>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [notes, setNotes] = useState("");
  const [openTime, setOpenTime] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hypothetical P&L calculator
  const hypotheticalPnl = (() => {
    const entry = Number(entryPrice);
    const tp = Number(takeProfit);
    if (!entry || !tp) return null;
    const diff = direction === "long" ? tp - entry : entry - tp;
    return diff;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!symbol.trim() || !entryPrice) {
      setError("Symbol and entry price are required.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired."); setSubmitting(false); return; }

    const payload = {
      user_id: user.id,
      account_id: accountId,
      symbol: symbol.trim().toUpperCase(),
      asset_class: assetClass,
      direction,
      volume: 0, // Missed trades don't have volume
      entry_price: Number(entryPrice),
      exit_price: null,
      open_time: new Date(openTime).toISOString(),
      close_time: null,
      pnl: null,
      commission: 0,
      swap: 0,
      stop_loss: stopLoss ? Number(stopLoss) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
      notes: notes.trim() || null,
      is_missed: true,
      is_backtest: false,
    };

    const { error: writeErr } = await supabase.from("trades").insert(payload);
    if (writeErr) { setError(writeErr.message); setSubmitting(false); return; }

    setSubmitting(false);
    onSaved?.();
    router.refresh();
    onClose();
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[color:var(--bg-panel)] p-5 md:max-w-lg md:rounded-2xl md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-amber-400" />
            <h2 className="font-serif text-2xl tracking-tight">Log missed trade</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Record a setup you saw but didn&apos;t take. Track what you&apos;re leaving on the table.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Symbol *</label>
              <input required value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="XAUUSD" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Asset class</label>
              <select value={assetClass} onChange={(e) => setAssetClass(e.target.value as AssetClass)} className={inputClass}>
                {ASSET_CLASSES.map((a) => <option key={a.id} value={a.id} className="bg-slate-900">{a.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)} className={inputClass}>
                <option value="long" className="bg-slate-900">Long (Buy)</option>
                <option value="short" className="bg-slate-900">Short (Sell)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Entry price *</label>
              <input required type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Stop loss</label>
              <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Take profit</label>
              <input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">When did you see it?</label>
            <input type="datetime-local" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass} />
          </div>

          {hypotheticalPnl !== null && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
              If TP was hit: {hypotheticalPnl > 0 ? "+" : ""}{hypotheticalPnl.toFixed(2)} pips/points per unit
            </div>
          )}

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Why didn't you take it?" className={inputClass} />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Log missed trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
