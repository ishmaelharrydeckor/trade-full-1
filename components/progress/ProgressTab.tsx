"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Target, CheckCircle, XCircle, Plus, Calendar } from "lucide-react";
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
  const violatedCount = autoViolations.size;
  const manualHabits = habits.filter((h) => !h.is_automated);
  const score = totalHabits > 0
    ? Math.round(((completedCount) / totalHabits) * 100)
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

  // Compute streaks
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

  return (
    <div className="space-y-6">
      {/* Today's checklist */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h3 className="font-serif text-lg">Today&apos;s Discipline</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Score</div>
              <div className={cn("text-xl font-semibold tabular-nums", score >= 80 ? "text-emerald-300" : score >= 50 ? "text-amber-300" : "text-red-300")}>
                {score}%
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowManager(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
            >
              Manage habits
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
            <Target className="mx-auto mb-2 h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">No habits defined yet.</p>
            <button type="button" onClick={() => setShowManager(true)} className="mt-3 text-sm text-blue-400 hover:underline">
              Set up your daily checklist
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {habits.map((habit) => {
              const isCompleted = todayCompleted.has(habit.id);
              const isViolated = autoViolations.has(habit.id);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => !habit.is_automated && toggleHabit(habit.id)}
                  disabled={habit.is_automated || saving}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                    isCompleted && !isViolated ? "bg-emerald-500/10" : isViolated ? "bg-red-500/10" : "hover:bg-white/5",
                    habit.is_automated && "cursor-default"
                  )}
                >
                  {isViolated ? (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
                  )}
                  <span className={cn(isCompleted && !isViolated ? "text-emerald-300" : isViolated ? "text-red-300" : "text-slate-300")}>
                    {habit.name}
                  </span>
                  {habit.is_automated && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-600">auto</span>
                  )}
                  {habit.category !== "trading" && (
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">{habit.category}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center backdrop-blur">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Current streak</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-300">{streak.current}d</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center backdrop-blur">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Best streak</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{streak.best}d</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center backdrop-blur">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg score</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.score ?? 0), 0) / logs.length) : 0}%
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <DisciplineHeatmap logs={logs} />

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
