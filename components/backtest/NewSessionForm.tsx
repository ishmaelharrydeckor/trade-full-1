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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border p-6"
        style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-elevated)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 font-serif text-2xl">Start new backtest</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pick an instrument and a historical window. Playback controls and
          trade simulation will be added in the next drop.
        </p>

        <div className="space-y-4">
          <Field label="Instrument">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="tj-input"
            >
              <optgroup label="Crypto (Binance — free)">
                {BACKTEST_INSTRUMENTS.filter(
                  (i) => i.assetClass === "crypto"
                ).map((i) => (
                  <option key={i.symbol} value={i.symbol} style={{ backgroundColor: 'var(--app-bg)' }}>
                    {i.display}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Forex (TwelveData — free key required)">
                {BACKTEST_INSTRUMENTS.filter(
                  (i) => i.assetClass === "forex"
                ).map((i) => (
                  <option key={i.symbol} value={i.symbol} style={{ backgroundColor: 'var(--app-bg)' }}>
                    {i.display}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Metals (TwelveData)">
                {BACKTEST_INSTRUMENTS.filter(
                  (i) => i.assetClass === "metals"
                ).map((i) => (
                  <option key={i.symbol} value={i.symbol} style={{ backgroundColor: 'var(--app-bg)' }}>
                    {i.display}
                  </option>
                ))}
              </optgroup>
            </select>
            {instrument?.dataSource === "twelvedata" && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--warning)' }}>
                ⚠ Needs <code className="font-mono">TWELVEDATA_API_KEY</code> in your
                Vercel environment. Get a free key at{" "}
                <a
                  href="https://twelvedata.com/account/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: 'var(--warning)' }}
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
                      ? "font-semibold"
                      : "border"
                  )}
                  style={
                    timeframe === tf.id
                      ? { backgroundColor: 'var(--text-primary)', color: 'var(--app-bg)' }
                      : { borderColor: 'var(--app-border)', color: 'var(--text-secondary)' }
                  }
                >
                  {tf.id}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
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
                className="tj-input"
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="tj-input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting balance ($)">
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="tj-input"
              />
            </Field>
            <Field label="Session name (optional)">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${symbol} ${timeframe}`}
                className="tj-input"
              />
            </Field>
          </div>
        </div>

        {error && (
          <div
            className="mt-4 rounded-lg border p-3 text-sm"
            style={{
              borderColor: 'color-mix(in srgb, var(--negative) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--negative) 10%, transparent)',
              color: 'var(--negative)',
            }}
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="tj-btn-secondary rounded-lg px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="tj-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Start backtest
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
