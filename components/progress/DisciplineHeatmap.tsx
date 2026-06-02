"use client";

import { useMemo } from "react";
import type { DailyLog } from "@/types/database";
import { cn } from "@/lib/utils";

export default function DisciplineHeatmap({ logs }: { logs: DailyLog[] }) {
  const { grid, months } = useMemo(() => {
    const logMap = new Map<string, number>();
    for (const log of logs) {
      logMap.set(log.log_date, log.score ?? 0);
    }

    // Build 12-week grid ending today
    const today = new Date();
    const weeks = 12;
    const grid: { date: string; score: number | null; dayOfWeek: number }[][] = [];
    const months: { label: string; col: number }[] = [];

    // Find the start: go back 12 weeks, align to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - (weeks * 7) + 1);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    let lastMonth = -1;
    const cursor = new Date(start);

    for (let w = 0; w < weeks + 1; w++) {
      const week: { date: string; score: number | null; dayOfWeek: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        const isFuture = cursor > today;
        week.push({
          date: dateStr,
          score: isFuture ? null : (logMap.get(dateStr) ?? null),
          dayOfWeek: d,
        });

        // Track month labels
        if (cursor.getMonth() !== lastMonth && d === 0) {
          lastMonth = cursor.getMonth();
          months.push({
            label: cursor.toLocaleDateString("en-US", { month: "short" }),
            col: w,
          });
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
    }

    return { grid, months };
  }, [logs]);

  function getColor(score: number | null): string {
    if (score === null) return "bg-white/[0.03]";
    if (score >= 80) return "bg-emerald-500/70";
    if (score >= 60) return "bg-emerald-500/40";
    if (score >= 40) return "bg-amber-500/40";
    if (score >= 20) return "bg-red-500/30";
    if (score > 0) return "bg-red-500/50";
    return "bg-white/[0.05]";
  }

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
      <h3 className="mb-4 font-serif text-lg">Discipline Heatmap</h3>

      {/* Month labels */}
      <div className="mb-1 flex pl-6">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-[10px] text-slate-500"
            style={{ position: "relative", left: `${m.col * 16}px` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex h-3 w-4 items-center justify-center text-[8px] text-slate-600">
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "h-3 w-3 rounded-[2px] transition-colors",
                  getColor(day.score)
                )}
                title={`${day.date}: ${day.score !== null ? `${day.score}%` : "No data"}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[2px] bg-white/[0.05]" />
        <div className="h-3 w-3 rounded-[2px] bg-red-500/30" />
        <div className="h-3 w-3 rounded-[2px] bg-amber-500/40" />
        <div className="h-3 w-3 rounded-[2px] bg-emerald-500/40" />
        <div className="h-3 w-3 rounded-[2px] bg-emerald-500/70" />
        <span>More</span>
      </div>
    </div>
  );
}
