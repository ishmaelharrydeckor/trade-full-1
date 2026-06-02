// app/api/backtest/sessions/[sessionId]/trade/route.ts
// POST: insert a CLOSED backtest trade into the trades table.
// Open positions are persisted on the session row's open_positions JSONB.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const {
    symbol,
    asset_class,
    direction,
    volume,
    entry_price,
    exit_price,
    open_time,
    close_time,
    pnl,
    stop_loss,
    take_profit,
    mindset,
    notes,
    tags,
    exit_reason, // 'sl' | 'tp' | 'manual'
  } = body;

  // Look up the session to get account_id and verify ownership via RLS
  const { data: session } = await supabase
    .from("backtest_sessions")
    .select("id, account_id, user_id")
    .eq("id", params.sessionId)
    .maybeSingle();
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!symbol || !direction || !volume || entry_price == null || exit_price == null) {
    return NextResponse.json(
      { error: "Missing required trade fields" },
      { status: 400 }
    );
  }

  // Append exit reason to notes so the trade history makes sense
  let mergedNotes = notes || "";
  if (exit_reason && exit_reason !== "manual") {
    const tag = exit_reason === "sl" ? "[Stopped out]" : "[Take profit hit]";
    mergedNotes = mergedNotes ? `${tag} ${mergedNotes}` : tag;
  }

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      account_id: session.account_id,
      symbol,
      asset_class: asset_class ?? null,
      direction,
      volume: Number(volume),
      entry_price: Number(entry_price),
      exit_price: Number(exit_price),
      open_time,
      close_time,
      pnl: Number(pnl) || 0,
      commission: 0,
      swap: 0,
      stop_loss: stop_loss != null ? Number(stop_loss) : null,
      take_profit: take_profit != null ? Number(take_profit) : null,
      mindset: mindset || null,
      notes: mergedNotes || null,
      tags: Array.isArray(tags) ? tags : [],
      is_backtest: true,
      backtest_session_id: params.sessionId,
      external_trade_id: null,
    })
    .select("*")
    .single();

  if (error || !trade) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to insert trade" },
      { status: 500 }
    );
  }
  return NextResponse.json({ trade });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return closed backtest trades for this session
  const { data } = await supabase
    .from("trades")
    .select("*")
    .eq("backtest_session_id", params.sessionId)
    .order("close_time", { ascending: false });

  return NextResponse.json({ trades: data ?? [] });
}
