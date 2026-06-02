// lib/csv-parser.ts
// Universal CSV-to-trades parser. Auto-detects columns from common broker
// formats (MT5, MT4, cTrader, generic broker exports) by header keyword match.

import Papa from "papaparse";
import type { Direction, AssetClass } from "@/types/database";

// ===========================================================
// Broker format detection
// ===========================================================
export interface BrokerFormat {
  name: string;
  detect: (headers: string[]) => boolean;
  mapping: Record<string, string>; // broker column name -> our field name
}

export const BROKER_FORMATS: BrokerFormat[] = [
  {
    name: "MetaTrader 4/5",
    detect: (h) => h.some(c => c.toLowerCase() === "ticket") && h.some(c => c.toLowerCase() === "open price"),
    mapping: {
      "ticket": "external_trade_id",
      "open price": "entry_price",
      "close price": "exit_price",
      "open time": "open_time",
      "close time": "close_time",
      "profit": "pnl",
      "commission": "commission",
      "swap": "swap",
      "volume": "volume",
      "type": "direction",
      "symbol": "symbol",
      "s/l": "stop_loss",
      "t/p": "take_profit",
    },
  },
  {
    name: "cTrader",
    detect: (h) => h.some(c => c.toLowerCase() === "position id") && h.some(c => c.toLowerCase() === "entry price"),
    mapping: {
      "position id": "external_trade_id",
      "entry price": "entry_price",
      "closing price": "exit_price",
      "opening time": "open_time",
      "closing time": "close_time",
      "net profit": "pnl",
      "commission": "commission",
      "swap": "swap",
      "quantity": "volume",
      "direction": "direction",
      "symbol name": "symbol",
      "stop loss": "stop_loss",
      "take profit": "take_profit",
    },
  },
  {
    name: "TradingView",
    detect: (h) => h.some(c => c.toLowerCase() === "trade #") && h.some(c => c.toLowerCase() === "signal"),
    mapping: {
      "trade #": "external_trade_id",
      "price": "entry_price",
      "close price": "exit_price",
      "date/time": "open_time",
      "close date/time": "close_time",
      "profit": "pnl",
      "contracts": "volume",
      "signal": "direction",
      "symbol": "symbol",
    },
  },
  {
    name: "Interactive Brokers (Flex)",
    detect: (h) => h.some(c => c.toLowerCase() === "tradeid") && h.some(c => c.toLowerCase() === "ibcommission"),
    mapping: {
      "tradeid": "external_trade_id",
      "tradeprice": "entry_price",
      "closeprice": "exit_price",
      "datetime": "open_time",
      "ibcommission": "commission",
      "quantity": "volume",
      "buysell": "direction",
      "symbol": "symbol",
      "realizedpnl": "pnl",
    },
  },
  {
    name: "Thinkorswim (TDA)",
    detect: (h) => h.some(c => c.toLowerCase() === "exec time") && h.some(c => c.toLowerCase() === "spread"),
    mapping: {
      "exec time": "open_time",
      "spread": "symbol",
      "side": "direction",
      "qty": "volume",
      "price": "entry_price",
      "net price": "exit_price",
      "order id": "external_trade_id",
    },
  },
];

export function detectBrokerFormat(headers: string[]): BrokerFormat | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const fmt of BROKER_FORMATS) {
    if (fmt.detect(lower)) return fmt;
  }
  return null;
}

export interface ParsedTradeRow {
  // mapped fields (all optional — we try our best, skip rows missing essentials)
  external_trade_id: string | null;
  symbol: string | null;
  direction: Direction | null;
  volume: number | null;
  entry_price: number | null;
  exit_price: number | null;
  open_time: string | null;       // ISO
  close_time: string | null;      // ISO
  pnl: number | null;
  commission: number;
  swap: number;
  stop_loss: number | null;
  take_profit: number | null;
  // diagnostic
  _rowNumber: number;
  _raw: Record<string, string>;
  _errors: string[];
}

export interface ParseResult {
  rows: ParsedTradeRow[];
  validCount: number;
  errorCount: number;
  detectedColumns: Record<string, string | null>;
  rawHeaders: string[];
}

// ===========================================================
// Column synonyms — match a header (lowercased) to a field.
// First-match wins, ordered by specificity.
// ===========================================================
const SYNONYMS: Record<string, string[]> = {
  external_trade_id: ["ticket", "order id", "order_id", "deal id", "deal_id", "position id", "position_id", "trade id", "trade_id", "order #", "ticket #", "id"],
  symbol: ["symbol", "ticker", "instrument", "pair", "asset"],
  direction: ["direction", "type", "side", "action", "buy/sell"],
  volume: ["volume", "lots", "lot size", "lot_size", "size", "quantity", "qty", "amount"],
  entry_price: ["open price", "open_price", "entry price", "entry_price", "price open", "entry", "open"],
  exit_price: ["close price", "close_price", "exit price", "exit_price", "price close", "exit", "close"],
  open_time: ["open time", "open_time", "open date", "entry time", "entry_time", "date open", "time open", "time", "date"],
  close_time: ["close time", "close_time", "close date", "exit time", "exit_time", "date close", "time close"],
  pnl: ["profit", "pnl", "p/l", "p&l", "net profit", "net_profit", "gain", "result", "net pnl"],
  commission: ["commission", "comm", "fee", "fees"],
  swap: ["swap", "rollover", "interest", "swap fee"],
  stop_loss: ["stop loss", "stoploss", "stop_loss", "s/l", "sl"],
  take_profit: ["take profit", "takeprofit", "take_profit", "t/p", "tp"],
};

function detectColumns(headers: string[]): Record<string, string | null> {
  const lcHeaders = headers.map((h) => h.toLowerCase().trim());
  const map: Record<string, string | null> = {};

  for (const [field, synonymList] of Object.entries(SYNONYMS)) {
    map[field] = null;
    for (const synonym of synonymList) {
      const idx = lcHeaders.indexOf(synonym);
      if (idx >= 0) {
        map[field] = headers[idx];
        break;
      }
    }
  }
  return map;
}

// ===========================================================
// Value normalizers
// ===========================================================
function normalizeDirection(v: string | undefined | null): Direction | null {
  if (!v) return null;
  const lc = v.toLowerCase().trim();
  if (lc === "buy" || lc === "long" || lc === "b" || lc === "1") return "long";
  if (lc === "sell" || lc === "short" || lc === "s" || lc === "0" || lc === "-1") return "short";
  // MT5 "type" field can be "Buy" or "Sell" but also "Balance" (deposits) — skip those
  return null;
}

function normalizeNumber(v: string | undefined | null): number | null {
  if (v == null || v === "") return null;
  // Remove thousand separators (commas/spaces) — common in broker exports
  const cleaned = String(v).replace(/[\s,]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function normalizeDateTime(v: string | undefined | null): string | null {
  if (!v) return null;
  const trimmed = String(v).trim();
  if (!trimmed) return null;

  // Try direct Date parse (handles ISO and many common formats)
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString();

  // Try MT5 format: "2024.01.15 14:30:00" → "2024-01-15 14:30:00"
  const mt5 = trimmed.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3");
  d = new Date(mt5);
  if (!isNaN(d.getTime())) return d.toISOString();

  // Try DD/MM/YYYY HH:MM
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}${dmy[4]}`;
    d = new Date(iso);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

// ===========================================================
// Main parser
// ===========================================================
export function parseTradesCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rawHeaders = parsed.meta.fields ?? [];
  const detected = detectColumns(rawHeaders);
  const rows: ParsedTradeRow[] = [];

  parsed.data.forEach((raw, idx) => {
    const errors: string[] = [];
    const getField = (field: string): string | undefined => {
      const col = detected[field];
      if (!col) return undefined;
      return raw[col];
    };

    const symbol = getField("symbol")?.trim() || null;
    const direction = normalizeDirection(getField("direction"));
    const volume = normalizeNumber(getField("volume"));
    const entryPrice = normalizeNumber(getField("entry_price"));
    const exitPrice = normalizeNumber(getField("exit_price"));
    const openTime = normalizeDateTime(getField("open_time"));
    const closeTime = normalizeDateTime(getField("close_time"));
    const pnl = normalizeNumber(getField("pnl"));
    const commission = normalizeNumber(getField("commission")) ?? 0;
    const swap = normalizeNumber(getField("swap")) ?? 0;
    const stopLoss = normalizeNumber(getField("stop_loss"));
    const takeProfit = normalizeNumber(getField("take_profit"));
    const externalId = getField("external_trade_id")?.trim() || null;

    // Validate essentials. If any are missing, mark as error but keep the row.
    if (!symbol) errors.push("missing symbol");
    if (!direction) errors.push("invalid/missing direction");
    if (volume == null || volume <= 0) errors.push("invalid volume");
    if (entryPrice == null) errors.push("missing entry price");
    if (exitPrice == null) errors.push("missing exit price");
    if (!openTime) errors.push("missing open time");
    if (!closeTime) errors.push("missing close time");

    rows.push({
      external_trade_id: externalId,
      symbol,
      direction,
      volume,
      entry_price: entryPrice,
      exit_price: exitPrice,
      open_time: openTime,
      close_time: closeTime,
      pnl,
      commission,
      swap,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      _rowNumber: idx + 2, // +1 for 1-indexed, +1 because header is row 1
      _raw: raw,
      _errors: errors,
    });
  });

  const validCount = rows.filter((r) => r._errors.length === 0).length;
  const errorCount = rows.length - validCount;

  return {
    rows,
    validCount,
    errorCount,
    detectedColumns: detected,
    rawHeaders,
  };
}

// ===========================================================
// Guess the asset class from the symbol
// ===========================================================
export function guessAssetClass(symbol: string): AssetClass | null {
  const s = symbol.toUpperCase();
  // Crypto
  if (/^(BTC|ETH|SOL|XRP|ADA|DOGE|BNB|MATIC|DOT|AVAX|LTC|LINK|UNI|TRX|XLM|BCH|FIL|ATOM|NEAR|APE|SHIB)/.test(s)) return "crypto";
  // Metals / commodities
  if (/^(XAU|XAG|XPT|XPD|GOLD|SILVER)/.test(s)) return "commodities";
  if (/^(WTI|BRENT|UKOIL|USOIL|NATGAS|XBR|XTI)/.test(s)) return "commodities";
  // Synthetics (Deriv)
  if (/^(V\d+|VOL|BOOM|CRASH|JUMP|STEP|RANGE_BREAK)/.test(s)) return "synthetics";
  // Indices
  if (/^(US30|US100|US500|NAS100|SPX|NDX|DJI|UK100|GER40|DE40|FRA40|JPN225|HK50|AUS200)/.test(s)) return "indices";
  // Forex (6-char with 3-letter currency codes)
  if (/^[A-Z]{3}[A-Z]{3}m?$/i.test(s)) return "forex";
  // Default: best guess is forex if 6 chars, otherwise null
  return null;
}
