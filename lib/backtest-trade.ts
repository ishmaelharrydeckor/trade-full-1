// lib/backtest-trade.ts
// Math + state helpers for backtest trades.

export interface BacktestOpenPosition {
  id: string;             // client-generated UUID (so we don't roundtrip to DB to get one)
  symbol: string;
  direction: "long" | "short";
  volume: number;
  entry_price: number;
  entry_time: string;     // ISO timestamp (the bar where the trade opened)
  entry_bar_index: number; // for rendering markers
  stop_loss: number | null;
  take_profit: number | null;
  mindset: string | null;
  notes: string | null;
  tags: string[];
}

export interface SlTpHit {
  type: "sl" | "tp";
  hit_price: number;
}

/**
 * Returns the P&L of a closed trade in dollars.
 */
export function computePnl({
  direction,
  entry,
  exit,
  volume,
  contractValue,
}: {
  direction: "long" | "short";
  entry: number;
  exit: number;
  volume: number;
  contractValue: number;
}): number {
  const sign = direction === "long" ? 1 : -1;
  return sign * (exit - entry) * volume * contractValue;
}

/**
 * Given a new bar, check whether the position's SL or TP was touched. We're
 * pessimistic: if both could hit in the same bar, we assume SL hit first
 * (worst-case for the trader). Returns null if neither touched.
 */
export function checkSlTpHit(
  position: BacktestOpenPosition,
  bar: { high: number; low: number }
): SlTpHit | null {
  const { direction, stop_loss, take_profit } = position;

  if (direction === "long") {
    // SL is below entry: touched if bar low <= SL
    if (stop_loss != null && bar.low <= stop_loss) {
      return { type: "sl", hit_price: stop_loss };
    }
    // TP is above entry: touched if bar high >= TP
    if (take_profit != null && bar.high >= take_profit) {
      return { type: "tp", hit_price: take_profit };
    }
  } else {
    // SHORT
    // SL is above entry: touched if bar high >= SL
    if (stop_loss != null && bar.high >= stop_loss) {
      return { type: "sl", hit_price: stop_loss };
    }
    // TP is below entry: touched if bar low <= TP
    if (take_profit != null && bar.low <= take_profit) {
      return { type: "tp", hit_price: take_profit };
    }
  }
  return null;
}

/**
 * Compute unrealized P&L of an open position given the current bar close.
 */
export function unrealizedPnl(
  position: BacktestOpenPosition,
  currentPrice: number,
  contractValue: number
): number {
  return computePnl({
    direction: position.direction,
    entry: position.entry_price,
    exit: currentPrice,
    volume: position.volume,
    contractValue,
  });
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (older browsers)
  return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
