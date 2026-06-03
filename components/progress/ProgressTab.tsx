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
      <div
        className="rounded-xl p-5 backdrop-blur"
        style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: 'var(--positive)' }} />
            <h3 className="text-lg font-bold">Today&apos;s Discipline</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Score</div>
              <div
                className="text-xl font-bold tabular-nums"
                style={{
                  color: score >= 80 ? 'var(--positive)' : score >= 50 ? 'var(--warning)' : 'var(--negative)'
                }}
              >
                {score}%
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowManager(true)}
              className="tj-btn-secondary px-3 py-1.5 text-xs"
            >
              Manage habits
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div
            className="rounded-xl border-dashed p-8 text-center"
            style={{ border: '1px dashed var(--app-muted)', backgroundColor: 'var(--app-elevated)' }}
          >
            <Target className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No habits defined yet.</p>
            <button type="button" onClick={() => setShowManager(true)} className="mt-3 text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>
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
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                    habit.is_automated && "cursor-default"
                  )}
                  style={{
                    backgroundColor: isCompleted && !isViolated
                      ? 'color-mix(in srgb, var(--positive) 10%, transparent)'
                      : isViolated
                        ? 'color-mix(in srgb, var(--negative) 10%, transparent)'
                        : 'transparent',
                    color: isCompleted && !isViolated
                      ? 'var(--positive)'
                      : isViolated
                        ? 'var(--negative)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {isViolated ? (
                    <XCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--negative)' }} />
                  ) : isCompleted ? (
                    <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--positive)' }} />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full" style={{ border: '1px solid var(--app-muted)' }} />
                  )}
                  <span>{habit.name}</span>
                  {habit.is_automated && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>auto</span>
                  )}
                  {habit.category !== "trading" && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-muted)' }}
                    >
                      {habit.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-xl p-4 text-center backdrop-blur"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current streak</div>
          <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--positive)' }}>{streak.current}d</div>
        </div>
        <div
          className="rounded-xl p-4 text-center backdrop-blur"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Best streak</div>
          <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{streak.best}d</div>
        </div>
        <div
          className="rounded-xl p-4 text-center backdrop-blur"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Avg score</div>
          <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
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
