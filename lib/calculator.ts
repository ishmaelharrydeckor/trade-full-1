// lib/calculator.ts
// Position-sizing math. Each instrument has a contract value (units of base
// currency per 1 lot); the calculator uses that + price distance + risk-parts
// to compute exact lot size.

export interface InstrumentContract {
  symbol: string;
  display: string;
  contractValue: number; // dollar move per 1 lot per 1 unit of price
  category: "forex" | "forex_jpy" | "metals" | "crypto" | "indices";
}

// Standard MT5 contract sizes. Some brokers vary (Deriv synthetics, exotic indices)
// — the UI lets the user override.
export const CONTRACT_PRESETS: InstrumentContract[] = [
  // Forex majors
  { symbol: "EURUSD", display: "EUR/USD",          contractValue: 100000, category: "forex" },
  { symbol: "GBPUSD", display: "GBP/USD",          contractValue: 100000, category: "forex" },
  { symbol: "AUDUSD", display: "AUD/USD",          contractValue: 100000, category: "forex" },
  { symbol: "NZDUSD", display: "NZD/USD",          contractValue: 100000, category: "forex" },
  { symbol: "USDCAD", display: "USD/CAD",          contractValue: 100000, category: "forex" },
  { symbol: "USDCHF", display: "USD/CHF",          contractValue: 100000, category: "forex" },
  // Forex JPY pairs
  { symbol: "USDJPY", display: "USD/JPY",          contractValue: 100000, category: "forex_jpy" },
  { symbol: "EURJPY", display: "EUR/JPY",          contractValue: 100000, category: "forex_jpy" },
  { symbol: "GBPJPY", display: "GBP/JPY",          contractValue: 100000, category: "forex_jpy" },
  // Metals
  { symbol: "XAUUSD", display: "Gold (XAU/USD)",   contractValue: 100,    category: "metals" },
  { symbol: "XAGUSD", display: "Silver (XAG/USD)", contractValue: 5000,   category: "metals" },
  // Crypto (1 unit per lot on most MT5 brokers)
  { symbol: "BTCUSD", display: "Bitcoin (BTC/USD)", contractValue: 1,     category: "crypto" },
  { symbol: "ETHUSD", display: "Ethereum (ETH/USD)", contractValue: 1,    category: "crypto" },
  // Indices (1 USD per point per lot for most brokers)
  { symbol: "US30",   display: "Dow Jones (US30)",  contractValue: 1,     category: "indices" },
  { symbol: "NAS100", display: "Nasdaq 100",        contractValue: 1,     category: "indices" },
  { symbol: "US500",  display: "S&P 500",           contractValue: 1,     category: "indices" },
];

export interface SizingResult {
  riskAmount: number;     // $ at risk
  riskPercent: number;    // % of equity (1 / parts × 100)
  priceDistance: number;
  lotsRaw: number;        // exact theoretical lots
  lots: number;           // floored to 0.01
  warning?: string;
}

export function calculatePositionSize(params: {
  equity: number;
  riskParts: number;
  entryPrice: number;
  stopLoss: number;
  contractValue: number;
}): SizingResult {
  const { equity, riskParts, entryPrice, stopLoss, contractValue } = params;
  const riskAmount = equity > 0 ? equity / riskParts : 0;
  const riskPercent = (1 / riskParts) * 100;
  const priceDistance = Math.abs(entryPrice - stopLoss);

  if (priceDistance === 0 || contractValue === 0 || equity <= 0) {
    return {
      riskAmount,
      riskPercent,
      priceDistance,
      lotsRaw: 0,
      lots: 0,
      warning:
        equity <= 0
          ? "Set a starting balance on this account first"
          : "Stop loss must differ from entry",
    };
  }

  const lotsRaw = riskAmount / (priceDistance * contractValue);
  // Round DOWN to 0.01 — never round up risk
  const lots = Math.floor(lotsRaw * 100) / 100;

  let warning: string | undefined;
  if (lots < 0.01) {
    warning = `Calculated size (${lotsRaw.toFixed(4)} lots) is below the 0.01 minimum. Consider a wider stop or smaller account risk parts.`;
  }

  return { riskAmount, riskPercent, priceDistance, lotsRaw, lots, warning };
}
