// components/account/PositionCalculator.tsx
"use client";

import { useState, useMemo } from "react";
import { Calculator, AlertTriangle, ShieldCheck, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { CONTRACT_PRESETS, calculatePositionSize } from "@/lib/calculator";
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
  const [takeProfit, setTakeProfit] = useState("");
  const [targetRR, setTargetRR] = useState("2"); // default 1:2 R:R
  const [useCustomRR, setUseCustomRR] = useState(false);
  
  // Risk Slider State (defaulting to the account's configured risk parts or 1.0%)
  const defaultRiskPercent = useMemo(() => {
    return riskParts > 0 ? parseFloat((100 / riskParts).toFixed(1)) : 1.0;
  }, [riskParts]);
  const [riskPercent, setRiskPercent] = useState<number>(defaultRiskPercent);

  const [customContract, setCustomContract] = useState<string>("");
  const [useCustomContract, setUseCustomContract] = useState(false);

  const preset = CONTRACT_PRESETS.find((p) => p.symbol === symbolKey);
  const contractValue = useCustomContract
    ? parseFloat(customContract) || 0
    : preset?.contractValue ?? 100000;

  // Sizing computation linked to riskPercent slider
  const result = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(stop);
    if (isNaN(e) || isNaN(s) || equity <= 0) return null;

    const riskAmount = (equity * riskPercent) / 100;
    const priceDistance = Math.abs(e - s);

    if (priceDistance === 0 || contractValue === 0) {
      return {
        riskAmount,
        riskPercent,
        priceDistance,
        lotsRaw: 0,
        lots: 0,
        warning: "Stop loss must differ from entry",
      };
    }

    const lotsRaw = riskAmount / (priceDistance * contractValue);
    const lots = Math.floor(lotsRaw * 100) / 100; // Floor to avoid rounding up risk

    let warning: string | undefined;
    if (lots < 0.01) {
      warning = `Position size (${lotsRaw.toFixed(4)} lots) falls below 0.01 minimum. Consider wider stops or higher risk.`;
    }

    return { riskAmount, riskPercent, priceDistance, lotsRaw, lots, warning };
  }, [entry, stop, equity, riskPercent, contractValue]);

  // R:R Reward projection computations
  const projections = useMemo(() => {
    if (!result) return null;
    const e = parseFloat(entry);
    const s = parseFloat(stop);
    if (isNaN(e) || isNaN(s)) return null;

    const riskDist = Math.abs(e - s);
    let tpPrice = parseFloat(takeProfit);
    let rrRatio = parseFloat(targetRR);

    if (!useCustomRR) {
      // Projected TP based on target R:R ratio
      const isLong = e > s;
      tpPrice = isLong ? e + riskDist * rrRatio : e - riskDist * rrRatio;
    } else {
      // Calculate R:R ratio based on custom TP input
      const rewardDist = Math.abs(tpPrice - e);
      rrRatio = riskDist > 0 ? rewardDist / riskDist : 0;
    }

    const projectedProfit = result.riskAmount * rrRatio;
    const projectedProfitPercent = riskPercent * rrRatio;

    return {
      tpPrice: isNaN(tpPrice) ? 0 : tpPrice,
      rrRatio: isNaN(rrRatio) ? 0 : rrRatio,
      projectedProfit,
      projectedProfitPercent,
    };
  }, [entry, stop, takeProfit, targetRR, useCustomRR, result, riskPercent]);

  // Color shifting metrics based on Risk %
  // Green: <= 1.5% | Yellow: > 1.5% and <= 3% | Red: > 3%
  const riskColorClass = useMemo(() => {
    if (riskPercent <= 1.5) {
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        borderFocus: "focus:border-emerald-500/40",
        bg: "bg-emerald-500/5",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        accent: "#10b981",
      };
    }
    if (riskPercent <= 3.0) {
      return {
        text: "text-amber-400",
        border: "border-amber-500/20",
        borderFocus: "focus:border-amber-500/40",
        bg: "bg-amber-500/5",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        accent: "#f59e0b",
      };
    }
    return {
      text: "text-red-400",
      border: "border-red-500/20",
      borderFocus: "focus:border-red-500/40",
      bg: "bg-red-500/5",
      badge: "bg-red-500/10 text-red-400 border-red-500/20",
      accent: "#ef4444",
    };
  }, [riskPercent]);

  return (
    <div className={cn("rounded-2xl border bg-[#0f1318]/60 backdrop-blur p-6 lg:col-span-2 transition-all duration-300", riskColorClass.border)}>
      {/* Title */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className={cn("h-4.5 w-4.5", riskColorClass.text)} />
          <h3 className="text-lg font-bold tracking-tight text-white">Risk & Position Calculator</h3>
        </div>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border font-mono", riskColorClass.badge)}>
          {riskPercent <= 1.5 ? "Safe Risk" : riskPercent <= 3.0 ? "Moderate Exposure" : "Aggressive Risk"}
        </span>
      </div>

      {/* SECTION 1: RISK SLIDER */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-black/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Risk Per Trade (%)
          </label>
          <span className={cn("font-mono text-lg font-black", riskColorClass.text)}>
            {riskPercent.toFixed(1)}%
          </span>
        </div>
        
        {/* HTML5 Range Slider */}
        <input
          type="range"
          min="0.1"
          max="10.0"
          step="0.1"
          value={riskPercent}
          onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          style={{ accentColor: riskColorClass.accent }}
        />

        {/* Visual Capital Impact Bar */}
        <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-800/60 pt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wide">
            <span>Projected Risk Allocation</span>
            <span className="font-mono">
              {fmtUsd((equity * riskPercent) / 100)} / {fmtUsd(equity)}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
            {/* Staged Risk portion */}
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${Math.min(riskPercent * 10, 100)}%`, 
                backgroundColor: riskColorClass.accent 
              }} 
            />
            {/* Safe/Remaining Equity portion */}
            <div 
              className="h-full bg-slate-800 flex-1 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: INPUTS & SETTINGS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Instrument Contract">
          <select
            value={symbolKey}
            onChange={(e) => {
              setSymbolKey(e.target.value);
              setUseCustomContract(false);
            }}
            className={cn(inputClass, riskColorClass.borderFocus)}
          >
            {CONTRACT_PRESETS.map((p) => (
              <option key={p.symbol} value={p.symbol} className="bg-[#0f1318] text-white">
                {p.display}
              </option>
            ))}
          </select>
        </Field>
        
        <Field label="Entry Price">
          <input
            type="number"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="e.g. 1.1000"
            className={cn(inputClass, riskColorClass.borderFocus)}
          />
        </Field>

        <Field label="Stop Loss">
          <input
            type="number"
            step="any"
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            placeholder="e.g. 1.0950"
            className={cn(inputClass, riskColorClass.borderFocus)}
          />
        </Field>
      </div>

      {/* SECTION 3: REWARD PROJECTIONS (R:R Ratio / Take Profit) */}
      <div className="mt-4 border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-400" />
            Reward Projection Target
          </span>
          <button
            type="button"
            onClick={() => setUseCustomRR(!useCustomRR)}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
          >
            Switch to {useCustomRR ? "Target R:R Ratio" : "Custom Take Profit"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {!useCustomRR ? (
            <Field label="Target Reward Ratio (R:R)">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-500 font-bold font-mono">1:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={targetRR}
                  onChange={(e) => setTargetRR(e.target.value)}
                  className={cn(inputClass, "pl-8", riskColorClass.borderFocus)}
                />
              </div>
            </Field>
          ) : (
            <Field label="Take Profit Price Target">
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="e.g. 1.1100"
                className={cn(inputClass, riskColorClass.borderFocus)}
              />
            </Field>
          )}

          {/* Preset Helper R:R Buttons */}
          {!useCustomRR && (
            <div className="flex items-end gap-1.5 h-11 pb-0.5">
              {["1", "2", "3", "5"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTargetRR(val)}
                  className={cn(
                    "flex-1 h-9 rounded-lg border text-xs font-bold font-mono transition-all",
                    targetRR === val
                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                      : "border-slate-800 hover:border-slate-700 bg-[#07090d]/30 text-slate-400 hover:text-white"
                  )}
                >
                  1:{val}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: OUTPUT MODULE */}
      {result && projections && (
        <div className={cn("mt-5 rounded-xl border p-4 transition-all duration-300", riskColorClass.bg, riskColorClass.border)}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat
              label="Position Size"
              value={`${result.lots.toFixed(2)} Lots`}
              sub="floored"
              big
            />
            <Stat
              label="Monetary Risk"
              value={fmtUsd(result.riskAmount)}
              sub={`${result.riskPercent.toFixed(1)}% equity`}
            />
            <Stat
              label="Stop Distance"
              value={fmtNumber(result.priceDistance, 5)}
              sub="entry → stop"
            />
            <Stat
              label="Projected Reward"
              value={fmtUsd(projections.projectedProfit)}
              sub={`1:${projections.rrRatio.toFixed(1)} R:R (${projections.projectedProfitPercent.toFixed(1)}%)`}
              positive
            />
          </div>

          {/* Warnings */}
          {result.warning && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{result.warning}</span>
            </div>
          )}

          {/* High Risk warning banner */}
          {riskPercent > 3.0 && (
            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-red-500/15 bg-red-500/[0.03] p-3 text-xs text-red-300 font-semibold">
              <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-500" />
              <div>
                <span className="text-red-400 font-black">Warning: High Exposure!</span> Staging {riskPercent.toFixed(1)}% risk on a single execution violates baseline discipline models. Consider reducing lot size to prevent account compounding leakage.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preset Custom Override option */}
      <details className="mt-4 text-xs font-semibold">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-400 transition-colors uppercase tracking-wider text-[9px]">
          Need Custom Instrument Contract Value?
        </summary>
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="number"
            step="any"
            placeholder={`Default multiplier for ${preset?.display ?? symbolKey}: ${preset?.contractValue ?? "—"}`}
            value={customContract}
            onChange={(e) => {
              setCustomContract(e.target.value);
              setUseCustomContract(!!e.target.value);
            }}
            className={cn(inputClass, riskColorClass.borderFocus)}
          />
        </div>
      </details>

      {!result && (entry || stop) && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
          Fill in both Entry Price and Stop Loss targets to output position sizing results.
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full h-10 rounded-xl border border-slate-800 bg-[#07090d]/30 px-3.5 text-xs font-bold text-white outline-none transition placeholder:text-slate-600";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
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
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
  positive?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-800/40 bg-black/10 p-3", big && "bg-indigo-500/[0.03] border-indigo-500/10")}>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-black tracking-tight font-mono",
          big ? "text-xl text-white" : positive ? "text-base text-emerald-400" : "text-base text-white/90"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
