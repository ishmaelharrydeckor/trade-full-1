// lib/calculator.ts
// Position sizing calculator.
// Handles JPY pairs (pip = 0.01) vs standard pairs (pip = 0.0001).

export interface Instrument {
  symbol: string;
  contractSize: number; // e.g. 100000 for standard forex lot
  description?: string;
}

export const DEFAULT_INSTRUMENTS: Instrument[] = [
  // Forex majors
  { symbol: "EURUSD", contractSize: 100000, description: "Euro / US Dollar" },
  { symbol: "GBPUSD", contractSize: 100000, description: "Pound / US Dollar" },
  { symbol: "AUDUSD", contractSize: 100000, description: "Aussie / US Dollar" },
  { symbol: "NZDUSD", contractSize: 100000, description: "NZD / US Dollar" },
  { symbol: "USDCAD", contractSize: 100000, description: "US Dollar / CAD" },
  { symbol: "USDCHF", contractSize: 100000, description: "US Dollar / CHF" },
  // JPY pairs — pip value = 0.01 (not 0.0001)
  { symbol: "USDJPY", contractSize: 100000, description: "US Dollar / Yen" },
  { symbol: "EURJPY", contractSize: 100000, description: "Euro / Yen" },
  { symbol: "GBPJPY", contractSize: 100000, description: "Pound / Yen" },
  { symbol: "AUDJPY", contractSize: 100000, description: "Aussie / Yen" },
  { symbol: "CADJPY", contractSize: 100000, description: "CAD / Yen" },
  // Metals
  { symbol: "XAUUSD", contractSize: 100, description: "Gold / US Dollar" },
  { symbol: "XAGUSD", contractSize: 5000, description: "Silver / US Dollar" },
  // Crypto
  { symbol: "BTCUSD", contractSize: 1, description: "Bitcoin / USD" },
  { symbol: "ETHUSD", contractSize: 1, description: "Ethereum / USD" },
  // Synthetic indices (Deriv)
  { symbol: "Volatility 75 Index", contractSize: 1, description: "Vol 75" },
  { symbol: "Volatility 100 Index", contractSize: 1, description: "Vol 100" },
];

const JPY_PAIR_REGEX = /JPY/i;

/**
 * Returns the pip value (price increment that equals 1 pip) for a symbol.
 * JPY crosses use 0.01; standard forex pairs use 0.0001.
 * Metals and non-forex instruments typically use 0.01 per point.
 */
export function getPipSize(symbol: string): number {
  if (JPY_PAIR_REGEX.test(symbol)) return 0.01;
  // Gold / Silver
  if (/XAU|XAG/i.test(symbol)) return 0.01;
  // Crypto / synthetic — use 1 (caller passes stop in price units, not pips)
  if (/BTC|ETH|Volatility/i.test(symbol)) return 1;
  return 0.0001;
}

export interface SizingInput {
  accountBalance: number;  // in account currency
  riskPercent: number;     // e.g. 1 for 1%
  entryPrice: number;
  stopLossPrice: number;
  symbol: string;
  contractSize?: number;   // override default instrument contract size
}

export interface SizingResult {
  lotSize: number;
  riskAmount: number;      // in account currency
  pipDistance: number;     // distance in pips
  pipValue: number;        // value per pip per lot (in account currency)
}

/**
 * Calculate position size.
 *
 * Formula:
 *   riskAmount   = balance × (riskPercent / 100)
 *   pipDistance  = |entry - stopLoss| / pipSize
 *   pipValue     = pipSize × contractSize
 *   lotSize      = riskAmount / (pipDistance × pipValue)
 */
export function calculateLotSize(input: SizingInput): SizingResult {
  const {
    accountBalance,
    riskPercent,
    entryPrice,
    stopLossPrice,
    symbol,
  } = input;

  const instrument = DEFAULT_INSTRUMENTS.find(
    (i) => i.symbol.toUpperCase() === symbol.toUpperCase()
  );
  const contractSize = input.contractSize ?? instrument?.contractSize ?? 100000;
  const pipSize = getPipSize(symbol);

  const riskAmount = accountBalance * (riskPercent / 100);
  const rawDistance = Math.abs(entryPrice - stopLossPrice);
  const pipDistance = rawDistance / pipSize;
  const pipValue = pipSize * contractSize;

  // Guard against zero stop loss distance
  if (pipDistance === 0) {
    return { lotSize: 0, riskAmount, pipDistance: 0, pipValue };
  }

  const lotSize = riskAmount / (pipDistance * pipValue);

  return {
    lotSize: Math.round(lotSize * 100) / 100,  // round to 0.01 lot precision
    riskAmount: Math.round(riskAmount * 100) / 100,
    pipDistance: Math.round(pipDistance * 10) / 10,
    pipValue: Math.round(pipValue * 100000) / 100000,
  };
}
