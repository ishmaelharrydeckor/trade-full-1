// app/api/backtest/sessions/route.ts
// GET    /api/backtest/sessions?accountId=...   → list sessions
// POST   /api/backtest/sessions                 → create session
// DELETE /api/backtest/sessions?sessionId=...   → delete session

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInstrument } from "@/lib/backtest-instruments";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId)
    return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const { data } = await supabase
    .from("backtest_sessions")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const {
    accountId,
    name,
    symbol,
    timeframe,
    rangeStart,
    rangeEnd,
    startingBalance,
  } = body;

  if (!accountId || !symbol || !timeframe || !rangeStart || !rangeEnd) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const instrument = getInstrument(symbol);
  if (!instrument) {
    return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  }

  // Verify account ownership
  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("id", accountId)
    .maybeSingle();
  if (!account || account.user_id !== user.id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: session, error } = await supabase
    .from("backtest_sessions")
    .insert({
      user_id: user.id,
      account_id: accountId,
      name: name?.trim() || `${symbol} ${timeframe}`,
      symbol,
      asset_class: instrument.assetClass,
      timeframe,
      range_start: rangeStart,
      range_end: rangeEnd,
      current_bar_time: rangeStart,
      starting_balance: Number(startingBalance) || 10000,
      data_source: instrument.dataSource,
      status: "active",
    })
    .select("*")
    .single();

  if (error || !session) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ session });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId)
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  // RLS will reject if not the owner
  const { error } = await supabase
    .from("backtest_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
