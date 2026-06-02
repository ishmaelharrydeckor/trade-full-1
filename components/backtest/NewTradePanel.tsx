// components/backtest/NewTradePanel.tsx
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  symbol: string;
  currentPrice: number;
  onOpen: (trade: {
    direction: "long" | "short";
    volume: number;
    entry_price: number;
    stop_loss: number | null;
    take_profit: number | null;
    mindset: string | null;
    notes: string | null;
    tags: string[];
  }) => void;
}

const MINDSETS = [
  "focused",
  "disciplined",
  "rushed",
  "fomo",
  "revenge",
  "anxious",
] as const;

export default function NewTradePanel({ symbol, currentPrice, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [volume, setVolume] = useState("0.10");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [mindset, setMindset] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Suggest sensible SL/TP defaults when the panel opens
  useEffect(() => {
    if (!open) return;
    const offset = currentPrice * 0.005; // 0.5% default
    if (direction === "long") {
      if (!stopLoss) setStopLoss((currentPrice - offset).toFixed(decimalsFor(symbol)));
      if (!takeProfit)
        setTakeProfit((currentPrice + offset * 2).toFixed(decimalsFor(symbol)));
    } else {
      if (!stopLoss) setStopLoss((currentPrice + offset).toFixed(decimalsFor(symbol)));
      if (!takeProfit)
        setTakeProfit((currentPrice - offset * 2).toFixed(decimalsFor(symbol)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, direction]);

  function reset() {
    setOpen(false);
    setStopLoss("");
    setTakeProfit("");
    setMindset("");
    setNotes("");
    setTagInput("");
    setVolume("0.10");
  }

  function submit() {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onOpen({
      direction,
      volume: parseFloat(volume) || 0.01,
      entry_price: currentPrice,
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null,
      mindset: mindset || null,
      notes: notes.trim() || null,
      tags,
    });
    reset();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
      >
        <Plus className="h-4 w-4" /> New simulated trade
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.04] p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg">New simulated trade</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Entry will be at the current bar's close ({currentPrice.toFixed(decimalsFor(symbol))})
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Direction toggle */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection("long")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
            direction === "long"
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/5"
          )}
        >
          <TrendingUp className="h-4 w-4" /> Long (buy)
        </button>
        <button
          type="button"
          onClick={() => setDirection("short")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
            direction === "short"
              ? "border-red-500/50 bg-red-500/15 text-red-200"
              : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/5"
          )}
        >
          <TrendingDown className="h-4 w-4" /> Short (sell)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Volume (lots)">
          <input
            type="number"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Stop loss">
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="optional"
            className={inputClass}
          />
        </Field>
        <Field label="Take profit">
          <input
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="optional"
            className={inputClass}
          />
        </Field>
      </div>

      <details className="mt-3 text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-white">
          + Add mindset, notes, tags (optional)
        </summary>
        <div className="mt-2 space-y-3">
          <Field label="Mindset">
            <div className="flex flex-wrap gap-1">
              {MINDSETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMindset(mindset === m ? "" : m)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition capitalize",
                    mindset === m
                      ? "bg-white font-semibold text-slate-900"
                      : "border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What's the setup? Why this entry?"
              className={cn(inputClass, "resize-none")}
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. breakout, london, news"
              className={inputClass}
            />
          </Field>
        </div>
      </details>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
        >
          Open {direction === "long" ? "long" : "short"} @ {currentPrice.toFixed(decimalsFor(symbol))}
        </button>
      </div>
    </div>
  );
}

// Number of decimals to display for a price, by instrument type
function decimalsFor(symbol: string): number {
  if (symbol.includes("JPY")) return 3;
  if (symbol.startsWith("BTC") || symbol.startsWith("ETH")) return 2;
  if (symbol.includes("XAU") || symbol.includes("XAG")) return 2;
  if (symbol.includes("/")) return 5; // forex default
  return 4;
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
