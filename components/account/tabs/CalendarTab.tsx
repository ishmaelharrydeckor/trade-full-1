// components/account/tabs/CalendarTab.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { aggregateByDay, type DayAggregate } from "@/lib/analytics";
import { fmtSignedUsd, fmtCompactNumber, fmtDateTime } from "@/lib/format";
import { tradeNetPnl } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Account, Trade } from "@/types/database";

export default function CalendarTab({
  account,
  trades,
}: {
  account: Account;
  trades: Trade[];
}) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dayMap = useMemo(() => aggregateByDay(trades), [trades]);

  // Build the calendar grid (Sun → Sat). Cells before day 1 and after the last
  // day are nulls so the layout aligns to a 7-column grid.
  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const startDay = firstOfMonth.getDay();
    const daysInMonth = lastOfMonth.getDate();

    const cells: Array<{ date: Date | null; dateStr: string | null }> = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ date: null, dateStr: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ date, dateStr });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthTotal = useMemo(() => {
    let netPnl = 0;
    let trades = 0;
    let winningDays = 0;
    let losingDays = 0;
    for (const cell of grid) {
      if (cell.dateStr) {
        const d = dayMap.get(cell.dateStr);
        if (d) {
          netPnl += d.netPnl;
          trades += d.trades;
          if (d.netPnl > 0) winningDays++;
          else if (d.netPnl < 0) losingDays++;
        }
      }
    }
    return { netPnl, trades, winningDays, losingDays };
  }, [grid, dayMap]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setSelectedDate(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    setSelectedDate(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const selectedTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades
      .filter((t) => {
        const d = new Date(t.close_time ?? t.open_time);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return dateStr === selectedDate;
      })
      .sort(
        (a, b) =>
          new Date(b.close_time ?? b.open_time).getTime() -
          new Date(a.close_time ?? a.open_time).getTime()
      );
  }, [selectedDate, trades]);

  return (
    <div className="flex flex-col gap-5">
      {/* Month header with nav */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 text-center">
            <h3 className="font-serif text-2xl tracking-tight">{monthLabel}</h3>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 tabular-nums">
              <span>
                Net:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    monthTotal.netPnl > 0
                      ? "text-emerald-300"
                      : monthTotal.netPnl < 0
                        ? "text-red-300"
                        : "text-slate-300"
                  )}
                >
                  {fmtSignedUsd(monthTotal.netPnl)}
                </span>
              </span>
              <span>·</span>
              <span>{monthTotal.trades} trades</span>
              <span>·</span>
              <span>
                <span className="text-emerald-300">{monthTotal.winningDays}W</span>
                {" / "}
                <span className="text-red-300">{monthTotal.losingDays}L</span>
                {" days"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="mt-5 mb-2 grid grid-cols-7 gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] uppercase tracking-wider text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((cell, idx) => (
            <DayCell
              key={idx}
              date={cell.date}
              dateStr={cell.dateStr}
              day={cell.dateStr ? dayMap.get(cell.dateStr) : undefined}
              isSelected={cell.dateStr === selectedDate}
              onClick={() => {
                if (cell.dateStr) {
                  setSelectedDate(
                    selectedDate === cell.dateStr ? null : cell.dateStr
                  );
                }
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <Legend dot="bg-emerald-500/60" label="Winning day" />
          <Legend dot="bg-red-500/60" label="Losing day" />
          <Legend dot="bg-white/10" label="No trades" />
        </div>
      </div>

      {/* Selected day's trades */}
      {selectedDate && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.05] p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="font-serif text-lg">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "default",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </h4>
              <p className="text-xs text-slate-400">
                {selectedTrades.length} trade
                {selectedTrades.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          {selectedTrades.length === 0 ? (
            <p className="text-sm text-slate-500">No trades on this day.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-left">Dir</th>
                    <th className="px-3 py-2 text-right">Vol</th>
                    <th className="px-3 py-2 text-right">P&L</th>
                    <th className="px-3 py-2 text-left">Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedTrades.map((t) => {
                    const net = tradeNetPnl(t);
                    return (
                      <tr key={t.id} className="text-slate-200">
                        <td className="px-3 py-2 font-medium">{t.symbol}</td>
                        <td className="px-3 py-2 capitalize text-slate-400">
                          {t.direction}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                          {Number(t.volume).toFixed(2)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right tabular-nums",
                            net > 0
                              ? "text-emerald-300"
                              : net < 0
                                ? "text-red-300"
                                : "text-slate-400"
                          )}
                        >
                          {fmtSignedUsd(net)}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {fmtDateTime(t.close_time)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {trades.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur">
          <CalendarIcon className="mx-auto mb-3 h-10 w-10 text-slate-500" />
          <h3 className="font-serif text-2xl">No trades to plot yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Once you've added or imported some trades, this calendar shows
            green for winning days and red for losing days at a glance.
          </p>
        </div>
      )}
    </div>
  );
}

// ===========================================================
// Individual cell
// ===========================================================
function DayCell({
  date,
  dateStr,
  day,
  isSelected,
  onClick,
}: {
  date: Date | null;
  dateStr: string | null;
  day: DayAggregate | undefined;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!date) {
    return <div />;
  }

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isWin = day && day.netPnl > 0;
  const isLoss = day && day.netPnl < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!day}
      title={
        day
          ? `${dateStr}: ${day.trades} trade${day.trades !== 1 ? "s" : ""}, ${fmtSignedUsd(day.netPnl)}`
          : dateStr ?? ""
      }
      className={cn(
        "group flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1.5 text-xs transition",
        // Base coloring
        day
          ? isWin
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
            : isLoss
              ? "border-red-500/30 bg-red-500/15 text-red-100"
              : "border-white/10 bg-white/5 text-slate-300"
          : "border-white/5 bg-transparent text-slate-600",
        // Interaction states
        day && "cursor-pointer hover:scale-105",
        day && isWin && "hover:bg-emerald-500/25",
        day && isLoss && "hover:bg-red-500/25",
        // Selected
        isSelected && "ring-2 ring-blue-400 ring-offset-1 ring-offset-[color:var(--bg-app)]",
        // Today
        isToday && !isSelected && "ring-1 ring-slate-500"
      )}
    >
      <div className="text-[10px] font-medium">{date.getDate()}</div>
      {day && (
        <div className="font-mono text-[9px] tabular-nums opacity-80">
          {fmtCompactNumber(day.netPnl)}
        </div>
      )}
    </button>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
