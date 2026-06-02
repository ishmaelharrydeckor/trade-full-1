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

// ===========================================================
// R-Multiple calculations
// ===========================================================

/**
 * Compute the R-multiple for a single trade.
 * R = risk per unit = |entry_price - stop_loss|
 * R-multiple = net P&L / (R * volume)
 * Returns null if stop_loss is missing.
 */
export function computeRMultiple(t: Trade): number | null {
  if (t.stop_loss == null || t.entry_price == null) return null;
  const riskPerUnit = Math.abs(t.entry_price - t.stop_loss);
  if (riskPerUnit === 0) return null;
  const net = tradeNetPnl(t);
  // R-multiple = actual outcome / initial risk
  return net / (riskPerUnit * t.volume);
}

/**
 * Compute R-multiple summary stats for a set of trades.
 */
export interface RMultipleSummary {
  avgR: number | null;
  bestR: number | null;
  worstR: number | null;
  rExpectancy: number | null;
  tradesWithR: number;
}

export function computeRSummary(trades: Trade[]): RMultipleSummary {
  const rValues = trades
    .map(computeRMultiple)
    .filter((r): r is number => r !== null);

  if (rValues.length === 0) {
    return { avgR: null, bestR: null, worstR: null, rExpectancy: null, tradesWithR: 0 };
  }

  const sum = rValues.reduce((s, r) => s + r, 0);
  const avgR = sum / rValues.length;
  const bestR = Math.max(...rValues);
  const worstR = Math.min(...rValues);

  const winners = rValues.filter((r) => r > 0);
  const losers = rValues.filter((r) => r < 0);
  const winRate = winners.length / rValues.length;
  const avgWinR = winners.length > 0 ? winners.reduce((s, r) => s + r, 0) / winners.length : 0;
  const avgLoseR = losers.length > 0 ? losers.reduce((s, r) => s + r, 0) / losers.length : 0;
  const rExpectancy = winRate * avgWinR + (1 - winRate) * avgLoseR;

  return { avgR, bestR, worstR, rExpectancy, tradesWithR: rValues.length };
}

// ===========================================================
// Drawdown calculations
// ===========================================================

export interface DrawdownPeriod {
  peakDate: string;
  troughDate: string;
  recoveryDate: string | null;
  drawdownPct: number;
  drawdownAbs: number;
  durationDays: number;
}

export interface DrawdownMetrics {
  maxDrawdownPct: number;
  maxDrawdownAbs: number;
  currentDrawdownPct: number;
  currentDrawdownAbs: number;
  maxDrawdownDuration: number; // days
  drawdownPeriods: DrawdownPeriod[];
}

/**
 * Compute drawdown metrics from an equity curve.
 */
export function computeDrawdown(equityCurve: EquityPoint[]): DrawdownMetrics {
  if (equityCurve.length === 0) {
    return {
      maxDrawdownPct: 0, maxDrawdownAbs: 0,
      currentDrawdownPct: 0, currentDrawdownAbs: 0,
      maxDrawdownDuration: 0, drawdownPeriods: [],
    };
  }

  let peak = equityCurve[0].equity;
  let peakDate = equityCurve[0].time;
  let maxDDPct = 0;
  let maxDDAbs = 0;
  let maxDDDuration = 0;

  const periods: DrawdownPeriod[] = [];
  let currentPeriod: {
    peakDate: string;
    peakEquity: number;
    troughDate: string;
    troughEquity: number;
  } | null = null;

  for (const point of equityCurve) {
    if (point.equity >= peak) {
      // New peak — close any open drawdown period
      if (currentPeriod && currentPeriod.troughEquity < currentPeriod.peakEquity) {
        const ddAbs = currentPeriod.peakEquity - currentPeriod.troughEquity;
        const ddPct = currentPeriod.peakEquity > 0 ? (ddAbs / currentPeriod.peakEquity) * 100 : 0;
        const duration = Math.ceil(
          (new Date(point.time).getTime() - new Date(currentPeriod.peakDate).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        periods.push({
          peakDate: currentPeriod.peakDate,
          troughDate: currentPeriod.troughDate,
          recoveryDate: point.time,
          drawdownPct: ddPct,
          drawdownAbs: ddAbs,
          durationDays: duration,
        });
        if (duration > maxDDDuration) maxDDDuration = duration;
      }
      peak = point.equity;
      peakDate = point.time;
      currentPeriod = null;
    } else {
      // In drawdown
      const ddAbs = peak - point.equity;
      const ddPct = peak > 0 ? (ddAbs / peak) * 100 : 0;

      if (ddAbs > maxDDAbs) maxDDAbs = ddAbs;
      if (ddPct > maxDDPct) maxDDPct = ddPct;

      if (!currentPeriod) {
        currentPeriod = {
          peakDate,
          peakEquity: peak,
          troughDate: point.time,
          troughEquity: point.equity,
        };
      } else if (point.equity < currentPeriod.troughEquity) {
        currentPeriod.troughDate = point.time;
        currentPeriod.troughEquity = point.equity;
      }
    }
  }

  // Handle open drawdown period (not yet recovered)
  let currentDrawdownPct = 0;
  let currentDrawdownAbs = 0;
  if (currentPeriod) {
    currentDrawdownAbs = currentPeriod.peakEquity - currentPeriod.troughEquity;
    currentDrawdownPct = currentPeriod.peakEquity > 0
      ? (currentDrawdownAbs / currentPeriod.peakEquity) * 100
      : 0;
    const duration = Math.ceil(
      (new Date(equityCurve[equityCurve.length - 1].time).getTime() -
       new Date(currentPeriod.peakDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    periods.push({
      peakDate: currentPeriod.peakDate,
      troughDate: currentPeriod.troughDate,
      recoveryDate: null,
      drawdownPct: currentDrawdownPct,
      drawdownAbs: currentDrawdownAbs,
      durationDays: duration,
    });
    if (duration > maxDDDuration) maxDDDuration = duration;
  }

  return {
    maxDrawdownPct: maxDDPct,
    maxDrawdownAbs: maxDDAbs,
    currentDrawdownPct,
    currentDrawdownAbs,
    maxDrawdownDuration: maxDDDuration,
    drawdownPeriods: periods,
  };
}
