// lib/data-sources.ts
// Fetches OHLC candles from Binance (crypto) or TwelveData (forex/metals).

import { getInstrument, getTimeframe } from "./backtest-instruments";

export interface Candle {
  time: number;      // unix seconds (Lightweight Charts convention)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const MAX_BARS = 1000; // Single-request cap; pagination is a future M4.x enhancement

export async function fetchCandles({
  symbol,
  timeframe,
  startMs,
  endMs,
}: {
  symbol: string;
  timeframe: string;
  startMs: number;
  endMs: number;
}): Promise<Candle[]> {
  const instrument = getInstrument(symbol);
  if (!instrument) throw new Error(`Unknown symbol: ${symbol}`);
  const tf = getTimeframe(timeframe);
  if (!tf) throw new Error(`Unknown timeframe: ${timeframe}`);

  if (instrument.dataSource === "binance") {
    return fetchBinance(instrument.providerSymbol, tf.binance, startMs, endMs);
  }
  if (instrument.dataSource === "twelvedata") {
    const key = process.env.TWELVEDATA_API_KEY;
    if (!key) {
      throw new Error(
        "TwelveData API key not configured. Get a free key at https://twelvedata.com/account/api-keys and add TWELVEDATA_API_KEY to your environment variables."
      );
    }
    return fetchTwelveData(instrument.providerSymbol, tf.twelvedata, startMs, endMs, key);
  }
  throw new Error(`Unsupported data source: ${instrument.dataSource}`);
}

// ===========================================================
// Binance (crypto)
// ===========================================================
async function fetchBinance(
  providerSymbol: string,
  interval: string,
  startMs: number,
  endMs: number
): Promise<Candle[]> {
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", providerSymbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("startTime", String(startMs));
  url.searchParams.set("endTime", String(endMs));
  url.searchParams.set("limit", String(MAX_BARS));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Binance ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as Array<
    [number, string, string, string, string, string, ...unknown[]]
  >;
  // Format: [openTime, open, high, low, close, volume, closeTime, ...]
  return data.map((k) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// ===========================================================
// TwelveData (forex + metals)
// ===========================================================
async function fetchTwelveData(
  providerSymbol: string,
  interval: string,
  startMs: number,
  endMs: number,
  apiKey: string
): Promise<Candle[]> {
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", providerSymbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("start_date", new Date(startMs).toISOString().slice(0, 19));
  url.searchParams.set("end_date", new Date(endMs).toISOString().slice(0, 19));
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("format", "JSON");
  url.searchParams.set("outputsize", String(MAX_BARS));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TwelveData ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    status?: string;
    message?: string;
    values?: Array<{
      datetime: string;
      open: string;
      high: string;
      low: string;
      close: string;
    }>;
  };
  if (data.status === "error") {
    throw new Error(`TwelveData: ${data.message ?? "Unknown error"}`);
  }
  const values = data.values ?? [];

  // TwelveData returns descending; reverse to chronological for the chart
  return values
    .map((v) => ({
      time: Math.floor(new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .sort((a, b) => a.time - b.time);
}
