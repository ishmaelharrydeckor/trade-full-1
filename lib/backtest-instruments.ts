// lib/backtest-instruments.ts
// Static list of instruments available for backtesting + timeframe mapping
// to provider-specific values.

export interface BacktestInstrument {
  symbol: string;          // canonical: "BTC/USDT", "EUR/USD"
  display: string;         // shown in the UI
  assetClass: "crypto" | "forex" | "metals" | "indices";
  dataSource: "binance" | "twelvedata";
  providerSymbol: string;  // exact string to pass to provider API
  contractValue: number;   // units per 1 lot (used for P&L math)
}

export const BACKTEST_INSTRUMENTS: BacktestInstrument[] = [
  // Crypto (Binance — free, no key). 1 unit per lot on most MT5 brokers.
  { symbol: "BTC/USDT", display: "Bitcoin (BTC/USDT)",  assetClass: "crypto",  dataSource: "binance",    providerSymbol: "BTCUSDT", contractValue: 1 },
  { symbol: "ETH/USDT", display: "Ethereum (ETH/USDT)", assetClass: "crypto",  dataSource: "binance",    providerSymbol: "ETHUSDT", contractValue: 1 },
  { symbol: "BNB/USDT", display: "BNB (BNB/USDT)",      assetClass: "crypto",  dataSource: "binance",    providerSymbol: "BNBUSDT", contractValue: 1 },
  { symbol: "SOL/USDT", display: "Solana (SOL/USDT)",   assetClass: "crypto",  dataSource: "binance",    providerSymbol: "SOLUSDT", contractValue: 1 },
  { symbol: "XRP/USDT", display: "Ripple (XRP/USDT)",   assetClass: "crypto",  dataSource: "binance",    providerSymbol: "XRPUSDT", contractValue: 1 },
  // Forex (TwelveData — free key required). 100,000 units per standard lot.
  { symbol: "EUR/USD",  display: "Euro / Dollar",       assetClass: "forex",   dataSource: "twelvedata", providerSymbol: "EUR/USD", contractValue: 100000 },
  { symbol: "GBP/USD",  display: "Pound / Dollar",      assetClass: "forex",   dataSource: "twelvedata", providerSymbol: "GBP/USD", contractValue: 100000 },
  { symbol: "USD/JPY",  display: "Dollar / Yen",        assetClass: "forex",   dataSource: "twelvedata", providerSymbol: "USD/JPY", contractValue: 100000 },
  { symbol: "AUD/USD",  display: "Aussie / Dollar",     assetClass: "forex",   dataSource: "twelvedata", providerSymbol: "AUD/USD", contractValue: 100000 },
  { symbol: "USD/CAD",  display: "Dollar / Loonie",     assetClass: "forex",   dataSource: "twelvedata", providerSymbol: "USD/CAD", contractValue: 100000 },
  // Metals (TwelveData). Gold = 100 oz/lot, Silver = 5,000 oz/lot.
  { symbol: "XAU/USD",  display: "Gold (XAU/USD)",      assetClass: "metals",  dataSource: "twelvedata", providerSymbol: "XAU/USD", contractValue: 100 },
  { symbol: "XAG/USD",  display: "Silver (XAG/USD)",    assetClass: "metals",  dataSource: "twelvedata", providerSymbol: "XAG/USD", contractValue: 5000 },
];

export interface Timeframe {
  id: string;
  label: string;
  binance: string;
  twelvedata: string;
  seconds: number;
}

export const TIMEFRAMES: Timeframe[] = [
  { id: "M1",  label: "1 min",   binance: "1m",  twelvedata: "1min",  seconds: 60 },
  { id: "M5",  label: "5 min",   binance: "5m",  twelvedata: "5min",  seconds: 300 },
  { id: "M15", label: "15 min",  binance: "15m", twelvedata: "15min", seconds: 900 },
  { id: "H1",  label: "1 hour",  binance: "1h",  twelvedata: "1h",    seconds: 3600 },
  { id: "H4",  label: "4 hours", binance: "4h",  twelvedata: "4h",    seconds: 14400 },
  { id: "D1",  label: "1 day",   binance: "1d",  twelvedata: "1day",  seconds: 86400 },
];

export function getInstrument(symbol: string) {
  return BACKTEST_INSTRUMENTS.find((i) => i.symbol === symbol);
}

export function getTimeframe(id: string) {
  return TIMEFRAMES.find((t) => t.id === id);
}
