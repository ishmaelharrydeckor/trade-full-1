// components/dashboard/DateRangeFilter.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type DateRangePreset =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "ytd"
  | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start: Date | null;
  end: Date | null;
}

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "all",    label: "All time" },
  { id: "today",  label: "Today" },
  { id: "7d",     label: "7d" },
  { id: "30d",    label: "30d" },
  { id: "90d",    label: "90d" },
  { id: "ytd",    label: "YTD" },
  { id: "custom", label: "Custom" },
];

export function computeDateRange(preset: DateRangePreset): {
  start: Date | null;
  end: Date | null;
} {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  switch (preset) {
    case "all":
      return { start: null, end: null };
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "7d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "90d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "ytd": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: endOfToday };
    }
    default:
      return { start: null, end: null };
  }
}

export const ALL_TIME: DateRange = { preset: "all", start: null, end: null };

export default function DateRangeFilter({
  value,
  onChange,
  tradeCount,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  tradeCount: number;
}) {
  const [showCustom, setShowCustom] = useState(value.preset === "custom");

  function handlePreset(preset: DateRangePreset) {
    if (preset === "custom") {
      setShowCustom(true);
      // Default custom range to last 30 days if not already set
      if (!value.start) {
        const { start, end } = computeDateRange("30d");
        onChange({ preset: "custom", start, end });
      } else {
        onChange({ ...value, preset: "custom" });
      }
      return;
    }
    setShowCustom(false);
    const { start, end } = computeDateRange(preset);
    onChange({ preset, start, end });
  }

  function handleCustomDate(field: "start" | "end", val: string) {
    const date = val ? new Date(val + "T00:00:00") : null;
    if (field === "end" && date) date.setHours(23, 59, 59, 999);
    onChange({
      preset: "custom",
      start: field === "start" ? date : value.start,
      end: field === "end" ? date : value.end,
    });
  }

  return (
    <div className="relative -mx-4 md:mx-0">
      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-1 md:flex-wrap md:px-0 md:pb-0">
        <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition duration-150",
                value.preset === p.id
                  ? "font-bold text-white"
                  : "font-semibold"
              )}
              style={value.preset === p.id
                ? { backgroundColor: 'var(--accent)' }
                : { color: 'var(--text-secondary)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
            <input
              type="date"
              value={value.start ? value.start.toISOString().slice(0, 10) : ""}
              onChange={(e) => handleCustomDate("start", e.target.value)}
              className="tj-input rounded px-2 py-1 text-xs font-medium outline-none"
            />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>→</span>
            <input
              type="date"
              value={value.end ? value.end.toISOString().slice(0, 10) : ""}
              onChange={(e) => handleCustomDate("end", e.target.value)}
              className="tj-input rounded px-2 py-1 text-xs font-medium outline-none"
            />
          </div>
        )}

        <span className="shrink-0 whitespace-nowrap text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {tradeCount} {tradeCount === 1 ? "trade" : "trades"} in range
        </span>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[color:var(--app-bg)] to-transparent md:hidden" />
    </div>
  );
}

/**
 * Filter helper — apply a DateRange to a trade list.
 */
export function filterTradesByDateRange<
  T extends { close_time: string | null; open_time: string }
>(trades: T[], range: DateRange): T[] {
  if (!range.start && !range.end) return trades;
  return trades.filter((t) => {
    const time = new Date(t.close_time ?? t.open_time).getTime();
    if (range.start && time < range.start.getTime()) return false;
    if (range.end && time > range.end.getTime()) return false;
    return true;
  });
}

/**
 * Filter helper — apply a DateRange to transactions.
 */
export function filterTxByDateRange<T extends { occurred_at: string }>(
  txs: T[],
  range: DateRange
): T[] {
  if (!range.start && !range.end) return txs;
  return txs.filter((t) => {
    const time = new Date(t.occurred_at).getTime();
    if (range.start && time < range.start.getTime()) return false;
    if (range.end && time > range.end.getTime()) return false;
    return true;
  });
}
