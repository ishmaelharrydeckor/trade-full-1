// components/account/tabs/AnalyticsTab.tsx
"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  aggregateByAssetClass,
  aggregateBySymbol,
  aggregateByWeekday,
  aggregateByHour,
  aggregateByDirection,
  aggregateByMindset,
  aggregateByTags,
  aggregateBySession,
} from "@/lib/analytics";
import AnalyticsBarChart from "@/components/analytics/AnalyticsBarChart";
import AnalyticsDonutChart from "@/components/analytics/AnalyticsDonutChart";
import AnalyticsHorizontalBarChart from "@/components/analytics/AnalyticsHorizontalBarChart";
import AnalyticsAreaChart from "@/components/analytics/AnalyticsAreaChart";
import AnalyticsRadarChart from "@/components/analytics/AnalyticsRadarChart";
import RMultipleChart from "@/components/analytics/RMultipleChart";
import MoodPerformanceChart from "@/components/analytics/MoodPerformanceChart";
import type { Account, Trade, JournalEntry, SessionAudit } from "@/types/database";
import { computeMoodPerformance } from "@/lib/behavioral-engine";
import { generateLongitudinalInsights, generateTraderProfile } from "@/lib/habit-loop";
import { ThumbsUp, ThumbsDown, BrainCircuit, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsTab({
  account,
  trades,
  journalEntries = [],
  sessionAudits = [],
}: {
  account: Account;
  trades: Trade[];
  journalEntries?: JournalEntry[];
  sessionAudits?: SessionAudit[];
}) {
  const byAssetClass = useMemo(() => aggregateByAssetClass(trades), [trades]);
  const bySymbol     = useMemo(() => aggregateBySymbol(trades), [trades]);
  const byWeekday    = useMemo(() => aggregateByWeekday(trades), [trades]);
  const byHour       = useMemo(() => aggregateByHour(trades), [trades]);
  const byDirection  = useMemo(() => aggregateByDirection(trades), [trades]);
  const byMindset    = useMemo(() => aggregateByMindset(trades), [trades]);
  const byTags       = useMemo(() => aggregateByTags(trades), [trades]);
  const bySession    = useMemo(() => aggregateBySession(trades), [trades]);
  const moodData     = useMemo(() => computeMoodPerformance(trades, journalEntries), [trades, journalEntries]);
  const longitudinalInsights = useMemo(() => generateLongitudinalInsights(sessionAudits, trades), [sessionAudits, trades]);
  const traderProfile = useMemo(() => generateTraderProfile(sessionAudits), [sessionAudits]);

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}>
        <BarChart3 className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-2xl font-bold tracking-tight">Analytics need trades to chew on</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Once you've added or imported some trades, this tab fills with charts
          showing your edge by pair, time of day, mindset, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Process & Psychological Profile Hub */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Longitudinal Patterns Card */}
        <div 
          className="flex flex-col rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Longitudinal Behavioral Insights</h3>
              <p className="text-[10px] text-slate-500 font-medium">Correlational patterns tracking emotional and setup deviations</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-3 justify-center">
            {longitudinalInsights.length === 0 ? (
              <div className="text-xs font-semibold text-slate-500 text-center py-6">
                Log at least 3 completed session audits to generate behavioral pattern correlations.
              </div>
            ) : (
              longitudinalInsights.map((insight, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border text-xs font-bold leading-relaxed",
                    insight.type === "warning"
                      ? "bg-red-500/5 border-red-500/10 text-red-400"
                      : insight.type === "positive"
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                      : "bg-slate-900/40 border-slate-800/80 text-slate-400"
                  )}
                >
                  {insight.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  ) : insight.type === "positive" ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <HelpCircle className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                  )}
                  <span>{insight.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evolved Trader Profile Card */}
        <div 
          className="flex flex-col rounded-2xl border p-5 bg-[#0f1318]/60 backdrop-blur-md"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Trader Process Profile</h3>
              <p className="text-[10px] text-slate-500 font-medium">Strengths and weaknesses calculated from rule compliance checklists</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Strengths */}
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <ThumbsUp className="h-3.5 w-3.5" />
                Strengths
              </span>
              <div className="space-y-1.5">
                {traderProfile.strengths.map((str, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-300">
                    <span className="text-emerald-500 font-extrabold select-none">•</span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <ThumbsDown className="h-3.5 w-3.5" />
                Weaknesses
              </span>
              <div className="space-y-1.5">
                {traderProfile.weaknesses.map((weak, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-300">
                    <span className="text-rose-500 font-extrabold select-none">•</span>
                    <span>{weak}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ratio Metrics: Donuts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <AnalyticsDonutChart
          title="By Trading Session"
          subtitle="NY, London, Asian, Sydney (UTC) trade distribution"
          data={bySession}
        />
        <AnalyticsDonutChart
          title="By Asset Class"
          subtitle="Forex, crypto, indices, etc. distribution"
          data={byAssetClass}
        />
        <AnalyticsDonutChart
          title="By Direction"
          subtitle="Long vs short distribution"
          data={byDirection}
        />
      </div>

      {/* High-density Symbol Performance */}
      <div className="w-full">
        <AnalyticsHorizontalBarChart
          title="By Symbol"
          subtitle="Your top 12 instruments by absolute P&L"
          data={bySymbol}
          maxItems={12}
        />
      </div>

      {/* Cyclical Performance: Day & Hour */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnalyticsRadarChart
          title="By Day of Week"
          subtitle="Weekly performance curve"
          data={byWeekday}
        />
        <AnalyticsAreaChart
          title="By Hour of Day"
          subtitle="Session timing trends (local time)"
          data={byHour}
        />
      </div>

      {/* User-defined Metadata: Mindset & Tags */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnalyticsBarChart
          title="By Mindset"
          subtitle="Emotional state during entry"
          data={byMindset}
          emptyMessage="Tag your trades with a mindset (focused / rushed / fomo / etc.) to see this breakdown."
        />
        <AnalyticsBarChart
          title="By Tag"
          subtitle="Your custom tags ranked by P&L"
          data={byTags}
          emptyMessage="Add tags to your trades (e.g. 'breakout', 'london', 'news') to see this breakdown."
        />
      </div>

      {/* Mood performance correlation */}
      <div className="w-full">
        <MoodPerformanceChart data={moodData} />
      </div>

      {/* Risk Distribution */}
      <div className="w-full">
        <RMultipleChart trades={trades} />
      </div>
    </div>
  );
}

