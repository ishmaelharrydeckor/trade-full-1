// app/api/ea/sync/trades/route.ts
// POST /api/ea/sync/trades
// Auth: Authorization: Bearer <ea_token>
// Body: a single closed-trade payload (see below)
//
// The EA pushes here whenever a position fully closes. We look up the
// account by token (service role bypasses RLS for the lookup), then
// upsert with ignoreDuplicates so re-pushes of the same external_trade_id
// are silently no-ops.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { guessAssetClass } from "@/lib/csv-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TradePayload {
  external_trade_id: string;
  symbol: string;
  direction: "long" | "short";
  volume: number;
  entry_price: number;
  exit_price: number | null;
  open_time: string;
  close_time: string | null;
  pnl: number | null;
  commission?: number;
  swap?: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  risk_amount?: number | null;
}

export async function POST(request: NextRequest) {
  // ---- Auth: validate token ----
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();
  if (token.length < 20) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ---- Look up account by token ----
  const admin = createServiceClient();
  const { data: account, error: accountErr } = await admin
    .from("accounts")
    .select("id, user_id")
    .eq("ea_token", token)
    .maybeSingle();

  if (accountErr) {
    return NextResponse.json(
      { error: `Account lookup failed: ${accountErr.message}` },
      { status: 500 }
    );
  }
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  // ---- Parse + validate body ----
  const body = (await request.json().catch(() => null)) as TradePayload | null;
  if (
    !body ||
    !body.external_trade_id ||
    !body.symbol ||
    (body.direction !== "long" && body.direction !== "short") ||
    typeof body.volume !== "number"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // ---- Upsert (dedup on conflict) ----
  const record = {
    user_id: account.user_id,
    account_id: account.id,
    external_trade_id: String(body.external_trade_id),
    symbol: body.symbol.toUpperCase(),
    asset_class: guessAssetClass(body.symbol),
    direction: body.direction,
    volume: Number(body.volume) || 0,
    entry_price: Number(body.entry_price) || 0,
    exit_price: body.exit_price != null ? Number(body.exit_price) : null,
    open_time: body.open_time,
    close_time: body.close_time,
    pnl: body.pnl != null ? Number(body.pnl) : null,
    commission: body.commission != null ? Number(body.commission) : 0,
    swap: body.swap != null ? Number(body.swap) : 0,
    stop_loss: body.stop_loss != null ? Number(body.stop_loss) : null,
    take_profit: body.take_profit != null ? Number(body.take_profit) : null,
    risk_amount: body.risk_amount != null ? Number(body.risk_amount) : null,
  };

  const { error: writeErr } = await admin.from("trades").upsert(record, {
    onConflict: "account_id,external_trade_id",
    ignoreDuplicates: true,
  });

  if (writeErr) {
    return NextResponse.json(
      { error: `Insert failed: ${writeErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
