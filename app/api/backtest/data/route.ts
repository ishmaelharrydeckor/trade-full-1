// app/api/backtest/data/route.ts
// GET /api/backtest/data?symbol=BTC/USDT&timeframe=H1&start=<ms>&end=<ms>

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCandles } from "@/lib/data-sources";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!symbol || !timeframe || !start || !end) {
    return NextResponse.json(
      { error: "Missing required parameters: symbol, timeframe, start, end" },
      { status: 400 }
    );
  }

  try {
    const candles = await fetchCandles({
      symbol,
      timeframe,
      startMs: Number(start),
      endMs: Number(end),
    });
    return NextResponse.json({ candles });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
