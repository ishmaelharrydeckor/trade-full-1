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
  Scatter,
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
  CheckCircle,
  Lock,
} from "lucide-react";
import type { Account, Trade, AccountTransaction, Playbook, TradePlaybookEntry, SessionAudit } from "@/types/database";
import { computeKpis, buildEquityCurve, computeCurrentEquity, computeDrawdown } from "@/lib/stats";
import { fmtSignedUsd, fmtCompactNumber, fmtDateTime, fmtPct, fmtNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import OpenPositionsPanel from "@/components/overview/OpenPositionsPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import {
  detectRevengeTrading,
  detectOverconfidence,
  detectStrategySwitching,
  computePlanAdherence
} from "@/lib/behavioral-engine";
import {
  calculateStreaks,
  computeDisciplineRings,
  evaluateBadges
} from "@/lib/habit-loop";
import EvidenceDrawer from "@/components/insights/EvidenceDrawer";
import DisciplineRings from "@/components/overview/DisciplineRings";

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
  sessionAudits = [],
}: {
  account: Account;
  trades: Trade[];
  transactions: AccountTransaction[];
  playbooks: Playbook[];
  playbookEntries: TradePlaybookEntry[];
  sessionAudits?: SessionAudit[];
}) {
  const startingBalance = account.starting_balance ?? 0;

  // States
  const [chartMode, setChartMode] = useState<"equity" | "balance" | "drawdown-overlay">("equity");
  const [showDisciplineOverlay, setShowDisciplineOverlay] = useState(false);
  const [showViolationsOverlay, setShowViolationsOverlay] = useState(false);
  const [showEmotionsOverlay, setShowEmotionsOverlay] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Record<number, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<{
    title: string;
    description: string;
    ruleExplanation: string;
    evidenceType: "revenge" | "overconfidence" | "switching" | "general";
    tradesList: Trade[];
    metrics?: Record<string, string>;
  }>({
    title: "",
    description: "",
    ruleExplanation: "",
    evidenceType: "general",
    tradesList: [],
  });
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

    return {
      disciplineScore,
      executionStreak: finalStreak,
      tags: [],
    };
  }, [filteredTrades, playbooks, playbookEntries, kpis]);

  const revengeEvidences = useMemo(() => detectRevengeTrading(filteredTrades), [filteredTrades]);
  const overconfidenceEvidences = useMemo(() => detectOverconfidence(filteredTrades), [filteredTrades]);
  const strategySwitchingEvidence = useMemo(() => detectStrategySwitching(filteredTrades, playbookEntries, playbooks), [filteredTrades, playbookEntries, playbooks]);
  const planAdherenceVal = useMemo(() => computePlanAdherence(filteredTrades, playbookEntries), [filteredTrades, playbookEntries]);

  // Habit Loop Calculations
  const { currentStreak, longestStreak } = useMemo(() => calculateStreaks(sessionAudits), [sessionAudits]);
  const ringsData = useMemo(() => computeDisciplineRings(sessionAudits, trades), [sessionAudits, trades]);
  const badgesList = useMemo(() => evaluateBadges(sessionAudits), [sessionAudits]);

  const { nextMilestone, daysRemaining, progressPct } = useMemo(() => {
    const next = currentStreak === 0 ? 7 : Math.ceil((currentStreak + 0.1) / 7) * 7;
    const remaining = next - currentStreak;
    const pct = (currentStreak % 7 === 0 && currentStreak > 0) ? 100 : ((currentStreak % 7) / 7) * 100;
    return { nextMilestone: next, daysRemaining: remaining, progressPct: pct };
  }, [currentStreak]);

  const behavioralFlags = useMemo(() => {
    const flags: {
      type: "revenge" | "overconfidence" | "switching" | "general";
      label: string;
      description: string;
      ruleExplanation: string;
      trades: Trade[];
      metrics?: Record<string, string>;
      severity: "high" | "medium" | "low" | "clean";
    }[] = [];

    if (revengeEvidences.length > 0) {
      const revengeTradesSet = new Set<string>();
      const list: Trade[] = [];
      revengeEvidences.forEach(e => {
        if (!revengeTradesSet.has(e.triggerTrade.id)) {
          revengeTradesSet.add(e.triggerTrade.id);
          list.push(e.triggerTrade);
        }
        if (!revengeTradesSet.has(e.revengeTrade.id)) {
          revengeTradesSet.add(e.revengeTrade.id);
          list.push(e.revengeTrade);
        }
      });

      const maxScaling = Math.max(...revengeEvidences.map(e => e.sizeMultiplier));
      const minDiff = Math.min(...revengeEvidences.map(e => e.timeDiffMinutes));

      flags.push({
        type: "revenge",
        label: "Revenge Trading Warning",
        description: `${revengeEvidences.length} size-scaled rapid entries post-loss.`,
        ruleExplanation: "Revenge trading triggers when you enter a position within 10 minutes of a loss and scale up the lot size, trying to recover losses quickly.",
        trades: list,
        metrics: {
          timeDiff: `${minDiff}m gap`,
          sizeScaling: `${maxScaling}x scaling`,
        },
        severity: "high",
      });
    }

    if (overconfidenceEvidences.length > 0) {
      const overTradesSet = new Set<string>();
      const list: Trade[] = [];
      overconfidenceEvidences.forEach(e => {
        if (!overTradesSet.has(e.winningTrade.id)) {
          overTradesSet.add(e.winningTrade.id);
          list.push(e.winningTrade);
        }
        e.subsequentTrades.forEach(t => {
          if (!overTradesSet.has(t.id)) {
            overTradesSet.add(t.id);
            list.push(t);
          }
        });
      });

      const maxScaling = Math.max(...overconfidenceEvidences.map(e => e.sizeMultiplier));
      const minHours = Math.min(...overconfidenceEvidences.map(e => e.timeDiffHours));

      flags.push({
        type: "overconfidence",
        label: "Post-Win Overconfidence",
        description: `${overconfidenceEvidences.length} size/frequency escalations post-win.`,
        ruleExplanation: "Overconfidence bias triggers when a trader scales up volume or trades with excessive frequency within 1 hour after a winning trade.",
        trades: list,
        metrics: {
          timeDiff: `${minHours}h gap`,
          sizeScaling: `${maxScaling}x scaling`,
        },
        severity: "medium",
      });
    }

    if (strategySwitchingEvidence.uniquePlaybooksCount > 3) {
      const lowTradesStrategies = strategySwitchingEvidence.playbooksList.filter(p => p.count < 3);
      if (lowTradesStrategies.length >= 2) {
        flags.push({
          type: "switching",
          label: "Strategy Hopping Detected",
          description: `Traded ${strategySwitchingEvidence.uniquePlaybooksCount} distinct setups recently.`,
          ruleExplanation: "Strategy Hopping triggers when you execute trades across multiple playbooks without staying with one long enough to realize statistical edge.",
          trades: [],
          metrics: {
            timeDiff: "Last 30 days",
            sizeScaling: `${strategySwitchingEvidence.uniquePlaybooksCount} setups`,
          },
          severity: "medium",
        });
      }
    }

    if (flags.length === 0) {
      flags.push({
        type: "general",
        label: "Disciplined Flow",
        description: "Zero behavioral bias patterns detected in recent trades.",
        ruleExplanation: "No emotional patterns like revenge trading, size scaling post-loss, or post-win overconfidence detected. Excellent execution consistency!",
        trades: [],
        severity: "clean",
      });
    }

    return flags;
  }, [revengeEvidences, overconfidenceEvidences, strategySwitchingEvidence]);

  // Equity Curve calculations for visual chart
  const processedEquityCurve = useMemo(() => {
    let peak = periodStartingBalance;

    const auditMap = new Map<string, SessionAudit>();
    sessionAudits.forEach((a) => {
      const dStr = a.audit_date.split("T")[0];
      auditMap.set(dStr, a);
    });

    return equityCurve.map((point) => {
      if (point.equity > peak) peak = point.equity;
      const ddPct = peak > 0 ? -((peak - point.equity) / peak) * 100 : 0;

      // Extract matching audit details
      const pointDateStr = new Date(point.time).toISOString().split("T")[0];
      const matchingAudit = auditMap.get(pointDateStr);

      const disciplineScore = matchingAudit ? matchingAudit.execution_score : null;
      const hasViolation = matchingAudit
        ? !matchingAudit.followed_plan ||
          !matchingAudit.respected_risk ||
          !matchingAudit.avoided_revenge ||
          !matchingAudit.avoided_emotional ||
          !matchingAudit.waited_setup ||
          !matchingAudit.respected_sl
        : false;

      const hasNegativeEmotion = matchingAudit
        ? matchingAudit.emotional_states.some((s) =>
            ["FOMO", "Frustrated", "Revenge Trading", "Anxious", "Impulsive"].includes(s)
          )
        : false;

      return {
        ...point,
        balance: point.equity, // default base
        drawdown: Math.round(ddPct * 100) / 100,
        disciplineScore,
        violationMarker: hasViolation ? point.equity : null,
        emotionMarker: hasNegativeEmotion ? point.equity : null,
        auditDetails: matchingAudit,
      };
    });
  }, [equityCurve, periodStartingBalance, sessionAudits]);

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

      {/* SECTION 1: BEHAVIOR CENTER */}
      <section className="rounded-2xl border p-6 bg-[#0f1318]/60 backdrop-blur-md" style={{ borderColor: "var(--border-panel)" }}>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white tracking-tight">Behavior Center</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Your trading behavior compounds over time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Discipline Rings */}
          <div className="flex flex-col items-center justify-center border border-slate-800/60 rounded-xl bg-black/10 p-4">
            <DisciplineRings
              ruleCompliance={ringsData.ruleCompliance}
              emotionalAwareness={ringsData.emotionalAwareness}
              consistency={ringsData.consistency}
              currentStreak={currentStreak}
              hasData={sessionAudits.length > 0}
            />
          </div>

          {/* Column 2: Process Streak */}
          <div className="flex flex-col justify-between border border-slate-800/60 rounded-xl bg-black/10 p-5">
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Process Streak
              </span>
            </div>

            {sessionAudits.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6 my-auto">
                <span className="text-xs font-bold text-slate-400">No behavioral reviews completed</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                  Complete your first review to begin building your discipline profile.
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center my-auto py-2">
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-black text-white font-mono leading-none">{currentStreak}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Days</span>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Current Streak</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1">Longest Streak: {longestStreak} Days</span>
                
                <div className="w-full mt-6 space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Next Milestone: {nextMilestone} Days</span>
                    <span>{daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Remaining</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPct}%` }} 
                    />
                  </div>
                </div>
              </div>
            )}

            <p className="text-[9.5px] font-semibold text-slate-500 leading-relaxed mt-4 border-t border-slate-900 pt-3 text-center">
              Consistency compounds. Every reviewed session strengthens your behavioral profile.
            </p>
          </div>

          {/* Column 3: Behavioral Badges */}
          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
            {badgesList.map((badge) => {
              const isCompleted = badge.earned;
              const isInProgress = !badge.earned && (badge.progress ?? 0) > 0;
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "flex flex-col justify-between p-4 rounded-xl border min-h-[140px] transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500/[0.03] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-emerald-400"
                      : isInProgress
                      ? "bg-indigo-500/[0.02] border-indigo-500/20 text-indigo-400"
                      : "bg-slate-950/40 border-slate-900 text-slate-600"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "rounded-lg p-1.5 border",
                        isCompleted 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : isInProgress 
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                          : "bg-slate-900/50 border-slate-800 text-slate-600"
                      )}>
                        <Award className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black tracking-tight text-white leading-none">{badge.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold leading-tight mt-1">{badge.description}</p>
                      </div>
                    </div>
                    {isCompleted ? (
                      <span className="rounded-full bg-emerald-500/10 p-1 text-emerald-400 border border-emerald-500/10">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-900 p-1 text-slate-600 border border-slate-800">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      <span>{isCompleted ? "Completed" : isInProgress ? "In Progress" : "Locked"}</span>
                      <span>{badge.progress} / {badge.target}</span>
                    </div>
                    <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-slate-800/30">
                      <div 
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-500",
                          isCompleted ? "bg-emerald-500" : isInProgress ? "bg-indigo-500" : "bg-slate-850"
                        )}
                        style={{ width: `${((badge.progress ?? 0) / (badge.target ?? 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: BEHAVIORAL INSIGHTS */}
      <section className="rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md" style={{ borderColor: "var(--border-panel)" }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Behavioral Insights</h3>
            <p className="text-xs text-slate-400">Algorithmic analysis of your process adherence and psychological biases</p>
          </div>
        </div>

        <div className="space-y-3">
          {behavioralFlags.map((flag, idx) => {
            const isExpanded = expandedInsights[idx];
            const hasDetail = flag.trades.length > 0 || flag.ruleExplanation;
            
            // Determine priority details
            let borderClass = "border-slate-800 bg-slate-950/20";
            let textClass = "text-slate-400";
            let badgeText = "Positive Pattern";
            let badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10";
            let confidence = "95% Confidence";
            let evidence = "0 occurrences";

            if (flag.severity === "high") {
              borderClass = "border-red-500/20 bg-red-500/[0.02]";
              textClass = "text-red-400";
              badgeText = "Critical Behavioral Risk";
              badgeClass = "bg-red-500/10 text-red-400 border border-red-500/10";
              confidence = "88% Confidence";
              evidence = `${flag.trades.length} trades flagged`;
            } else if (flag.severity === "medium") {
              borderClass = "border-amber-500/20 bg-amber-500/[0.02]";
              textClass = "text-amber-400";
              badgeText = "Warning Pattern";
              badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/10";
              confidence = "78% Confidence";
              evidence = flag.type === "switching" ? flag.metrics?.sizeScaling ?? "3 setups" : `${flag.trades.length} trades flagged`;
            }

            return (
              <div 
                key={idx}
                className={cn(
                  "rounded-xl border transition-all duration-300 overflow-hidden",
                  borderClass
                )}
              >
                {/* Main Bar */}
                <div 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 cursor-pointer hover:bg-slate-900/10 transition"
                  onClick={() => {
                    if (hasDetail) {
                      setExpandedInsights(prev => ({ ...prev, [idx]: !prev[idx] }));
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5",
                      badgeClass
                    )}>
                      {badgeText}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{flag.label}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{flag.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 shrink-0">
                    <span>{confidence}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                    <span>{evidence}</span>
                    {hasDetail && (
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:underline ml-2">
                        {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetail && (
                  <div className="border-t border-slate-900 bg-black/40 p-4 space-y-4">
                    <div className="text-xs text-slate-300 leading-relaxed font-medium">
                      <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Methodology & Prevention:</span>
                      {flag.ruleExplanation}
                    </div>
                    
                    {flag.trades.length > 0 && (
                      <div>
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">Supporting Evidence (Flagged Trades):</span>
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#070a0e] text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="px-3 py-2">Symbol</th>
                                <th className="px-3 py-2">Direction</th>
                                <th className="px-3 py-2 text-right">P&L</th>
                                <th className="px-3 py-2 text-right">Lots</th>
                                <th className="px-3 py-2">Close Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-300">
                              {flag.trades.map((trade) => (
                                <tr key={trade.id} className="hover:bg-slate-900/20">
                                  <td className="px-3 py-2 font-bold">{trade.symbol}</td>
                                  <td className="px-3 py-2 uppercase font-bold text-[10px]">{trade.direction}</td>
                                  <td className={cn("px-3 py-2 text-right font-mono font-bold", (trade.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {fmtSignedUsd(trade.pnl)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono">{Number(trade.volume).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-slate-500 font-semibold">{fmtDateTime(trade.close_time)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: PERFORMANCE METRICS */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-850 bg-[#0f1318]/30 p-3 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Win Rate</span>
          <span className="text-base font-black text-white font-mono mt-1 block">{fmtPct(kpis.winRate, 1)}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-[#0f1318]/30 p-3 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Profit Factor</span>
          <span className="text-base font-black text-white font-mono mt-1 block">{kpis.profitFactor === Infinity ? "∞" : fmtNumber(kpis.profitFactor, 2)}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-[#0f1318]/30 p-3 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Trades</span>
          <span className="text-base font-black text-white font-mono mt-1 block">{kpis.trades}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-[#0f1318]/30 p-3 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Peak Drawdown</span>
          <span className="text-base font-black text-red-400 font-mono mt-1 block">{fmtPct(drawdown.maxDrawdownPct, 1)}</span>
        </div>
        <div className="rounded-xl border border-slate-850 bg-[#0f1318]/15 p-3 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Net P&L</span>
          <span className="text-base font-bold text-slate-300 font-mono mt-1 block">{fmtSignedUsd(kpis.netPnl)}</span>
        </div>
      </section>

      {/* SECTION 3: EQUITY CURVE (Hero Visual) */}
      <section className="rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md" style={{ borderColor: "var(--border-panel)" }}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Equity & Capital Progression</h3>
            <InfoTooltip text="Visual progression of your account equity. Select toggles to analyze performance." />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Behavior Overlay Checkboxes */}
            <div className="flex items-center gap-3 border-r border-slate-800 pr-4 mr-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={showDisciplineOverlay}
                  onChange={(e) => setShowDisciplineOverlay(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900/50 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <span>Overlay Discipline</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={showViolationsOverlay}
                  onChange={(e) => setShowViolationsOverlay(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900/50 text-red-500 focus:ring-0 cursor-pointer"
                />
                <span>Overlay Violations</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={showEmotionsOverlay}
                  onChange={(e) => setShowEmotionsOverlay(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900/50 text-orange-500 focus:ring-0 cursor-pointer"
                />
                <span>Overlay Emotions</span>
              </label>
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

                {(chartMode === "drawdown-overlay" || showDisciplineOverlay) && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(255,255,255,0.03)"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `${val}%`}
                    domain={showDisciplineOverlay && chartMode !== "drawdown-overlay" ? [0, 100] : ["dataMin", 0]}
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
                    const disciplineScoreVal = pPoint.disciplineScore;
                    const audit = pPoint.auditDetails;

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
                        {disciplineScoreVal !== null && (
                          <div className="flex items-center justify-between gap-6 border-t border-white/5 pt-1.5 mt-0.5">
                            <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">Discipline Score</span>
                            <span className="font-mono font-black text-white text-[11px]">{disciplineScoreVal}%</span>
                          </div>
                        )}
                        {audit && audit.emotional_states && audit.emotional_states.length > 0 && (
                          <div className="flex flex-col gap-0.5 border-t border-white/5 pt-1.5 mt-0.5">
                            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Emotions logged</span>
                            <span className="text-slate-350 font-medium text-[11px]">{audit.emotional_states.join(", ")}</span>
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

                {showDisciplineOverlay && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="disciplineScore"
                    stroke="#c084fc"
                    strokeWidth={2}
                    dot={false}
                    name="Discipline Score"
                    connectNulls
                  />
                )}

                {showViolationsOverlay && (
                  <Scatter
                    yAxisId="left"
                    dataKey="violationMarker"
                    fill="#ef4444"
                    name="Rule Violation"
                  />
                )}

                {showEmotionsOverlay && (
                  <Scatter
                    yAxisId="left"
                    dataKey="emotionMarker"
                    fill="#f97316"
                    name="Negative Emotion"
                  />
                )}
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

      <EvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerData.title}
        description={drawerData.description}
        ruleExplanation={drawerData.ruleExplanation}
        evidenceType={drawerData.evidenceType}
        tradesList={drawerData.tradesList}
        metrics={drawerData.metrics}
      />
    </div>
  );
}

