// components/trades/TradeForm.tsx
"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Trade, AssetClass, Direction } from "@/types/database";
import { useRouter } from "next/navigation";

const ASSET_CLASSES: { id: AssetClass; label: string }[] = [
  { id: "forex",       label: "Forex" },
  { id: "crypto",      label: "Crypto" },
  { id: "commodities", label: "Commodities" },
  { id: "indices",     label: "Indices" },
  { id: "synthetics",  label: "Synthetics (Deriv)" },
  { id: "stocks",      label: "Stocks" },
];

const MINDSETS = [
  "focused",
  "disciplined",
  "rushed",
  "fomo",
  "revenge",
  "anxious",
] as const;

export default function TradeForm({
  accountId,
  onClose,
  onSaved,
  initial,
}: {
  accountId: string;
  onClose: () => void;
  onSaved?: () => void;
  initial?: Trade | null;
}) {
  const router = useRouter();
  const editing = !!initial;

  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [assetClass, setAssetClass] = useState<AssetClass>(
    initial?.asset_class ?? "forex"
  );
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? "long");
  const [volume, setVolume] = useState<string>(
    initial?.volume?.toString() ?? ""
  );
  const [entryPrice, setEntryPrice] = useState<string>(
    initial?.entry_price?.toString() ?? ""
  );
  const [exitPrice, setExitPrice] = useState<string>(
    initial?.exit_price?.toString() ?? ""
  );
  const [openTime, setOpenTime] = useState<string>(
    initial?.open_time ? toLocalDateTime(initial.open_time) : nowLocal()
  );
  const [closeTime, setCloseTime] = useState<string>(
    initial?.close_time ? toLocalDateTime(initial.close_time) : nowLocal()
  );
  const [pnl, setPnl] = useState<string>(initial?.pnl?.toString() ?? "");
  const [commission, setCommission] = useState<string>(
    initial?.commission?.toString() ?? "0"
  );
  const [swap, setSwap] = useState<string>(initial?.swap?.toString() ?? "0");
  const [stopLoss, setStopLoss] = useState<string>(
    initial?.stop_loss?.toString() ?? ""
  );
  const [takeProfit, setTakeProfit] = useState<string>(
    initial?.take_profit?.toString() ?? ""
  );
  const [mindset, setMindset] = useState<string>(initial?.mindset ?? "");
  const [tagsRaw, setTagsRaw] = useState<string>(
    initial?.tags?.join(", ") ?? ""
  );
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!symbol.trim() || !volume || !entryPrice || !exitPrice) {
      setError("Symbol, volume, entry price, and exit price are required.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      user_id: user.id,
      account_id: accountId,
      symbol: symbol.trim().toUpperCase(),
      asset_class: assetClass,
      direction,
      volume: Number(volume),
      entry_price: Number(entryPrice),
      exit_price: Number(exitPrice),
      open_time: new Date(openTime).toISOString(),
      close_time: new Date(closeTime).toISOString(),
      pnl: pnl ? Number(pnl) : null,
      commission: commission ? Number(commission) : 0,
      swap: swap ? Number(swap) : 0,
      stop_loss: stopLoss ? Number(stopLoss) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
      mindset: mindset || null,
      tags,
      notes: notes.trim() || null,
    };

    const { error: writeErr } = editing
      ? await supabase.from("trades").update(payload).eq("id", initial!.id)
      : await supabase.from("trades").insert(payload);

    if (writeErr) {
      setError(writeErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSaved?.();
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[color:var(--bg-panel)] p-5 md:max-w-2xl md:rounded-2xl md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl tracking-tight">
            {editing ? "Edit trade" : "Add a trade"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Symbol *">
              <input
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="XAUUSD, BTCUSDT, V75…"
                className={inputClass}
              />
            </Field>
            <Field label="Asset class">
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                className={inputClass}
              >
                {ASSET_CLASSES.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900">
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Direction *">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as Direction)}
                className={inputClass}
              >
                <option value="long" className="bg-slate-900">Long (Buy)</option>
                <option value="short" className="bg-slate-900">Short (Sell)</option>
              </select>
            </Field>
            <Field label="Volume / Lots *">
              <input
                required
                type="number"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="0.10"
                className={inputClass}
              />
            </Field>
            <Field label="Net P&L">
              <input
                type="number"
                step="0.01"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                placeholder="Auto if blank"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry price *">
              <input
                required
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Exit price *">
              <input
                required
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Open time *">
              <input
                required
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Close time *">
              <input
                required
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <details className="rounded-lg border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-slate-400">
              Optional: stops, fees, mindset, tags
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stop loss">
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Take profit">
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Commission">
                  <input
                    type="number"
                    step="0.01"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Swap">
                  <input
                    type="number"
                    step="0.01"
                    value={swap}
                    onChange={(e) => setSwap(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Mindset">
                <select
                  value={mindset}
                  onChange={(e) => setMindset(e.target.value)}
                  className={inputClass}
                >
                  <option value="" className="bg-slate-900">— none —</option>
                  {MINDSETS.map((m) => (
                    <option key={m} value={m} className="bg-slate-900">
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tags (comma-separated)">
                <input
                  type="text"
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="breakout, London session, news"
                  className={inputClass}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What was the setup? Why did you take it? What did you learn?"
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </details>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Saving…" : editing ? "Save changes" : "Add trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-blue-500/50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function nowLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
function toLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
