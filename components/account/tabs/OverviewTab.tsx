// components/account/tabs/OverviewTab.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Target,
  Coins,
  Activity,
  Trophy,
  Flame,
  Award,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { Account, Trade, AccountTransaction, Playbook, TradePlaybookEntry } from "@/types/database";
import { computeKpis, buildEquityCurve, computeCurrentEquity, computeDrawdown } from "@/lib/stats";
import { fmtSignedUsd, fmtCompactNumber, fmtDateTime, fmtPct, fmtNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import OpenPositionsPanel from "@/components/overview/OpenPositionsPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

interface PlaybookRule {
  id: string;
  name: string;
}

export default function OverviewTab({
  account,
  trades,
  transactions,
  playbooks,
  playbookEntries,
}: {
  account: Account;
  trades: Trade[];
  transactions: AccountTransaction[];
  playbooks: Playbook[];
  playbookEntries: TradePlaybookEntry[];
}) {
  const startingBalance = account.starting_balance ?? 0;

  // States
  const [chartMode, setChartMode] = useState<"equity" | "balance" | "drawdown-overlay">("equity");
  const timeFilter = "all";

  // Compute time bounds
  const filterDateBound = useMemo(() => {
    if (timeFilter === "all") return null;
    const now = new Date();
    if (timeFilter === "7d") {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (timeFilter === "30d") {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (timeFilter === "ytd") {
      return new Date(now.getFullYear(), 0, 1); // January 1st
    }
    return null;
  }, [timeFilter]);

  // Filter trades and transactions based on chosen time frame
  const filteredTrades = useMemo(() => {
    if (!filterDateBound) return trades;
    const boundMs = filterDateBound.getTime();
    return trades.filter((t) => {
      const tTime = new Date(t.close_time ?? t.open_time).getTime();
      return tTime >= boundMs;
    });
  }, [trades, filterDateBound]);

  const filteredTransactions = useMemo(() => {
    if (!filterDateBound) return transactions;
    const boundMs = filterDateBound.getTime();
    return transactions.filter((tx) => {
      const txTime = new Date(tx.occurred_at).getTime();
      return txTime >= boundMs;
    });
  }, [transactions, filterDateBound]);

  // Dynamically calculate the starting balance for the filtered period
  const periodStartingBalance = useMemo(() => {
    if (!filterDateBound) return startingBalance;
    const boundMs = filterDateBound.getTime();

    // Sum all trades closed BEFORE the filter boundary
    const tradesBefore = trades.filter((t) => {
      const tTime = new Date(t.close_time ?? t.open_time).getTime();
      return tTime < boundMs;
    });
    const pnlBefore = tradesBefore.reduce((sum, t) => {
      const gross = t.pnl ?? 0;
      const net = gross - (t.commission ?? 0) - (t.swap ?? 0);
      return sum + net;
    }, 0);

    // Sum all transactions occurred BEFORE the filter boundary
    const txsBefore = transactions.filter((tx) => {
      const txTime = new Date(tx.occurred_at).getTime();
      return txTime < boundMs;
    });
    const txBeforeNet = txsBefore.reduce((sum, tx) => {
      return sum + (tx.type === "deposit" ? tx.amount : -tx.amount);
    }, 0);

    return startingBalance + pnlBefore + txBeforeNet;
  }, [trades, transactions, startingBalance, filterDateBound]);

  // Calculations on filtered datasets
  const kpis = useMemo(() => computeKpis(filteredTrades), [filteredTrades]);
  const equityCurve = useMemo(
    () => buildEquityCurve(filteredTrades, filteredTransactions, periodStartingBalance),
    [filteredTrades, filteredTransactions, periodStartingBalance]
  );
  const currentEquity = useMemo(
    () => computeCurrentEquity(filteredTrades, filteredTransactions, periodStartingBalance),
    [filteredTrades, filteredTransactions, periodStartingBalance]
  );
  const drawdown = useMemo(() => computeDrawdown(equityCurve), [equityCurve]);

  // Discipline & Streaks calculations (Section 2)
  const coreInsights = useMemo(() => {
    let totalRulesChecked = 0;
    let totalRulesFollowed = 0;

    for (const entry of playbookEntries) {
      const followed = entry.rules_followed?.length ?? 0;
      const broken = entry.rules_broken?.length ?? 0;
      totalRulesChecked += followed + broken;
      totalRulesFollowed += followed;
    }

    const complianceScore = totalRulesChecked > 0 ? (totalRulesFollowed / totalRulesChecked) * 100 : null;

    let gradeSum = 0;
    let gradedCount = 0;
    for (const t of filteredTrades) {
      if (t.grade) {
        gradedCount++;
        if (t.grade === "A+") gradeSum += 100;
        else if (t.grade === "A") gradeSum += 90;
        else if (t.grade === "B") gradeSum += 75;
        else if (t.grade === "C") gradeSum += 50;
        else if (t.grade === "D") gradeSum += 25;
        else if (t.grade === "F") gradeSum += 0;
      }
    }

    const gradeScore = gradedCount > 0 ? gradeSum / gradedCount : null;
    const disciplineScore = Math.round(complianceScore !== null ? complianceScore : (gradeScore !== null ? gradeScore : 85));

    // Execution streak (A/B trades or general win streak)
    let executionStreak = 0;
    for (const t of filteredTrades) {
      if (t.grade && ["A+", "A", "B"].includes(t.grade)) {
        executionStreak++;
      } else if (t.grade) {
        break;
      }
    }
    const finalStreak = executionStreak > 0 ? executionStreak : (kpis.bestStreak > 0 ? kpis.bestStreak : 0);

    // AI Behavioral Tags detection
    const ruleNames: Record<string, string> = {};
    for (const pb of playbooks) {
      const rules = (pb.rules as unknown as PlaybookRule[]) ?? [];
      for (const r of rules) {
        ruleNames[r.id] = r.name;
      }
    }

    const brokenCounts: Record<string, number> = {};
    for (const entry of playbookEntries) {
      for (const rId of entry.rules_broken ?? []) {
        brokenCounts[rId] = (brokenCounts[rId] ?? 0) + 1;
      }
    }

    const topBroken = Object.entries(brokenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([rId]) => ruleNames[rId] || "Rule Deviation");

    const behaviorTags: string[] = [];
    if (topBroken.length > 0) {
      behaviorTags.push(...topBroken);
    }
    
    // Scan mindsets/notes
    const recentMindsets = filteredTrades
      .slice(0, 15)
      .map((t) => t.mindset?.toLowerCase() ?? "")
      .filter(Boolean);

    if (recentMindsets.some((m) => m.includes("fomo") || m.includes("impatient"))) {
      behaviorTags.push("FOMO Triggered");
    }
    if (recentMindsets.some((m) => m.includes("greed") || m.includes("overtrade"))) {
      behaviorTags.push("Over-Leveraging");
    }
    if (recentMindsets.some((m) => m.includes("revenge") || m.includes("frustrated"))) {
      behaviorTags.push("Revenge Risk");
    }
    if (kpis.worstStreak > 3) {
      behaviorTags.push("Tilt Susceptible");
    }
    if (behaviorTags.length === 0) {
      behaviorTags.push("Disciplined Flow");
    }

    return {
      disciplineScore,
      executionStreak: finalStreak,
      tags: behaviorTags.slice(0, 3),
    };
  }, [filteredTrades, playbooks, playbookEntries, kpis]);

  // Equity Curve calculations for visual chart
  const processedEquityCurve = useMemo(() => {
    let peak = periodStartingBalance;
    return equityCurve.map((point) => {
      if (point.equity > peak) peak = point.equity;
      const ddPct = peak > 0 ? -((peak - point.equity) / peak) * 100 : 0;
      return {
        ...point,
        balance: point.equity, // default base
        drawdown: Math.round(ddPct * 100) / 100,
      };
    });
  }, [equityCurve, periodStartingBalance]);

  // Drawdown Area chart data
  const drawdownChartData = useMemo(() => {
    let peak = periodStartingBalance;
    return equityCurve.map((point) => {
      if (point.equity > peak) peak = point.equity;
      const ddPct = peak > 0 ? -((peak - point.equity) / peak) * 100 : 0;
      const ddAbs = -(peak - point.equity);
      return {
        time: point.time,
        drawdown: Math.round(ddPct * 100) / 100,
        drawdownAbs: Math.round(ddAbs * 100) / 100,
      };
    });
  }, [equityCurve, periodStartingBalance]);

  // SVG parameters for radial gauge (Section 2)
  const scoreSize = 120;
  const scoreStroke = 8;
  const scoreRadius = (scoreSize - scoreStroke) / 2;
  const scoreCircumference = scoreRadius * 2 * Math.PI;
  const scoreOffset = scoreCircumference - (coreInsights.disciplineScore / 100) * scoreCircumference;

  return (
    <div className="flex flex-col gap-6">
      <OpenPositionsPanel accountId={account.id} />


      {/* SECTION 1: KEY PERFORMANCE STRIP */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <style>{`
          @keyframes kpiFade {
            0% { transform: scale(0.97); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          .kpi-animate {
            animation: kpiFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* Net P&L Card */}
        <div 
          key={`${timeFilter}-pnl`}
          className="kpi-animate group rounded-2xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:border-slate-700 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Coins className="h-3.5 w-3.5 text-indigo-400" />
            <span>Net P&L</span>
          </div>
          <div className={cn(
            "mt-3.5 text-2xl font-black tracking-tight font-mono",
            kpis.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {fmtSignedUsd(kpis.netPnl)}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {account.currency} Account
          </div>
        </div>

        {/* Win Rate Card */}
        <div 
          key={`${timeFilter}-winrate`}
          className="kpi-animate group rounded-2xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:border-slate-700 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            <span>Win rate</span>
          </div>
          <div className="mt-3.5 text-2xl font-black tracking-tight text-white font-mono">
            {fmtPct(kpis.winRate, 1)}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400/90">
            {kpis.winners} W · {kpis.losers} L
          </div>
        </div>

        {/* Profit Factor Card */}
        <div 
          key={`${timeFilter}-pf`}
          className="kpi-animate group rounded-2xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:border-slate-700 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Profit factor</span>
          </div>
          <div className="mt-3.5 text-2xl font-black tracking-tight text-white font-mono">
            {kpis.profitFactor === Infinity ? "∞" : fmtNumber(kpis.profitFactor, 2)}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Gross Win / Gross Loss
          </div>
        </div>

        {/* Total Trades Card */}
        <div 
          key={`${timeFilter}-trades`}
          className="kpi-animate group rounded-2xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:border-slate-700 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Activity className="h-3.5 w-3.5 text-orange-400" />
            <span>Total trades</span>
          </div>
          <div className="mt-3.5 text-2xl font-black tracking-tight text-white font-mono">
            {kpis.trades}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Positions logged
          </div>
        </div>

        {/* Streaks Card */}
        <div 
          key={`${timeFilter}-streaks`}
          className="kpi-animate group rounded-2xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:border-slate-700 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Streak Matrix</span>
          </div>
          <div className="mt-3.5 text-xl font-black tracking-tight text-white font-mono">
            {kpis.bestStreak} W / <span className="text-red-400">{kpis.worstStreak} L</span>
          </div>
          <div className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Consecutive trades
          </div>
        </div>
      </section>

      {/* SECTION 2: CORE INSIGHTS (Discipline Gauge, Calendar Stat, AI Tags) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Discipline Score Gauge */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border p-6 text-center bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}>
          <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            Discipline Score
          </span>
          <div className="relative mt-5 mb-2 flex items-center justify-center">
            <svg width={scoreSize} height={scoreSize} className="-rotate-90">
              <circle
                cx={scoreSize / 2}
                cy={scoreSize / 2}
                r={scoreRadius}
                fill="transparent"
                stroke="rgba(255,255,255,0.02)"
                strokeWidth={scoreStroke}
              />
              <circle
                cx={scoreSize / 2}
                cy={scoreSize / 2}
                r={scoreRadius}
                fill="transparent"
                stroke="url(#insightGrad)"
                strokeWidth={scoreStroke}
                strokeDasharray={scoreCircumference}
                strokeDashoffset={scoreOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="insightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white font-mono">{coreInsights.disciplineScore}%</span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">Rule Compliance Rating</span>
        </div>

        {/* Calendar-Style Streak Widget */}
        <div className="group relative flex flex-col items-center justify-between rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-6"
          style={{ borderColor: "var(--border-panel)" }}>
          <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Execution Flow
          </span>

          {/* Calendar representation */}
          <div className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl overflow-hidden border border-slate-800 bg-[#07090d] shadow-inner mt-4">
            <div className="w-full bg-red-600/90 text-[10px] font-black uppercase text-center text-white/90 py-1.5 tracking-widest">
              STREAK
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-black/40">
              <span className="text-4xl font-black text-white font-mono leading-none">{coreInsights.executionStreak}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">SESSIONS</span>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-3 text-center">
            Consecutive Disciplined Choices
          </span>
        </div>

        {/* Behavioral Insights (AI Tags) */}
        <div className="group relative flex flex-col justify-between rounded-2xl border p-6 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}>
          <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-indigo-400" />
            Behavioral Insights
          </span>
          <div className="mt-8 flex flex-col gap-2">
            {coreInsights.tags.map((tag, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition",
                  tag.includes("Flow") || tag.includes("Execution") || tag.includes("Disciplined")
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                    : "bg-red-500/5 border-red-500/10 text-red-400"
                )}
              >
                <span>{tag}</span>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  tag.includes("Flow") || tag.includes("Execution") || tag.includes("Disciplined")
                    ? "bg-emerald-400"
                    : "bg-red-400"
                )} />
              </div>
            ))}
          </div>
          <span className="text-[9px] font-semibold text-slate-500 text-center mt-3">
            Behavior and discipline guide profitability
          </span>
        </div>
      </section>

      {/* SECTION 3: EQUITY CURVE (Hero Visual) */}
      <section className="rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md" style={{ borderColor: "var(--border-panel)" }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Equity & Capital Progression</h3>
            <InfoTooltip text="Visual progression of your account equity. Select toggles to analyze performance." />
          </div>
          
          <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/5">
            {[
              { id: "equity", label: "Equity Line" },
              { id: "balance", label: "Balance" },
              { id: "drawdown-overlay", label: "Drawdown Overlay" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setChartMode(mode.id as any)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  chartMode === mode.id
                    ? "bg-indigo-600 text-white shadow border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="h-80 min-w-[600px] sm:min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedEquityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ddOverlayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid stroke="#1f2937/40" strokeDasharray="3 3" vertical={false} />
                
                <XAxis
                  dataKey="time"
                  tickFormatter={(val) => {
                    try {
                      const d = new Date(val);
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    } catch {
                      return "";
                    }
                  }}
                  stroke="rgba(255,255,255,0.03)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  minTickGap={45}
                />
                
                <YAxis
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.03)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(val) => fmtCompactNumber(val)}
                  domain={["auto", "auto"]}
                />

                {chartMode === "drawdown-overlay" && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(255,255,255,0.03)"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `${val}%`}
                    domain={["dataMin", 0]}
                  />
                )}

                {periodStartingBalance > 0 && (
                  <ReferenceLine
                    yAxisId="left"
                    y={periodStartingBalance}
                    stroke="#475569"
                    strokeDasharray="4 4"
                  />
                )}

                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(8, 11, 17, 0.95)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: 6 }}
                  labelFormatter={(label) => fmtDateTime(label as string)}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    const pPoint = payload[0].payload;
                    const isTrade = pPoint.type === "trade";
                    const symbolLabel = pPoint.label;
                    const value = pPoint.equity;
                    const delta = pPoint.delta;

                    return (
                      <div className="flex flex-col gap-1.5 p-1 text-xs">
                        <span className="font-bold text-slate-400">{fmtDateTime(label as string)}</span>
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Equity</span>
                          <span className="font-mono text-white font-bold">{fmtSignedUsd(value)}</span>
                        </div>
                        {delta !== 0 && (
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Delta</span>
                            <span className={cn("font-mono font-bold", delta >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {delta >= 0 ? "+" : ""}{fmtSignedUsd(delta)}
                            </span>
                          </div>
                        )}
                        {isTrade && symbolLabel && (
                          <div className="flex items-center justify-between gap-6 border-t border-white/5 pt-1.5 mt-0.5">
                            <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">Symbol</span>
                            <span className="font-mono font-black text-white text-[11px]">{symbolLabel}</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                {chartMode === "drawdown-overlay" && (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    fill="url(#ddOverlayGrad)"
                    name="drawdown"
                  />
                )}

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="balance"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#eqGrad)"
                  name="equity"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 4: DRAWDOWN VISUALIZATION */}
      <section className="rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md" style={{ borderColor: "var(--border-panel)" }}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <h3 className="text-lg font-bold text-white tracking-tight">Drawdown Profile</h3>
            <InfoTooltip text="Drawdown percentage from account high-water mark." />
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 bg-red-950/20 border border-red-500/10 px-3.5 py-1.5 rounded-xl">
            <span>
              Peak Drawdown:{" "}
              <span className="font-mono font-black text-red-400">{fmtPct(drawdown.maxDrawdownPct, 1)}</span>
              {" "}({fmtSignedUsd(-drawdown.maxDrawdownAbs)})
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="h-44 min-w-[600px] sm:min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937/40" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="rgba(255,255,255,0.03)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  minTickGap={40}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.03)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(val) => `${Math.round(val)}%`}
                  domain={["dataMin", 0]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(8, 11, 17, 0.95)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    backdropFilter: "blur(6px)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Drawdown"]}
                  labelFormatter={(label) => fmtDateTime(label as string)}
                />
                <ReferenceLine y={-5} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.35} />
                <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.35} />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#ddGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Psychological framing banner */}
        <div className="mt-4 border-t border-red-500/10 pt-3 text-[11px] font-bold text-slate-400 flex items-start gap-2.5 bg-red-950/[0.08] p-3 rounded-xl border border-red-500/5">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-red-400 font-extrabold">Risk Awareness & Emotional Anchor:</span> Drawdowns are a natural byproduct of active speculation. Keeping drawdown bounded (typically under 10%) preserves psychological capital and protects your high-water mark. If your metrics violate safe thresholds, scale down size immediately to maintain discipline.
          </div>
        </div>
      </section>

      {/* SECTION 5: RECENT TRADES */}
      <section className="rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md" style={{ borderColor: "var(--border-panel)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Recent Trade Logs</h3>
          {filteredTrades.length > 5 && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("tradefull:gototab", { detail: "trades" }))}
              className="text-xs font-extrabold text-indigo-400 hover:underline"
            >
              All Trades ({filteredTrades.length}) →
            </button>
          )}
        </div>

        {filteredTrades.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
            No trades completed within the selected timeframe. Update MetaTrader sync or add manually.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400" 
                style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                <tr>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Direction</th>
                  <th className="px-4 py-3 text-right">Lots</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3 text-left">Closed Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.slice(0, 5).map((t) => {
                  const isLong = t.direction === "long";
                  const pnlVal = t.pnl ?? 0;
                  const isWin = pnlVal > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-900/20 transition-colors text-white font-medium">
                      <td className="px-4 py-3 font-bold text-slate-200">{t.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase",
                          isLong ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" : "bg-orange-500/10 text-orange-400 border border-orange-500/15"
                        )}>
                          {isLong ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-300">{Number(t.volume).toFixed(2)}</td>
                      <td className={cn(
                        "px-4 py-3 text-right font-mono font-bold text-sm",
                        isWin ? "text-emerald-400" : pnlVal < 0 ? "text-red-400" : "text-slate-400"
                      )}>
                        {fmtSignedUsd(pnlVal)}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">{fmtDateTime(t.close_time)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

