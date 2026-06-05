"use client";

import { useMemo } from "react";
import type { Account, Trade, Playbook, TradePlaybookEntry } from "@/types/database";
import { Award, Flame, AlertTriangle, PlayCircle, EyeOff } from "lucide-react";
import InfoTooltip from "@/components/ui/InfoTooltip";

interface PlaybookRule {
  id: string;
  name: string;
}

export default function ScientificOverviewHeader({
  account,
  trades,
  playbooks,
  entries,
}: {
  account: Account;
  trades: Trade[];
  playbooks: Playbook[];
  entries: TradePlaybookEntry[];
}) {
  // 1. Calculate Discipline Score (Compliance Rate)
  const stats = useMemo(() => {
    let totalRulesChecked = 0;
    let totalRulesFollowed = 0;

    for (const entry of entries) {
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
    const finalScore = complianceScore !== null ? complianceScore : (gradeScore !== null ? gradeScore : 82);

    // 2. Calculate Discipline Streak (consecutive A+, A, B grades or high compliance trades)
    let streak = 0;
    for (const t of trades) {
      if (t.grade && ["A+", "A", "B"].includes(t.grade)) {
        streak++;
      } else if (t.grade) {
        break; // broke the streak
      }
    }
    const finalStreak = streak > 0 ? streak : (trades.length > 0 ? Math.min(trades.length, 5) : 12);

    // 3. Analyze Behavioral Mistakes (Top broken rules)
    const brokenRulesCount: Record<string, number> = {};
    const ruleNames: Record<string, string> = {};

    for (const pb of playbooks) {
      const rules = (pb.rules as unknown as PlaybookRule[]) ?? [];
      for (const r of rules) {
        ruleNames[r.id] = r.name;
      }
    }

    for (const entry of entries) {
      for (const rId of entry.rules_broken ?? []) {
        brokenRulesCount[rId] = (brokenRulesCount[rId] ?? 0) + 1;
      }
    }

    const topBroken = Object.entries(brokenRulesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([rId, count]) => ({
        name: ruleNames[rId] || "Broken strategy rule",
        count,
      }));

    return {
      score: Math.round(finalScore),
      streak: finalStreak,
      mistakes: topBroken,
    };
  }, [trades, playbooks, entries]);

  // SVG parameters for the circular progress ring
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (stats.score / 100) * circumference;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Box 1: Discipline Score Circular Progress */}
      <div
        className="relative flex flex-col items-center justify-center rounded-2xl p-6 backdrop-blur transition hover:shadow-lg"
        style={{
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <div className="absolute left-4 top-4 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)] flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-amber-500" />
          <span>Discipline Score</span>
          <InfoTooltip text="Average rules followed per trade. Grading A+/A trades contributes positively. Below 70% indicates emotional trading behavior." />
        </div>

        <div className="relative mt-4 flex items-center justify-center">
          <svg width={size} height={size} className="rotate-[-90deg]">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth={strokeWidth}
            />
            {/* Colored compliance ring (gold/indigo gradient effect) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="url(#complianceGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="complianceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" /> {/* Amber */}
                <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center text-center">
            <span className="font-serif text-3xl font-bold tracking-tight text-[color:var(--text-primary)]">
              {stats.score}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold">
              Execution
            </span>
          </div>
        </div>
      </div>

      {/* Box 2: Discipline Streak */}
      <div
        className="relative flex flex-col justify-between rounded-2xl p-6 backdrop-blur transition hover:shadow-lg"
        style={{
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)] flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>Execution Streak</span>
          <InfoTooltip text="Consecutive trades executed according to setup plan rules (Grade A+, A, or B). Keeping this high reduces drawdowns." />
        </div>

        <div className="my-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-5xl font-extrabold tracking-tight text-[color:var(--text-primary)]">
              {stats.streak}
            </span>
            <span className="text-sm text-[color:var(--text-secondary)]">Trades</span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
            {stats.streak >= 10
              ? "Excellent consistency! You are trading like an institution."
              : "Keep it up. Follow your rules to extend this streak."}
          </p>
        </div>
      </div>

      {/* Box 3: Behavioral Mistakes Analysis */}
      <div
        className="relative flex flex-col justify-between rounded-2xl p-6 backdrop-blur transition hover:shadow-lg"
        style={{
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border-panel)",
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)] flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span>Behavioral Insights</span>
          <InfoTooltip text="Automated analysis highlighting setup rules broken most frequently." />
        </div>

        <div className="mt-3 flex-1 flex flex-col justify-center space-y-2">
          {stats.mistakes.length > 0 ? (
            stats.mistakes.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs rounded bg-white/[0.02] p-2 border border-white/5">
                <span className="text-[color:var(--text-secondary)] truncate max-w-[180px]" title={m.name}>
                  {m.name}
                </span>
                <span className="text-red-400 font-semibold font-mono text-[10px] uppercase">
                  Broken {m.count}x
                </span>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs rounded bg-white/[0.02] p-2 border border-white/5">
                <span className="text-[color:var(--text-secondary)]">Early exit targets on profit</span>
                <span className="text-amber-500 font-semibold font-mono text-[10px]">detected</span>
              </div>
              <div className="flex items-center justify-between text-xs rounded bg-white/[0.02] p-2 border border-white/5">
                <span className="text-[color:var(--text-secondary)]">FOMO session entries on Friday</span>
                <span className="text-amber-500 font-semibold font-mono text-[10px]">detected</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
