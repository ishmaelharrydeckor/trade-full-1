// components/account/PositionCalculator.tsx
"use client";

import { useState, useMemo } from "react";
import { Calculator, AlertTriangle } from "lucide-react";
import {
  CONTRACT_PRESETS,
  calculatePositionSize,
} from "@/lib/calculator";
import { fmtUsd, fmtPct, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PositionCalculator({
  equity,
  riskParts,
  currency,
}: {
  equity: number;
  riskParts: number;
  currency: string;
}) {
  const [symbolKey, setSymbolKey] = useState("EURUSD");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [customContract, setCustomContract] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);

  const preset = CONTRACT_PRESETS.find((p) => p.symbol === symbolKey);
  const contractValue = useCustom
    ? parseFloat(customContract) || 0
    : preset?.contractValue ?? 100000;

  const result = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(stop);
    if (isNaN(e) || isNaN(s)) return null;
    return calculatePositionSize({
      equity,
      riskParts,
      entryPrice: e,
      stopLoss: s,
      contractValue,
    });
  }, [entry, stop, equity, riskParts, contractValue]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur lg:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-blue-400" />
        <h3 className="font-serif text-lg">Position calculator</h3>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Pick an instrument, set entry + stop, see exact lot size at{" "}
        <span className="text-slate-200">
          {(100 / riskParts).toFixed(1)}% risk
        </span>{" "}
        ({riskParts}-part strategy).
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Instrument">
          <select
            value={symbolKey}
            onChange={(e) => {
              setSymbolKey(e.target.value);
              setUseCustom(false);
            }}
            className={inputClass}
          >
            {CONTRACT_PRESETS.map((p) => (
              <option key={p.symbol} value={p.symbol}>
                {p.display}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Entry price">
          <input
            type="number"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="1.1000"
            className={inputClass}
          />
        </Field>
        <Field label="Stop loss">
          <input
            type="number"
            step="any"
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            placeholder="1.0950"
            className={inputClass}
          />
        </Field>
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-slate-400 hover:text-white">
          Need a custom contract value? (e.g. exotic broker symbol or Deriv
          synthetic)
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            step="any"
            placeholder={`Default for ${preset?.display ?? symbolKey}: ${preset?.contractValue ?? "—"}`}
            value={customContract}
            onChange={(e) => {
              setCustomContract(e.target.value);
              setUseCustom(!!e.target.value);
            }}
            className={inputClass}
          />
        </div>
      </details>

      {result && (
        <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Equity"
              value={fmtUsd(equity)}
              sub={currency}
            />
            <Stat
              label="Risk"
              value={fmtUsd(result.riskAmount)}
              sub={fmtPct(result.riskPercent, 1)}
            />
            <Stat
              label="Distance"
              value={fmtNumber(result.priceDistance, 4)}
              sub="entry → stop"
            />
            <Stat
              label="Lot size"
              value={`${result.lots.toFixed(2)}`}
              sub="lots"
              big
            />
          </div>
          {result.warning && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{result.warning}</span>
            </div>
          )}
        </div>
      )}

      {!result && (entry || stop) && (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
          Fill in both entry and stop loss to see your sizing
        </div>
      )}
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

function Stat({
  label,
  value,
  sub,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
}) {
  return (
    <div className={cn(big && "rounded-lg bg-blue-500/15 p-2")}>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-semibold tabular-nums",
          big ? "text-2xl text-blue-100" : "text-base text-white"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
