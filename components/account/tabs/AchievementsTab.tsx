// components/account/tabs/AchievementsTab.tsx
"use client";

import { useMemo } from "react";
import { Trophy, Award, CheckCircle, Lock, Calendar, Flame, ShieldAlert } from "lucide-react";
import type { SessionAudit } from "@/types/database";
import { evaluateBadges, calculateStreaks } from "@/lib/habit-loop";
import { cn } from "@/lib/utils";

export default function AchievementsTab({
  sessionAudits = [],
}: {
  sessionAudits?: SessionAudit[];
}) {
  const badgesList = useMemo(() => evaluateBadges(sessionAudits), [sessionAudits]);
  const { currentStreak, longestStreak } = useMemo(() => calculateStreaks(sessionAudits), [sessionAudits]);

  const earnedCount = useMemo(() => {
    return badgesList.filter((b) => b.earned).length;
  }, [badgesList]);

  const averageCompliance = useMemo(() => {
    if (sessionAudits.length === 0) return 0;
    const sum = sessionAudits.reduce((s, a) => s + a.execution_score, 0);
    return Math.round(sum / sessionAudits.length);
  }, [sessionAudits]);

  return (
    <div className="space-y-6">
      {/* Achievements Hero Banner */}
      <div 
        className="rounded-2xl border p-6 bg-gradient-to-r from-slate-900/60 to-indigo-950/20 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{ borderColor: "var(--border-panel)" }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Achievements & Milestones</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Process is the priority. Collect milestones by maintaining review streaks, respecting risk limits, and logging emotional awareness daily.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 shrink-0 w-full md:w-auto">
          <div className="rounded-xl bg-black/30 border border-slate-800/80 p-3 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Badges Earned</span>
            <span className="text-lg font-black text-white font-mono mt-0.5">{earnedCount} / {badgesList.length}</span>
          </div>
          <div className="rounded-xl bg-black/30 border border-slate-800/80 p-3 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Best Streak</span>
            <span className="text-lg font-black text-orange-400 font-mono mt-0.5">{longestStreak} Days</span>
          </div>
          <div className="rounded-xl bg-black/30 border border-slate-800/80 p-3 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Avg Compliance</span>
            <span className="text-lg font-black text-sky-400 font-mono mt-0.5">{averageCompliance}%</span>
          </div>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {badgesList.map((badge) => {
          const isCompleted = badge.earned;
          const isInProgress = !badge.earned && (badge.progress ?? 0) > 0;
          return (
            <div
              key={badge.id}
              className={cn(
                "flex flex-col justify-between p-6 rounded-2xl border min-h-[160px] transition-all duration-300",
                isCompleted
                  ? "bg-emerald-500/[0.02] border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.04)]"
                  : isInProgress
                  ? "bg-indigo-500/[0.02] border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.02)]"
                  : "bg-slate-950/20 border-slate-900"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "rounded-xl p-3 border shrink-0",
                    isCompleted 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : isInProgress 
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                      : "bg-slate-900/50 border-slate-800 text-slate-600"
                  )}>
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-black tracking-tight text-white leading-tight">{badge.name}</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{badge.description}</p>
                  </div>
                </div>

                {isCompleted ? (
                  <span className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/10">
                    <CheckCircle className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-900 p-1.5 text-slate-600 border border-slate-800">
                    <Lock className="h-4 w-4" />
                  </span>
                )}
              </div>

              {/* Progress Bar Container */}
              <div className="mt-5 pt-3 border-t border-slate-900/30">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <span>Status: {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Locked"}</span>
                  <span>{badge.progress} / {badge.target}</span>
                </div>
                <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden border border-slate-800/30">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      isCompleted ? "bg-emerald-500" : isInProgress ? "bg-indigo-500" : "bg-slate-800"
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
  );
}
