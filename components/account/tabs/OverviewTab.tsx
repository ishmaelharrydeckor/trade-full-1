// components/account/tabs/OverviewTab.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
  Settings,
  Play,
  Award,
  Clock,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import type { Account, Trade, AccountTransaction, Playbook, TradePlaybookEntry } from "@/types/database";
import { computeKpis, buildEquityCurve, computeCurrentEquity, computeDrawdown } from "@/lib/stats";
import { fmtSignedUsd, fmtCompactNumber, fmtDateTime, fmtPct, fmtNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import OpenPositionsPanel from "@/components/overview/OpenPositionsPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";

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
  const router = useRouter();
  const startingBalance = account.starting_balance ?? 0;

  // State
  const [otherAccounts, setOtherAccounts] = useState<{ id: string; name: string }[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [chartMode, setChartMode] = useState<"equity" | "balance" | "drawdown-overlay">("equity");

  // Load other accounts for the switcher
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("accounts")
      .select("id, name")
      .eq("archived", false)
      .then(({ data }) => {
        if (data) {
          setOtherAccounts(data.filter((a) => a.id !== account.id));
        }
      });
  }, [account.id]);

  // Calculations
  const kpis = useMemo(() => computeKpis(trades), [trades]);
  const equityCurve = useMemo(
    () => buildEquityCurve(trades, transactions, startingBalance),
    [trades, transactions, startingBalance]
  );
  const currentEquity = useMemo(
    () => computeCurrentEquity(trades, transactions, startingBalance),
    [trades, transactions, startingBalance]
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
    for (const t of trades) {
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
    for (const t of trades) {
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
    const recentMindsets = trades
      .slice(0, 15)
      .map((t) => t.mindset?.toLowerCase() ?? "")
      .filter(Boolean);

    if (recentMindsets.some((m) => m.includes("fomo") || m.includes("impatient"))) {
      behaviorTags.push("FOMO Trigger");
    }
    if (recentMindsets.some((m) => m.includes("greed") || m.includes("overtrade"))) {
      behaviorTags.push("Over-Leveraging");
    }
    if (recentMindsets.some((m) => m.includes("revenge") || m.includes("frustrated"))) {
      behaviorTags.push("Revenge Risk");
    }
    if (kpis.worstStreak > 3) {
      behaviorTags.push("Tilt Susceptibility");
    }
    if (behaviorTags.length === 0) {
      behaviorTags.push("Disciplined Execution");
    }

    return {
      disciplineScore,
      executionStreak: finalStreak,
      tags: behaviorTags.slice(0, 3),
    };
  }, [trades, playbooks, playbookEntries, kpis]);

  // Equity Curve calculations for visual chart
  const processedEquityCurve = useMemo(() => {
    let peak = startingBalance;
    return equityCurve.map((point) => {
      if (point.equity > peak) peak = point.equity;
      const ddPct = peak > 0 ? -((peak - point.equity) / peak) * 100 : 0;
      return {
        ...point,
        balance: point.equity, // default base
        drawdown: Math.round(ddPct * 100) / 100,
      };
    });
  }, [equityCurve, startingBalance]);

  // Drawdown Area chart data
  const drawdownChartData = useMemo(() => {
    let peak = startingBalance;
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
  }, [equityCurve, startingBalance]);

  // SVG parameters for radial gauge (Section 2)
  const scoreSize = 100;
  const scoreStroke = 8;
  const scoreRadius = (scoreSize - scoreStroke) / 2;
  const scoreCircumference = scoreRadius * 2 * Math.PI;
  const scoreOffset = scoreCircumference - (coreInsights.disciplineScore / 100) * scoreCircumference;

  return (
    <div className="flex flex-col gap-6">
      <OpenPositionsPanel accountId={account.id} />

      {/* TOP NAVIGATION BAR */}
      <div className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between w-full" 
        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center justify-between w-full sm:w-auto gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 border border-white/5"
          >
            <span>{account.name}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          
          {showAccountDropdown && otherAccounts.length > 0 && (
            <div className="absolute left-0 mt-2 z-50 w-full sm:w-56 rounded-xl border bg-black/90 p-1.5 shadow-2xl backdrop-blur-md"
              style={{ borderColor: "var(--border-panel)" }}>
              {otherAccounts.map((act) => (
                <button
                  key={act.id}
                  onClick={() => {
                    setShowAccountDropdown(false);
                    router.push(`/dashboard/accounts/${act.id}`);
                  }}
                  className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-indigo-600 hover:text-white transition"
                >
                  {act.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href={`/dashboard/accounts/${account.id}/backtest`}
            className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 shadow-md shadow-indigo-500/10"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>Launch Backtester</span>
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("tradefull:gototab", { detail: "account" }))}
            className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: KEY PERFORMANCE STRIP */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Net P&L Card */}
        <div className="group rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <Coins className="h-3.5 w-3.5 text-indigo-400" />
            <span>Net P&L</span>
          </div>
          <div className={cn(
            "mt-2 text-2xl font-black tracking-tight",
            kpis.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {fmtSignedUsd(kpis.netPnl)}
          </div>
          <div className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {account.currency} account term
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="group rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            <span>Win rate</span>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-white">
            {fmtPct(kpis.winRate, 1)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-400">
            {kpis.winners} winners · {kpis.losers} losers
          </div>
        </div>

        {/* Profit Factor Card */}
        <div className="group rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Profit factor</span>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-white">
            {kpis.profitFactor === Infinity ? "∞" : fmtNumber(kpis.profitFactor, 2)}
          </div>
          <div className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Ratio: Gross Win/Loss
          </div>
        </div>

        {/* Total Trades Card */}
        <div className="group rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <Activity className="h-3.5 w-3.5 text-orange-400" />
            <span>Total trades</span>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-white">
            {kpis.trades}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Closed positions logged
          </div>
        </div>

        {/* Streaks Card */}
        <div className="group rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Best/Worst Streak</span>
          </div>
          <div className="mt-2 text-xl font-black tracking-tight text-white">
            {kpis.bestStreak}W / <span className="text-red-400">{kpis.worstStreak}L</span>
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-slate-400">
            Consecutive segments
          </div>
        </div>
      </section>

      {/* SECTION 2: CORE INSIGHTS (Discipline Gauge, Streak, Behavioral Tags) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Discipline score radial gauge */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border p-6 text-center"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            Discipline Score
          </span>
          <div className="relative mt-4 flex items-center justify-center">
            <svg width={scoreSize} height={scoreSize} className="-rotate-90">
              <circle
                cx={scoreSize / 2}
                cy={scoreSize / 2}
                r={scoreRadius}
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
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
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="insightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{coreInsights.disciplineScore}%</span>
            </div>
          </div>
          <span className="mt-3 text-xs font-semibold text-slate-400">Rule Compliance Rating</span>
        </div>

        {/* Execution Streak */}
        <div className="group relative flex flex-col items-center justify-center rounded-2xl border p-6 text-center"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Execution Streak
          </span>
          <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
            <Flame className="h-8 w-8 fill-orange-500/20" />
          </div>
          <h3 className="mt-3 text-2xl font-extrabold text-white">{coreInsights.executionStreak} Sessions</h3>
          <span className="text-xs font-semibold text-slate-400">Consecutive disciplined actions</span>
        </div>

        {/* Behavioral Insights */}
        <div className="group relative flex flex-col justify-center rounded-2xl border p-6"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
          <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-indigo-400" />
            Behavioral Insights
          </span>
          <div className="mt-4 flex flex-col gap-2.5">
            {coreInsights.tags.map((tag, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition",
                  tag === "Disciplined Execution" 
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                    : "bg-indigo-500/5 border-indigo-500/10 text-indigo-300"
                )}
              >
                <span>{tag}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: EQUITY CURVE (Hero Visual) */}
      <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Equity & Capital Progression</h3>
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
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  chartMode === mode.id
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="h-80 min-w-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedEquityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                
                <CartesianGrid stroke="var(--border-panel)" strokeDasharray="3 3" vertical={false} />
                
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
                  stroke="rgba(255,255,255,0.05)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  minTickGap={40}
                />
                
                <YAxis
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.05)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(val) => fmtCompactNumber(val)}
                  domain={["auto", "auto"]}
                />

                {chartMode === "drawdown-overlay" && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(255,255,255,0.05)"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `${val}%`}
                    domain={["dataMin", 0]}
                  />
                )}

                {startingBalance > 0 && (
                  <ReferenceLine
                    yAxisId="left"
                    y={startingBalance}
                    stroke="#475569"
                    strokeDasharray="4 4"
                  />
                )}

                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.85)",
                    borderColor: "var(--border-panel)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    backdropFilter: "blur(4px)",
                  }}
                  labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                  labelFormatter={(label) => fmtDateTime(label as string)}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === "drawdown") return [`${value}%`, "Drawdown"];
                    return [fmtSignedUsd(value as number), name === "balance" ? "Balance" : "Equity"];
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
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#eqGrad)"
                  name="equity"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 4: DRAWDOWN VISUALIZATION */}
      <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <h3 className="text-lg font-bold text-white">Drawdown Profile</h3>
            <InfoTooltip text="Drawdown percentage from account high-water mark." />
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>
              Peak Drawdown:{" "}
              <span className="font-mono font-bold text-red-400">{fmtPct(drawdown.maxDrawdownPct, 1)}</span>
              {" "}({fmtSignedUsd(-drawdown.maxDrawdownAbs)})
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="h-44 min-w-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-panel)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="rgba(255,255,255,0.05)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  minTickGap={40}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.05)"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(val) => `${val}%`}
                  domain={["dataMin", 0]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.85)",
                    borderColor: "var(--border-panel)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Drawdown"]}
                  labelFormatter={(label) => fmtDateTime(label as string)}
                />
                <ReferenceLine y={-5} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />
                <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} />
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

        <div className="mt-4 border-t border-white/5 pt-3 text-[11px] font-medium text-slate-400">
          <span className="text-red-400 font-bold">Risk Awareness:</span> Keeping drawdown under 10% ensures long-term compounding. Restrict lot sizes if your drawdown violates pre-set rules.
        </div>
      </section>

      {/* SECTION 5: RECENT TRADES */}
      <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-panel)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Trade Logs</h3>
          {trades.length > 5 && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("tradefull:gototab", { detail: "trades" }))}
              className="text-xs font-extrabold text-indigo-400 hover:underline"
            >
              All Trades ({trades.length}) →
            </button>
          )}
        </div>

        {trades.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
            No trades completed yet. Update MetaTrader sync or add manually.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
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
              <tbody className="divide-y divide-white/5">
                {trades.slice(0, 5).map((t) => {
                  const isLong = t.direction === "long";
                  const pnlVal = t.pnl ?? 0;
                  const isWin = pnlVal > 0;
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.01] transition-colors text-white">
                      <td className="px-4 py-3 font-bold">{t.symbol}</td>
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
                      <td className="px-4 py-3 text-xs font-semibold text-slate-400">{fmtDateTime(t.close_time)}</td>
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
