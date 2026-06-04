"use client";

import { useState } from "react";
import { Loader2, X, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AssetClass, Direction } from "@/types/database";
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

  const [assetClass, setAssetClass] = useState<AssetClass>("forex");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("EURUSD");
  const [customSymbol, setCustomSymbol] = useState<string>("");
  const [symbol, setSymbol] = useState("EURUSD");

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
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Asset class</label>
              <select value={assetClass} onChange={(e) => handleAssetClassChange(e.target.value as AssetClass)} className={inputClass}>
                {ASSET_CLASSES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Symbol *</label>
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)} className={inputClass}>
                <option value="long">Long (Buy)</option>
                <option value="short">Short (Sell)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Entry price *</label>
              <input required type="number" step="any" min="0.000001" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Stop loss</label>
              <input type="number" step="any" min="0.000001" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Take profit</label>
              <input type="number" step="any" min="0.000001" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={inputClass} />
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
