// lib/analytics.ts
// Aggregation helpers — group trades by symbol, weekday, mindset, tag, etc.
// All pure functions. Used by AnalyticsTab + CalendarTab.

import type { Trade } from "@/types/database";
import { tradeNetPnl, computeRMultiple } from "./stats";

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

// ===========================================================
// Grade aggregation
// ===========================================================
export function aggregateByGrade(trades: Trade[]): DimensionAggregate[] {
  return aggregate(trades, (t) => t.grade).sort(
    (a, b) => {
      const order = ["A+", "A", "B", "C", "D", "F"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    }
  );
}

// ===========================================================
// R-Multiple bucket aggregation
// ===========================================================
export function aggregateByRBucket(trades: Trade[]): DimensionAggregate[] {
  const bucketLabels = ["< -2R", "-2R to -1R", "-1R to 0", "0 to 1R", "1R to 2R", "2R to 3R", "> 3R"];
  const map = new Map<string, { trades: number; netPnl: number; winners: number }>();
  for (const label of bucketLabels) {
    map.set(label, { trades: 0, netPnl: 0, winners: 0 });
  }

  for (const t of trades) {
    const r = computeRMultiple(t);
    if (r == null) continue;
    let label: string;
    if (r < -2) label = "< -2R";
    else if (r < -1) label = "-2R to -1R";
    else if (r < 0) label = "-1R to 0";
    else if (r < 1) label = "0 to 1R";
    else if (r < 2) label = "1R to 2R";
    else if (r < 3) label = "2R to 3R";
    else label = "> 3R";

    const bucket = map.get(label)!;
    const net = tradeNetPnl(t);
    bucket.trades++;
    bucket.netPnl += net;
    if (net > 0) bucket.winners++;
  }

  return bucketLabels
    .map((label) => {
      const b = map.get(label)!;
      return {
        label,
        trades: b.trades,
        netPnl: b.netPnl,
        winners: b.winners,
        winRate: b.trades > 0 ? (b.winners / b.trades) * 100 : 0,
      };
    })
    .filter((b) => b.trades > 0);
}

// ===========================================================
// Missed trades aggregation
// ===========================================================
export function aggregateByMissed(trades: Trade[]): DimensionAggregate[] {
  return aggregate(trades, (t) => t.is_missed ? "Missed" : "Executed").sort(
    (a, b) => (a.label === "Executed" ? -1 : 1)
  );
}

// ===========================================================
// Session aggregation
// ===========================================================
export function aggregateBySession(trades: Trade[]): DimensionAggregate[] {
  const sessions = ["London", "New York", "Sydney", "Asian"];
  const map = new Map<string, { trades: number; netPnl: number; winners: number }>();
  
  for (const s of sessions) {
    map.set(s, { trades: 0, netPnl: 0, winners: 0 });
  }

  for (const t of trades) {
    if (!t.open_time) continue;
    const d = new Date(t.open_time);
    const hour = d.getUTCHours();
    if (isNaN(hour)) continue;

    let session = "Asian";
    if (hour >= 7 && hour < 12) session = "London";
    else if (hour >= 12 && hour < 21) session = "New York";
    else if (hour >= 21 && hour < 24) session = "Sydney";
    
    const b = map.get(session)!;
    const net = tradeNetPnl(t);
    b.trades++;
    b.netPnl += net;
    if (net > 0) b.winners++;
  }

  return sessions.map((label) => {
    const b = map.get(label)!;
    return {
      label,
      trades: b.trades,
      netPnl: b.netPnl,
      winners: b.winners,
      winRate: b.trades > 0 ? (b.winners / b.trades) * 100 : 0,
    };
  });
}


