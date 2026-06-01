// lib/analytics.ts
// Aggregation helpers — group trades by symbol, weekday, mindset, tag, etc.
// All pure functions. Used by AnalyticsTab + CalendarTab.

import type { Trade } from "@/types/database";
import { tradeNetPnl } from "./stats";

export interface DimensionAggregate {
  label: string;
  trades: number;
  netPnl: number;
  winners: number;
  winRate: number;     // 0-100
}

export interface DayAggregate {
  date: string;        // YYYY-MM-DD (local time)
  trades: number;
  netPnl: number;
  winners: number;
  losers: number;
}

// ===========================================================
// Generic aggregator
// ===========================================================
function aggregate<K extends string>(
  trades: Trade[],
  getKey: (t: Trade) => K | null | undefined
): DimensionAggregate[] {
  const map = new Map<K, { trades: number; netPnl: number; winners: number }>();
  for (const t of trades) {
    const key = getKey(t);
    if (!key) continue;
    const bucket = map.get(key) ?? { trades: 0, netPnl: 0, winners: 0 };
    const net = tradeNetPnl(t);
    bucket.trades++;
    bucket.netPnl += net;
    if (net > 0) bucket.winners++;
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([label, b]) => ({
    label: String(label),
    trades: b.trades,
    netPnl: b.netPnl,
    winners: b.winners,
    winRate: b.trades > 0 ? (b.winners / b.trades) * 100 : 0,
  }));
}

// ===========================================================
// Per-dimension aggregations
// ===========================================================
export function aggregateBySymbol(trades: Trade[]): DimensionAggregate[] {
  return aggregate(trades, (t) => t.symbol).sort(
    (a, b) => Math.abs(b.netPnl) - Math.abs(a.netPnl)
  );
}

export function aggregateByAssetClass(trades: Trade[]): DimensionAggregate[] {
  return aggregate(trades, (t) => t.asset_class).sort(
    (a, b) => b.netPnl - a.netPnl
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function aggregateByWeekday(trades: Trade[]): DimensionAggregate[] {
  const result = aggregate(trades, (t) => {
    const d = new Date(t.close_time ?? t.open_time);
    return WEEKDAY_LABELS[d.getDay()];
  });
  // Sort Monday→Sunday (week start convention for most traders)
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return result.sort(
    (a, b) => order.indexOf(a.label) - order.indexOf(b.label)
  );
}

export function aggregateByHour(trades: Trade[]): DimensionAggregate[] {
  return aggregate(trades, (t) => {
    const d = new Date(t.close_time ?? t.open_time);
    return String(d.getHours()).padStart(2, "0") + ":00";
  }).sort((a, b) => a.label.localeCompare(b.label));
}

export function aggregateByMindset(trades: Trade[]): DimensionAggregate[] {
  return aggregate(trades, (t) => t.mindset).sort(
    (a, b) => b.netPnl - a.netPnl
  );
}

export function aggregateByDirection(trades: Trade[]): DimensionAggregate[] {
  // Capitalize "long"/"short" for display
  const raw = aggregate(trades, (t) => t.direction);
  return raw
    .map((r) => ({
      ...r,
      label: r.label.charAt(0).toUpperCase() + r.label.slice(1),
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Long before Short
}

/**
 * Tags are arrays — one trade can have multiple tags, so we count each
 * tag separately (a trade tagged "breakout, london" appears in both buckets).
 */
export function aggregateByTags(trades: Trade[]): DimensionAggregate[] {
  const map = new Map<string, { trades: number; netPnl: number; winners: number }>();
  for (const t of trades) {
    if (!t.tags || t.tags.length === 0) continue;
    const net = tradeNetPnl(t);
    for (const tag of t.tags) {
      const k = tag.trim();
      if (!k) continue;
      const b = map.get(k) ?? { trades: 0, netPnl: 0, winners: 0 };
      b.trades++;
      b.netPnl += net;
      if (net > 0) b.winners++;
      map.set(k, b);
    }
  }
  return Array.from(map.entries())
    .map(([label, b]) => ({
      label,
      trades: b.trades,
      netPnl: b.netPnl,
      winners: b.winners,
      winRate: b.trades > 0 ? (b.winners / b.trades) * 100 : 0,
    }))
    .sort((a, b) => b.netPnl - a.netPnl);
}

// ===========================================================
// Calendar: aggregate by calendar day (local time)
// ===========================================================
export function aggregateByDay(trades: Trade[]): Map<string, DayAggregate> {
  const map = new Map<string, DayAggregate>();
  for (const t of trades) {
    const d = new Date(t.close_time ?? t.open_time);
    // Use local date so the calendar matches what the user expects to see
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const net = tradeNetPnl(t);
    const bucket = map.get(dateStr) ?? {
      date: dateStr,
      trades: 0,
      netPnl: 0,
      winners: 0,
      losers: 0,
    };
    bucket.trades++;
    bucket.netPnl += net;
    if (net > 0) bucket.winners++;
    else if (net < 0) bucket.losers++;
    map.set(dateStr, bucket);
  }
  return map;
}
