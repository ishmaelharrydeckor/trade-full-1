// lib/stats.ts
// KPI calculations for the trade journal dashboard.
// All functions are pure and handle empty / edge-case inputs gracefully.

export interface Trade {
  pnl?: number | null;
  r_multiple?: number | null;
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  direction?: "buy" | "sell" | string;
  open_time?: string;
  close_time?: string;
}

/** Safe division — returns `fallback` (default 0) when denominator is 0 or NaN */
export const safeDivide = (
  numerator: number,
  denominator: number,
  fallback = 0
): number => {
  if (!denominator || !isFinite(denominator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

/** Net P&L across all trades */
export function netPnl(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
}

/** Win rate as a percentage (0–100) */
export function winRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
  return safeDivide(wins * 100, trades.length);
}

/** Average R-multiple across closed trades that have an R value */
export function avgR(trades: Trade[]): number {
  const withR = trades.filter(
    (t) => t.r_multiple != null && isFinite(t.r_multiple)
  );
  if (withR.length === 0) return 0;
  const sum = withR.reduce((s, t) => s + (t.r_multiple ?? 0), 0);
  return safeDivide(sum, withR.length);
}

/** Profit factor: gross profit / gross loss. Returns Infinity when no losses. */
export function profitFactor(trades: Trade[]): number {
  const grossProfit = trades
    .filter((t) => (t.pnl ?? 0) > 0)
    .reduce((s, t) => s + (t.pnl ?? 0), 0);

  const grossLoss = trades
    .filter((t) => (t.pnl ?? 0) < 0)
    .reduce((s, t) => s + Math.abs(t.pnl ?? 0), 0);

  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return safeDivide(grossProfit, grossLoss);
}

/** Maximum drawdown in account currency */
export function maxDrawdown(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  let peak = 0;
  let equity = 0;
  let maxDD = 0;

  for (const t of trades) {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

/** Consecutive win/loss streaks. Returns { bestWin, worstLoss } */
export function streaks(trades: Trade[]): { bestWin: number; worstLoss: number } {
  if (trades.length === 0) return { bestWin: 0, worstLoss: 0 };

  let bestWin = 0;
  let worstLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;

  for (const t of trades) {
    const pnl = t.pnl ?? 0;
    if (pnl > 0) {
      currentWin++;
      currentLoss = 0;
      if (currentWin > bestWin) bestWin = currentWin;
    } else if (pnl < 0) {
      currentLoss++;
      currentWin = 0;
      if (currentLoss > worstLoss) worstLoss = currentLoss;
    } else {
      currentWin = 0;
      currentLoss = 0;
    }
  }

  return { bestWin, worstLoss };
}

/** Build cumulative equity curve data for Recharts */
export function equityCurve(
  trades: Trade[]
): { index: number; equity: number; drawdown: number }[] {
  if (trades.length === 0) return [];

  let equity = 0;
  let peak = 0;
  const points: { index: number; equity: number; drawdown: number }[] = [];

  trades.forEach((t, i) => {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
    const drawdown = peak > 0 ? safeDivide((peak - equity) * 100, peak) : 0;
    points.push({ index: i + 1, equity: parseFloat(equity.toFixed(2)), drawdown: parseFloat(drawdown.toFixed(2)) });
  });

  return points;
}
