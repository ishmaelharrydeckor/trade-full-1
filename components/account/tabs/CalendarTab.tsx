// components/account/tabs/CalendarTab.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, BookText } from "lucide-react";
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
      <div className="rounded-xl p-5" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-2 transition duration-150" style={{ border: '1px solid var(--app-border)', background: 'var(--app-elevated)', color: 'var(--text-secondary)' }}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">{monthLabel}</h3>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs financial-num font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span>
                Net:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    monthTotal.netPnl > 0
                      ? ""
                      : monthTotal.netPnl < 0
                        ? ""
                        : ""
                  )}
                  style={{
                    color: monthTotal.netPnl > 0
                      ? 'var(--positive)'
                      : monthTotal.netPnl < 0
                        ? 'var(--negative)'
                        : 'var(--text-secondary)'
                  }}
                >
                  {fmtSignedUsd(monthTotal.netPnl)}
                </span>
              </span>
              <span>·</span>
              <span>{monthTotal.trades} trades</span>
              <span>·</span>
              <span>
                <span style={{ color: 'var(--positive)' }}>{monthTotal.winningDays}W</span>
                {" / "}
                <span style={{ color: 'var(--negative)' }}>{monthTotal.losingDays}L</span>
                {" days"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-2 transition duration-150" style={{ border: '1px solid var(--app-border)', background: 'var(--app-elevated)', color: 'var(--text-secondary)' }}
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
              className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}
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
                  const dayData = cell.dateStr ? dayMap.get(cell.dateStr) : undefined;
                  if (!dayData) {
                    // No trades — go straight to trade form
                    window.dispatchEvent(
                      new CustomEvent("tradefull:addtrade", { detail: cell.dateStr })
                    );
                  } else {
                    // Has trades — toggle selection to see them
                    setSelectedDate(
                      selectedDate === cell.dateStr ? null : cell.dateStr
                    );
                  }
                }
              }}
              isFuture={cell.date ? cell.date > new Date() : false}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          <Legend dot="bg-emerald-500/60" label="Winning day" />
          <Legend dot="bg-red-500/60" label="Losing day" />
          <Legend dot="" dotStyle={{ background: 'var(--app-elevated)' }} label="No trades" />
        </div>
      </div>

      {/* Selected day's trades */}
      {selectedDate && (
        <div className="rounded-xl p-5" style={{ border: '1px solid var(--accent)', background: 'var(--accent-glow)' }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold">
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
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {selectedTrades.length} trade
                {selectedTrades.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs font-medium transition duration-150" style={{ color: 'var(--text-secondary)' }}
            >
              Clear
            </button>
          </div>

          {selectedTrades.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No trades on this day.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("tradefull:addtrade", { detail: selectedDate })
                    );
                  }}
                  className="tj-btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add a trade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("tradefull:gototab", { detail: "notebook" })
                    );
                  }}
                  className="tj-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <BookText className="h-3 w-3" />
                  Write journal entry
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--app-border)' }}>
              <table className="tj-table w-full min-w-[500px] text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-left">Dir</th>
                    <th className="px-3 py-2 text-right">Vol</th>
                    <th className="px-3 py-2 text-right">P&L</th>
                    <th className="px-3 py-2 text-left">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTrades.map((t) => {
                    const net = tradeNetPnl(t);
                    return (
                      <tr key={t.id} style={{ color: 'var(--text-primary)' }}>
                        <td className="px-3 py-2 font-medium">{t.symbol}</td>
                        <td className="px-3 py-2">
                          <span className={cn("badge uppercase", t.direction === "long" ? "badge-buy" : "badge-sell")}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium financial-num" style={{ color: 'var(--text-secondary)' }}>
                          {Number(t.volume).toFixed(2)}
                        </td>
                        <td
                          className="px-3 py-2 text-right font-bold financial-num"
                          style={{
                            color: net > 0
                              ? 'var(--positive)'
                              : net < 0
                                ? 'var(--negative)'
                                : 'var(--text-muted)'
                          }}
                        >
                          {fmtSignedUsd(net)}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
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
        <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}>
          <CalendarIcon className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-2xl font-bold tracking-tight">No trades to plot yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
  isFuture,
}: {
  date: Date | null;
  dateStr: string | null;
  day: DayAggregate | undefined;
  isSelected: boolean;
  onClick: () => void;
  isFuture?: boolean;
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
      disabled={!!isFuture}
      title={
        day
          ? `${dateStr}: ${day.trades} trade${day.trades !== 1 ? "s" : ""}, ${fmtSignedUsd(day.netPnl)}`
          : dateStr ? `${dateStr}: Click to add a trade or journal entry` : ""
      }
      className={cn(
        "group flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 text-xs transition duration-150",
        // Base coloring
        day
          ? isWin
            ? "text-emerald-100"
            : isLoss
              ? "text-red-100"
              : ""
          : isFuture
            ? "cursor-not-allowed"
            : "cursor-pointer",
        // Interaction states
        !isFuture && "cursor-pointer hover:scale-105",
        day && isWin && "hover:bg-emerald-500/25",
        day && isLoss && "hover:bg-red-500/25",
        // Selected
        isSelected && "ring-2 ring-offset-1",
        // Today
        isToday && !isSelected && "ring-1 ring-slate-500"
      )}
      style={{
        border: `1px solid ${day ? (isWin ? 'rgba(16,185,129,0.3)' : isLoss ? 'rgba(239,68,68,0.3)' : 'var(--app-border)') : 'var(--app-border)'}`,
        background: day
          ? isWin ? 'rgba(16,185,129,0.15)' : isLoss ? 'rgba(239,68,68,0.15)' : 'var(--app-surface)'
          : isFuture ? 'transparent' : 'var(--app-surface)',
        color: !day && !isFuture ? 'var(--text-muted)' : undefined,
        ...(isSelected ? { boxShadow: '0 0 0 2px var(--accent)', borderColor: 'var(--accent)' } : {}),
      }}
    >
      <div className="text-[10px] font-medium">{date.getDate()}</div>
      {day ? (
        <div className="font-mono text-[9px] font-medium financial-num opacity-80">
          {fmtCompactNumber(day.netPnl)}
        </div>
      ) : !isFuture ? (
        <div className="text-[8px] opacity-0 transition group-hover:opacity-100" style={{ color: 'var(--text-muted)' }}>+</div>
      ) : null}
    </button>
  );
}

function Legend({ dot, label, dotStyle }: { dot: string; label: string; dotStyle?: React.CSSProperties }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} style={dotStyle} />
      {label}
    </span>
  );
}
