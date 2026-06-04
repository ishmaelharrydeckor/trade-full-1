// components/trades/TradeForm.tsx
"use client";

import { useState } from "react";
import { Loader2, X, Image, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Trade, AssetClass, Direction, TradeGrade } from "@/types/database";
import { useRouter } from "next/navigation";

const SYMBOLS_BY_CLASS: Record<AssetClass, { value: string; label: string }[]> = {
  forex: [
    { value: "EURUSD", label: "EURUSD (Euro / US Dollar)" },
    { value: "GBPUSD", label: "GBPUSD (Pound / US Dollar)" },
    { value: "USDJPY", label: "USDJPY (US Dollar / Yen)" },
    { value: "GBPJPY", label: "GBPJPY (Pound / Yen)" },
    { value: "AUDUSD", label: "AUDUSD (Aussie / US Dollar)" },
    { value: "USDCAD", label: "USDCAD (US Dollar / Loonie)" },
    { value: "USDCHF", label: "USDCHF (US Dollar / Swiss Franc)" },
    { value: "NZDUSD", label: "NZDUSD (Kiwi / US Dollar)" },
    { value: "EURGBP", label: "EURGBP (Euro / Pound)" },
    { value: "EURJPY", label: "EURJPY (Euro / Yen)" },
    { value: "EURCHF", label: "EURCHF (Euro / Swiss Franc)" },
    { value: "EURAUD", label: "EURAUD (Euro / Aussie)" },
    { value: "EURCAD", label: "EURCAD (Euro / Loonie)" },
    { value: "EURNZD", label: "EURNZD (Euro / Kiwi)" },
    { value: "GBPCHF", label: "GBPCHF (Pound / Swiss Franc)" },
    { value: "GBPAUD", label: "GBPAUD (Pound / Aussie)" },
    { value: "GBPCAD", label: "GBPCAD (Pound / Loonie)" },
    { value: "GBPNZD", label: "GBPNZD (Pound / Kiwi)" },
    { value: "AUDJPY", label: "AUDJPY (Aussie / Yen)" },
    { value: "AUDCAD", label: "AUDCAD (Aussie / Loonie)" },
    { value: "AUDCHF", label: "AUDCHF (Aussie / Swiss Franc)" },
    { value: "AUDNZD", label: "AUDNZD (Aussie / Kiwi)" },
    { value: "CADJPY", label: "CADJPY (Loonie / Yen)" },
    { value: "CADCHF", label: "CADCHF (Loonie / Swiss Franc)" },
    { value: "CHFJPY", label: "CHFJPY (Swiss Franc / Yen)" },
    { value: "NZDJPY", label: "NZDJPY (Kiwi / Yen)" },
    { value: "NZDCAD", label: "NZDCAD (Kiwi / Loonie)" },
    { value: "NZDCHF", label: "NZDCHF (Kiwi / Swiss Franc)" },
    { value: "CUSTOM", label: "Custom / Other..." },
  ],
  crypto: [
    { value: "BTCUSD", label: "BTCUSD (Bitcoin)" },
    { value: "ETHUSD", label: "ETHUSD (Ethereum)" },
    { value: "SOLUSD", label: "SOLUSD (Solana)" },
    { value: "XRPUSD", label: "XRPUSD (Ripple)" },
    { value: "ADAUSD", label: "ADAUSD (Cardano)" },
    { value: "DOTUSD", label: "DOTUSD (Polkadot)" },
    { value: "DOGEUSD", label: "DOGEUSD (Dogecoin)" },
    { value: "LTCUSD", label: "LTCUSD (Litecoin)" },
    { value: "LINKUSD", label: "LINKUSD (Chainlink)" },
    { value: "BNBUSD", label: "BNBUSD (Binance Coin)" },
    { value: "MATICUSD", label: "MATICUSD (Polygon)" },
    { value: "AVAXUSD", label: "AVAXUSD (Avalanche)" },
    { value: "CUSTOM", label: "Custom / Other..." },
  ],
  commodities: [
    { value: "XAUUSD", label: "XAUUSD (Gold)" },
    { value: "XAGUSD", label: "XAGUSD (Silver)" },
    { value: "USOUSD", label: "USOUSD (Crude Oil)" },
    { value: "UKOIL", label: "UKOIL (Brent Crude)" },
    { value: "NGAS", label: "NGAS (Natural Gas)" },
    { value: "COPPER", label: "COPPER (Copper)" },
    { value: "CUSTOM", label: "Custom / Other..." },
  ],
  indices: [
    { value: "US30", label: "US30 (Dow Jones)" },
    { value: "NAS100", label: "NAS100 (Nasdaq)" },
    { value: "SPX500", label: "SPX500 (S&P 500)" },
    { value: "GER40", label: "GER40 (DAX 40)" },
    { value: "UK100", label: "UK100 (FTSE 100)" },
    { value: "JPN225", label: "JPN225 (Nikkei 225)" },
    { value: "HK50", label: "HK50 (Hang Seng)" },
    { value: "EU50", label: "EU50 (Euro Stoxx 50)" },
    { value: "CUSTOM", label: "Custom / Other..." },
  ],
  synthetics: [
    { value: "V10", label: "Volatility 10 Index" },
    { value: "V25", label: "Volatility 25 Index" },
    { value: "V50", label: "Volatility 50 Index" },
    { value: "V75", label: "Volatility 75 Index" },
    { value: "V100", label: "Volatility 100 Index" },
    { value: "V101S", label: "Volatility 10 (1s) Index" },
    { value: "V251S", label: "Volatility 25 (1s) Index" },
    { value: "V501S", label: "Volatility 50 (1s) Index" },
    { value: "V751S", label: "Volatility 75 (1s) Index" },
    { value: "V1001S", label: "Volatility 100 (1s) Index" },
    { value: "BOOM300", label: "Boom 300 Index" },
    { value: "BOOM500", label: "Boom 500 Index" },
    { value: "BOOM1000", label: "Boom 1000 Index" },
    { value: "CRASH300", label: "Crash 300 Index" },
    { value: "CRASH500", label: "Crash 500 Index" },
    { value: "CRASH1000", label: "Crash 1000 Index" },
    { value: "JUMP10", label: "Jump 10 Index" },
    { value: "JUMP25", label: "Jump 25 Index" },
    { value: "JUMP50", label: "Jump 50 Index" },
    { value: "JUMP75", label: "Jump 75 Index" },
    { value: "JUMP100", label: "Jump 100 Index" },
    { value: "STEP", label: "Step Index" },
    { value: "CUSTOM", label: "Custom / Other..." },
  ],
  stocks: [
    { value: "AAPL", label: "AAPL (Apple)" },
    { value: "MSFT", label: "MSFT (Microsoft)" },
    { value: "GOOGL", label: "GOOGL (Alphabet)" },
    { value: "AMZN", label: "AMZN (Amazon)" },
    { value: "TSLA", label: "TSLA (Tesla)" },
    { value: "NVDA", label: "NVDA (NVIDIA)" },
    { value: "META", label: "META (Meta Platforms)" },
    { value: "NFLX", label: "NFLX (Netflix)" },
    { value: "AMD", label: "AMD (Advanced Micro Devices)" },
    { value: "CUSTOM", label: "Custom / Other..." },
  ]
};

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

  const [assetClass, setAssetClass] = useState<AssetClass>(
    initial?.asset_class ?? "forex"
  );

  const getPopularValuesForClass = (ac: AssetClass) => {
    return (SYMBOLS_BY_CLASS[ac] || []).map(s => s.value).filter(v => v !== "CUSTOM");
  };

  const isInitialCustom = initial?.symbol
    ? !getPopularValuesForClass(initial.asset_class ?? "forex").includes(initial.symbol.toUpperCase().trim())
    : false;

  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initial?.symbol
      ? (isInitialCustom ? "CUSTOM" : initial.symbol.toUpperCase().trim())
      : (SYMBOLS_BY_CLASS[initial?.asset_class ?? "forex"]?.[0]?.value ?? "CUSTOM")
  );
  const [customSymbol, setCustomSymbol] = useState<string>(
    initial?.symbol && isInitialCustom ? initial.symbol : ""
  );
  const [symbol, setSymbol] = useState(
    initial?.symbol ?? (SYMBOLS_BY_CLASS[initial?.asset_class ?? "forex"]?.[0]?.value ?? "")
  );

  const detectAssetClass = (sym: string): AssetClass | null => {
    const s = sym.toUpperCase().trim();
    if (!s) return null;
    if (s.startsWith("V") || s.includes("INDEX") || s.includes("BOOM") || s.includes("CRASH") || s.includes("JUMP")) return "synthetics";
    if (s.includes("BTC") || s.includes("ETH") || s.includes("SOL") || s.includes("USDT") || s.includes("XRP") || s.includes("DOGE") || s.includes("LTC")) return "crypto";
    if (s.includes("XAU") || s.includes("GOLD") || s.includes("USO") || s.includes("OIL") || s.includes("SLVR") || s.includes("XAG")) return "commodities";
    if (s.includes("US30") || s.includes("NAS") || s.includes("SPX") || s.includes("GER") || s.includes("DE30") || s.includes("UK100") || s.includes("HK50")) return "indices";
    if (s.length === 6 || s.includes("/") || s.includes("EUR") || s.includes("GBP") || s.includes("USD") || s.includes("JPY") || s.includes("AUD") || s.includes("CAD") || s.includes("CHF") || s.includes("NZD")) return "forex";
    return null;
  };

  const handleAssetClassChange = (newClass: AssetClass) => {
    setAssetClass(newClass);
    // Find the first option for this asset class
    const defaultSym = SYMBOLS_BY_CLASS[newClass]?.[0]?.value ?? "CUSTOM";
    setSelectedSymbol(defaultSym);
    if (defaultSym !== "CUSTOM") {
      setSymbol(defaultSym);
    } else {
      setSymbol(customSymbol);
    }
  };

  const handleDropdownChange = (val: string) => {
    setSelectedSymbol(val);
    if (val !== "CUSTOM") {
      setSymbol(val);
    } else {
      setSymbol(customSymbol);
    }
  };

  const handleCustomSymbolChange = (val: string) => {
    setCustomSymbol(val);
    setSymbol(val);
    const detected = detectAssetClass(val);
    if (detected && detected !== assetClass) {
      setAssetClass(detected);
    }
  };

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
            <Field label="Asset class">
              <select
                value={assetClass}
                onChange={(e) => handleAssetClassChange(e.target.value as AssetClass)}
                className={inputClass}
              >
                {ASSET_CLASSES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Symbol *">
              <div className="flex flex-col gap-2">
                <select
                  value={selectedSymbol}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className={inputClass}
                >
                  {(SYMBOLS_BY_CLASS[assetClass] || []).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {selectedSymbol === "CUSTOM" && (
                  <input
                    required
                    type="text"
                    value={customSymbol}
                    onChange={(e) => handleCustomSymbolChange(e.target.value)}
                    placeholder="Enter custom symbol (e.g. GBPCHF, SOLUSD)"
                    className={inputClass}
                  />
                )}
              </div>
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
                step="0.00001"
                min="0.00001"
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
                min="0.000001"
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
                min="0.000001"
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
                    min="0.000001"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Take profit">
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
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
                    min="0"
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
