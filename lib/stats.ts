// lib/stats.ts
// All KPI + equity-curve math for the journal.
// Pure functions — given trades + transactions + starting balance, derive everything.

import type { Trade, AccountTransaction } from "@/types/database";

export interface KpiSummary {
  trades: number;
  winners: number;
  losers: number;
  breakeven: number;
  netPnl: number;
  winRate: number;       // %, 0–100
  avgWinner: number;
  avgLoser: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;  // gross profit / |gross loss|
  expectancy: number;    // winRate * avgWinner + (1-winRate) * avgLoser
  bestStreak: number;    // consecutive wins
  worstStreak: number;   // consecutive losses (positive number)
}

export interface EquityPoint {
  time: string;          // ISO
  equity: number;        // running balance
  delta: number;         // change at this point
  type: "trade" | "deposit" | "withdrawal";
  label?: string;        // e.g. trade symbol
}

/**
 * Net P&L for a single trade, factoring commission and swap.
 */
export function tradeNetPnl(t: Trade): number {
  const gross = t.pnl ?? 0;
  return gross - (t.commission ?? 0) - (t.swap ?? 0);
}

/**
 * Compute KPI summary for a list of trades.
 * Trades must be in chronological order for streak math to be correct;
 * we sort defensively.
 */
export function computeKpis(trades: Trade[]): KpiSummary {
  if (trades.length === 0) {
    return {
      trades: 0, winners: 0, losers: 0, breakeven: 0,
      netPnl: 0, winRate: 0, avgWinner: 0, avgLoser: 0,
      largestWin: 0, largestLoss: 0,
      profitFactor: 0, expectancy: 0,
      bestStreak: 0, worstStreak: 0,
    };
  }

  // Sort by close_time, falling back to open_time, ascending
  const sorted = [...trades].sort((a, b) => {
    const ta = a.close_time ?? a.open_time;
    const tb = b.close_time ?? b.open_time;
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

  const nets = sorted.map(tradeNetPnl);

  let winners = 0, losers = 0, breakeven = 0;
  let grossProfit = 0, grossLoss = 0;
  let largestWin = 0, largestLoss = 0;
  let bestStreak = 0, worstStreak = 0;
  let curW = 0, curL = 0;

  for (const n of nets) {
    if (n > 0) {
      winners++;
      grossProfit += n;
      if (n > largestWin) largestWin = n;
      curW++; curL = 0;
      if (curW > bestStreak) bestStreak = curW;
    } else if (n < 0) {
      losers++;
      grossLoss += n;  // negative
      if (n < largestLoss) largestLoss = n;
      curL++; curW = 0;
      if (curL > worstStreak) worstStreak = curL;
    } else {
      breakeven++;
      curW = 0; curL = 0;
    }
  }

  const total = sorted.length;
  const netPnl = nets.reduce((s, n) => s + n, 0);
  const winRate = total ? (winners / total) * 100 : 0;
  const avgWinner = winners ? grossProfit / winners : 0;
  const avgLoser = losers ? grossLoss / losers : 0;
  const profitFactor = grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : (grossProfit > 0 ? Infinity : 0);
  const winRateDec = winRate / 100;
  const expectancy = winRateDec * avgWinner + (1 - winRateDec) * avgLoser;

  return {
    trades: total, winners, losers, breakeven,
    netPnl, winRate, avgWinner, avgLoser,
    largestWin, largestLoss,
    profitFactor, expectancy,
    bestStreak, worstStreak,
  };
}

/**
 * Build an equity curve by walking trades + deposits/withdrawals chronologically.
 * The starting balance anchors the curve.
 */
export function buildEquityCurve(
  trades: Trade[],
  transactions: AccountTransaction[],
  startingBalance: number
): EquityPoint[] {
  type Event = { time: string; delta: number; type: EquityPoint["type"]; label?: string };

  const events: Event[] = [
    ...trades.map<Event>((t) => ({
      time: t.close_time ?? t.open_time,
      delta: tradeNetPnl(t),
      type: "trade",
      label: t.symbol,
    })),
    ...transactions.map<Event>((tx) => ({
      time: tx.occurred_at,
      delta: tx.type === "deposit" ? tx.amount : -tx.amount,
      type: tx.type,
    })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const points: EquityPoint[] = [];
  let equity = startingBalance;

  // Anchor point at first event time (or now if empty)
  if (events.length === 0) {
    return [{ time: new Date().toISOString(), equity, delta: 0, type: "trade" }];
  }

  // Seed with the starting balance just before the first event
  const firstTime = new Date(events[0].time);
  const seedTime = new Date(firstTime.getTime() - 1).toISOString();
  points.push({ time: seedTime, equity, delta: 0, type: "trade" });

  for (const e of events) {
    equity += e.delta;
    points.push({
      time: e.time,
      equity,
      delta: e.delta,
      type: e.type,
      label: e.label,
    });
  }
  return points;
}

/**
 * Current equity = starting balance + sum of all deltas
 */
export function computeCurrentEquity(
  trades: Trade[],
  transactions: AccountTransaction[],
  startingBalance: number
): number {
  const tradeNet = trades.reduce((s, t) => s + tradeNetPnl(t), 0);
  const txNet = transactions.reduce(
    (s, tx) => s + (tx.type === "deposit" ? tx.amount : -tx.amount),
    0
  );
  return startingBalance + tradeNet + txNet;
}
