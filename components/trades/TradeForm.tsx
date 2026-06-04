// components/trades/TradeForm.tsx
"use client";

import { useState } from "react";
import { Loader2, X, Image, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Trade, AssetClass, Direction, TradeGrade } from "@/types/database";
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
  const [screenshotUrl, setScreenshotUrl] = useState<string>(
    initial?.screenshot_url ?? ""
  );
  const [grade, setGrade] = useState<string>(initial?.grade ?? "");

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
      screenshot_url: screenshotUrl.trim() || null,
      grade: grade || null,
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
      <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-2xl p-5 md:max-w-2xl md:rounded-xl md:p-7" style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {editing ? "Edit trade" : "Add a trade"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition duration-150 hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
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
                  <option key={a.id} value={a.id}>
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
                <option value="long">Long (Buy)</option>
                <option value="short">Short (Sell)</option>
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

          <details className="rounded-lg p-3" style={{ backgroundColor: 'var(--app-elevated)', border: '1px solid var(--app-border)' }}>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
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
                  <option value="">— none —</option>
                  {MINDSETS.map((m) => (
                    <option key={m} value={m}>
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
              <Field label="Screenshot URL">
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://i.imgur.com/... or TradingView link"
                  className={inputClass}
                />
                {screenshotUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotUrl}
                      alt="Trade screenshot"
                      className="max-h-40 w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </Field>
              <Field label="Trade grade">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— none —</option>
                  {(["A+", "A", "B", "C", "D", "F"] as const).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </details>

          {error && (
            <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--negative)' }}>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="tj-btn-secondary rounded-lg px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tj-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
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
  "tj-input w-full rounded-lg px-3 py-2 text-sm font-medium";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="kpi-label mb-1 block">
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
