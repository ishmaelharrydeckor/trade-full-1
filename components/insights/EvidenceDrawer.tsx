// components/insights/EvidenceDrawer.tsx
"use client";

import { X, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import type { Trade } from "@/types/database";
import { fmtSignedUsd, fmtDateTime } from "@/lib/format";
import { tradeNetPnl } from "@/lib/stats";
import { cn } from "@/lib/utils";

export interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  ruleExplanation: string;
  evidenceType: "revenge" | "overconfidence" | "switching" | "general";
  tradesList: Trade[];
  metrics?: {
    timeDiff?: string;
    sizeScaling?: string;
    [key: string]: any;
  };
}

export default function EvidenceDrawer({
  isOpen,
  onClose,
  title,
  description,
  ruleExplanation,
  evidenceType,
  tradesList,
  metrics,
}: EvidenceDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Opaque backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer content pane */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-[#0c0f14] shadow-2xl transition-transform duration-300 md:w-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "rounded-lg p-2",
              evidenceType === "general" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {evidenceType === "general" ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Rule breakdown card */}
          <div className="rounded-xl border border-slate-800 bg-[#12161f]/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Rule Explanation</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{ruleExplanation}</p>
          </div>

          {/* Computed metrics badges */}
          {metrics && Object.keys(metrics).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Calculated Indicators</h4>
              <div className="grid grid-cols-2 gap-3">
                {metrics.timeDiff && (
                  <div className="rounded-xl border border-slate-800 bg-[#12161f]/20 p-3 text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Time Gap</span>
                    <span className="text-sm font-black text-white font-mono mt-1 block">{metrics.timeDiff}</span>
                  </div>
                )}
                {metrics.sizeScaling && (
                  <div className="rounded-xl border border-slate-800 bg-[#12161f]/20 p-3 text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Size Scaling</span>
                    <span className="text-sm font-black text-red-400 font-mono mt-1 block">{metrics.sizeScaling}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Triggering execution list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Supporting Evidence ({tradesList.length} trades)</h4>
            <div className="space-y-3">
              {tradesList.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                  No direct trade associations computed.
                </div>
              ) : (
                tradesList.map((trade, idx) => {
                  const pnl = tradeNetPnl(trade);
                  const isWin = pnl > 0;
                  return (
                    <div key={trade.id} className="rounded-xl border border-slate-800 bg-black/30 p-4 hover:border-slate-700 transition duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-black text-white font-mono uppercase">
                            {trade.symbol}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            trade.direction === "long" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          )}>
                            {trade.direction}
                          </span>
                        </div>
                        <span className={cn(
                          "text-xs font-black font-mono",
                          pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {fmtSignedUsd(pnl)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-y-2 text-[11px] text-slate-400">
                        <div>
                          <span className="text-slate-500 font-medium">Volume:</span>{" "}
                          <span className="text-white font-mono font-bold">{trade.volume} lots</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Price:</span>{" "}
                          <span className="text-white font-mono">{trade.entry_price}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 font-medium">Closed:</span>{" "}
                          <span className="text-white font-mono">{fmtDateTime(trade.close_time ?? trade.open_time)}</span>
                        </div>
                      </div>

                      {idx < tradesList.length - 1 && (
                        <div className="mt-4 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase tracking-wider gap-1.5 border-t border-slate-800/50 pt-2">
                          <span>Next trade transition</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-5 bg-[#080a0e] text-center">
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Trade·Journal behavioral analyzer uses execution metrics & timestamps to detect psychological mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}
