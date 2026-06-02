// components/backtest/NewSessionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  BACKTEST_INSTRUMENTS,
  TIMEFRAMES,
  getInstrument,
} from "@/lib/backtest-instruments";
import { cn } from "@/lib/utils";

export default function NewSessionForm({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("H1");
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [rangeEnd, setRangeEnd] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [startingBalance, setStartingBalance] = useState("10000");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instrument = getInstrument(symbol);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backtest/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          name: name.trim() || `${symbol} ${timeframe}`,
          symbol,
          timeframe,
          rangeStart: new Date(rangeStart + "T00:00:00Z").toISOString(),
          rangeEnd: new Date(rangeEnd + "T23:59:59Z").toISOString(),
          startingBalance: parseFloat(startingBalance) || 10000,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      router.push(
        `/dashboard/accounts/${accountId}/backtest/${data.session.id}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[color:var(--bg-panel)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 font-serif text-2xl">Start new backtest</h2>
        <p className="mb-6 text-sm text-slate-400">
          Pick an instrument and a historical window. Playback controls and
          trade simulation will be added in the next drop.
        </p>

        <div className="space-y-4">
          <Field label="Instrument">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className={inputClass}
            >
              <optgroup label="Crypto (Binance — free)">
                {BACKTEST_INSTRUMENTS.filter(
                  (i) => i.assetClass === "crypto"
                ).map((i) => (
                  <option key={i.symbol} value={i.symbol} className="bg-slate-900">
                    {i.display}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Forex (TwelveData — free key required)">
                {BACKTEST_INSTRUMENTS.filter(
                  (i) => i.assetClass === "forex"
                ).map((i) => (
                  <option key={i.symbol} value={i.symbol} className="bg-slate-900">
                    {i.display}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Metals (TwelveData)">
                {BACKTEST_INSTRUMENTS.filter(
                  (i) => i.assetClass === "metals"
                ).map((i) => (
                  <option key={i.symbol} value={i.symbol} className="bg-slate-900">
                    {i.display}
                  </option>
                ))}
              </optgroup>
            </select>
            {instrument?.dataSource === "twelvedata" && (
              <p className="mt-1.5 text-xs text-amber-300">
                ⚠ Needs <code className="font-mono">TWELVEDATA_API_KEY</code> in your
                Vercel environment. Get a free key at{" "}
                <a
                  href="https://twelvedata.com/account/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-amber-200"
                >
                  twelvedata.com/account/api-keys
                </a>
              </p>
            )}
          </Field>

          <Field label="Timeframe">
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs transition",
                    timeframe === tf.id
                      ? "bg-white font-semibold text-slate-900"
                      : "border border-white/10 text-slate-300 hover:bg-white/5"
                  )}
                >
                  {tf.id}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Smaller timeframes pack more bars into the same date range; cap is
              1000 bars per session for now.
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting balance ($)">
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Session name (optional)">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${symbol} ${timeframe}`}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Start backtest
          </button>
        </div>
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
