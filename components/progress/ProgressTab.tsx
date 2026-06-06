"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Target, CheckCircle, XCircle, Plus, Calendar, Flame, Trophy, Award, TrendingUp, TrendingDown, HelpCircle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DailyHabit, DailyLog, Trade } from "@/types/database";
import { tradeNetPnl } from "@/lib/stats";
import { cn } from "@/lib/utils";
import HabitManager from "./HabitManager";
import DisciplineHeatmap from "./DisciplineHeatmap";

export default function ProgressTab({
  accountId,
  habits: initialHabits,
  logs: initialLogs,
  trades,
}: {
  accountId: string;
  habits: DailyHabit[];
  logs: DailyLog[];
  trades: Trade[];
}) {
  const router = useRouter();
  const [habits, setHabits] = useState(initialHabits.filter((h) => !h.archived));
  const [logs, setLogs] = useState(initialLogs);
  const [showManager, setShowManager] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.log_date === today);
  const todayCompleted = new Set(todayLog?.habits_completed ?? []);

  // Auto-check automated rules
  const todayTrades = useMemo(() => {
    return trades.filter((t) => {
      const d = new Date(t.close_time ?? t.open_time);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return dateStr === today;
    });
  }, [trades, today]);

  const autoViolations = useMemo(() => {
    const violated: string[] = [];
    for (const habit of habits) {
      if (!habit.is_automated || !habit.auto_rule) continue;
      const rule = habit.auto_rule as { type: string; value: number };
      if (rule.type === "max_trades" && todayTrades.length > rule.value) {
        violated.push(habit.id);
      } else if (rule.type === "max_loss") {
        const totalLoss = todayTrades.reduce((s, t) => {
          const net = tradeNetPnl(t);
          return net < 0 ? s + net : s;
        }, 0);
        if (totalLoss < -Math.abs(rule.value)) violated.push(habit.id);
      } else if (rule.type === "always_stop_loss") {
        const noSL = todayTrades.some((t) => t.stop_loss == null);
        if (noSL) violated.push(habit.id);
      }
    }
    return new Set(violated);
  }, [habits, todayTrades]);

  const totalHabits = habits.length;
  const completedCount = todayCompleted.size;
  const score = totalHabits > 0
    ? Math.round((completedCount / totalHabits) * 100)
    : 0;

  async function toggleHabit(habitId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newCompleted = todayCompleted.has(habitId)
      ? Array.from(todayCompleted).filter((id) => id !== habitId)
      : [...Array.from(todayCompleted), habitId];

    const newScore = totalHabits > 0 ? Math.round((newCompleted.length / totalHabits) * 100) : 0;

    const payload = {
      user_id: user.id,
      account_id: accountId,
      log_date: today,
      habits_completed: newCompleted,
      habits_violated: Array.from(autoViolations),
      score: newScore,
    };

    setSaving(true);
    if (todayLog) {
      await supabase.from("daily_logs").update(payload).eq("id", todayLog.id);
      setLogs((prev) => prev.map((l) => l.id === todayLog.id ? { ...l, ...payload } as DailyLog : l));
    } else {
      const { data } = await supabase.from("daily_logs").upsert(payload, { onConflict: "account_id,log_date" }).select().single();
      if (data) setLogs((prev) => [data as DailyLog, ...prev]);
    }
    setSaving(false);
    router.refresh();
  }

  // Compute overall streaks
  const streak = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
    let current = 0;
    let best = 0;
    let tempStreak = 0;
    const todayMs = new Date(today).getTime();

    for (let i = 0; i < sortedLogs.length; i++) {
      const logMs = new Date(sortedLogs[i].log_date).getTime();
      const dayDiff = Math.round((todayMs - logMs) / (1000 * 60 * 60 * 24));
      if (dayDiff === i && (sortedLogs[i].score ?? 0) >= 60) {
        tempStreak++;
        if (i < sortedLogs.length) current = tempStreak;
      } else {
        break;
      }
    }
    // Best streak from all logs
    tempStreak = 0;
    const allDates = [...logs].sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
    for (let i = 0; i < allDates.length; i++) {
      if ((allDates[i].score ?? 0) >= 60) {
        tempStreak++;
        if (tempStreak > best) best = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    return { current, best };
  }, [logs, today]);

  // Compute habit streaks dynamically from logs
  const habitStreaks = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
    const streaks: Record<string, number> = {};

    for (const habit of habits) {
      let currentStreak = 0;
      for (const log of sortedLogs) {
        const completed = log.habits_completed?.includes(habit.id);
        if (completed) {
          currentStreak++;
        } else {
          currentStreak = 0;
        }
      }
      streaks[habit.id] = currentStreak;
    }
    return streaks;
  }, [logs, habits]);

  // Weekly Trend calculation
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const currentWeekStart = new Date(now.getTime() - 7 * oneDay).getTime();
    const priorWeekStart = new Date(now.getTime() - 14 * oneDay).getTime();

    const currentWeekScores = logs
      .filter((l) => new Date(l.log_date).getTime() >= currentWeekStart)
      .map((l) => l.score ?? 0);

    const priorWeekScores = logs
      .filter((l) => {
        const t = new Date(l.log_date).getTime();
        return t >= priorWeekStart && t < currentWeekStart;
      })
      .map((l) => l.score ?? 0);

    const currentAvg = currentWeekScores.length > 0
      ? currentWeekScores.reduce((a, b) => a + b, 0) / currentWeekScores.length
      : 0;

    const priorAvg = priorWeekScores.length > 0
      ? priorWeekScores.reduce((a, b) => a + b, 0) / priorWeekScores.length
      : 0;

    const diff = Math.round(currentAvg - priorAvg);
    return {
      currentAvg,
      priorAvg,
      diff,
    };
  }, [logs]);

  // Subtle Encouragement Message
  const encouragement = useMemo(() => {
    if (score >= 80) {
      return {
        text: "Flawless execution! Compounding discipline drives long-term capital growth.",
        color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
      };
    }
    if (score >= 50) {
      return {
        text: "Solid focus. Stick closely to your rules; execution is more important than outcome.",
        color: "text-amber-400 bg-amber-500/5 border-amber-500/10",
      };
    }
    return {
      text: "Every trade is a statistical sample. Scale back sizes, control risk, and stick to playbook parameters.",
      color: "text-red-400 bg-red-500/5 border-red-500/10",
    };
  }, [score]);

  // SVG Gauge calculations
  const gaugeSize = 150;
  const strokeWidth = 10;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeOffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: DISCIPLINE SCORE (CIRCULAR GAUGE & TREND) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Circular Gauge */}
        <div 
          className="md:col-span-2 rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div className="space-y-3 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-400" />
              Consistency metrics
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight">Today&apos;s Execution Quality</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Your score is based on automated rule tracking and manually toggled checklist parameters. Focus on flawless adherence.
            </p>
            
            {/* Encouragement message banner */}
            <div className={cn("mt-4 p-3 rounded-xl border text-xs font-semibold leading-relaxed transition-all duration-300", encouragement.color)}>
              {encouragement.text}
            </div>
          </div>

          <div className="relative flex items-center justify-center shrink-0">
            <svg width={gaugeSize} height={gaugeSize} className="-rotate-90">
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.02)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="transparent"
                stroke="url(#progressDonutGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="progressDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono">{score}%</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">DISCIPLINE</span>
            </div>
          </div>
        </div>

        {/* Weekly Trend Indicator Card */}
        <div 
          className="rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-6 flex flex-col justify-between"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Weekly performance
            </span>
            <h4 className="text-sm font-bold text-slate-300 mt-3">Trend vs Last Week</h4>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-mono font-black text-white">
              {weeklyTrend.diff >= 0 ? "+" : ""}{weeklyTrend.diff}%
            </span>
            {weeklyTrend.diff >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400 shrink-0" />
            )}
          </div>

          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-normal">
            Weekly Avg: {Math.round(weeklyTrend.currentAvg)}% vs prior period {Math.round(weeklyTrend.priorAvg)}%. 
            {weeklyTrend.diff >= 0 ? " You are building momentum!" : " Stay committed to your checklist."}
          </p>
        </div>
      </div>

      {/* SECTION 2: HABIT TRACKER (ACCORDION & INDIVIDUAL STREAKS) */}
      <div 
        className="rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-6"
        style={{ borderColor: "var(--border-panel)" }}
      >
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Daily Speculative Checklist</h3>
            <p className="text-xs text-slate-400 mt-1">Consistency creates habits. Toggles register your discipline score for today.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowManager(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-black/20 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors self-start sm:self-center"
          >
            <Plus className="h-3.5 w-3.5" /> Manage Habits
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/[0.04] p-10 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm font-medium text-slate-400">No trading habits set up yet.</p>
            <button 
              type="button" 
              onClick={() => setShowManager(true)} 
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-400 hover:underline"
            >
              Configure standard checklist items <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {habits.map((habit) => {
              const isCompleted = todayCompleted.has(habit.id);
              const isViolated = autoViolations.has(habit.id);
              const habitStreak = habitStreaks[habit.id] ?? 0;

              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => !habit.is_automated && toggleHabit(habit.id)}
                  disabled={habit.is_automated || saving}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-300",
                    isCompleted && !isViolated
                      ? "bg-emerald-500/[0.02] border-emerald-500/20 text-emerald-400"
                      : isViolated
                        ? "bg-red-500/[0.02] border-red-500/20 text-red-400"
                        : "border-slate-800/80 bg-black/10 text-slate-300 hover:border-slate-700 hover:bg-[#141a22]/10"
                  )}
                >
                  {/* Left checklist label */}
                  <div className="flex items-center gap-3">
                    {isViolated ? (
                      <XCircle className="h-5 w-5 shrink-0 text-red-500 animate-pulse" />
                    ) : isCompleted ? (
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                      <div className="h-5 w-5 shrink-0 rounded-full border border-slate-700 bg-black/40 group-hover:border-slate-500" />
                    )}
                    <div>
                      <span className="font-semibold text-xs text-white">{habit.name}</span>
                      {habit.is_automated && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-slate-900 border border-slate-800 text-slate-500">
                          Automated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right gamified Streak counter */}
                  {habitStreak > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-400/90 font-mono">
                      <Flame className="h-3.5 w-3.5 fill-orange-500/20 animate-pulse text-orange-500" />
                      <span>{habitStreak} Session Streak</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: STREAK METRICS MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Current Streak */}
        <div 
          className="rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-5 text-center flex flex-col justify-between min-h-[120px]"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
            Current consistency streak
          </span>
          <div className="text-3xl font-black font-mono text-orange-400 mt-2">
            {streak.current} Days
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            Required score &ge; 60% daily
          </span>
        </div>

        {/* Best Streak */}
        <div 
          className="rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-5 text-center flex flex-col justify-between min-h-[120px]"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            Personal high record
          </span>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {streak.best} Days
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            All-time consistency peak
          </span>
        </div>

        {/* Avg Discipline Score */}
        <div 
          className="rounded-2xl border bg-[#0f1318]/60 backdrop-blur-md p-5 text-center flex flex-col justify-between min-h-[120px]"
          style={{ borderColor: "var(--border-panel)" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-1.5">
            <Award className="h-4 w-4 text-indigo-400" />
            Average execution score
          </span>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.score ?? 0), 0) / logs.length) : 0}%
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            Calculated across {logs.length} logs
          </span>
        </div>

      </div>

      {/* SECTION 4: HEATMAP VISUALIZATION */}
      <DisciplineHeatmap logs={logs} />

      {/* Habit Manager Modal overlay */}
      {showManager && (
        <HabitManager
          accountId={accountId}
          habits={habits}
          onClose={() => { setShowManager(false); router.refresh(); }}
          onUpdate={setHabits}
        />
      )}
    </div>
  );
}
