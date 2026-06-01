// app/api/ea/sync/positions/route.ts
// POST /api/ea/sync/positions
// Auth: Authorization: Bearer <ea_token>
// Body: { positions: PositionPayload[] }
//
// Each EA tick (every 10s) sends a complete snapshot of currently-open
// positions. We:
//   1. Upsert each one (so prices + unrealized PnL stay fresh)
//   2. Delete any rows for this account that AREN'T in the snapshot
//      (those positions were closed in MT5 — their close will arrive
//       on the /trades endpoint via OnTradeTransaction).
//
// Pushing an empty array clears all open positions for the account.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PositionPayload {
  external_position_id: string;
  symbol: string;
  direction: "long" | "short";
  volume: number;
  entry_price: number;
  current_price?: number;
  stop_loss?: number;
  take_profit?: number;
  open_time: string;
  unrealized_pnl?: number;
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();

  const admin = createServiceClient();
  const { data: account } = await admin
    .from("accounts")
    .select("id, user_id")
    .eq("ea_token", token)
    .maybeSingle();
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    positions?: PositionPayload[];
  } | null;
  if (!body || !Array.isArray(body.positions)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const positions = body.positions;

  // ---- Upsert current open positions ----
  if (positions.length > 0) {
    const records = positions.map((p) => ({
      user_id: account.user_id,
      account_id: account.id,
      external_position_id: String(p.external_position_id),
      symbol: p.symbol,
      direction: p.direction,
      volume: Number(p.volume) || 0,
      entry_price: Number(p.entry_price) || 0,
      current_price: p.current_price != null ? Number(p.current_price) : null,
      stop_loss:
        p.stop_loss != null && p.stop_loss > 0 ? Number(p.stop_loss) : null,
      take_profit:
        p.take_profit != null && p.take_profit > 0
          ? Number(p.take_profit)
          : null,
      open_time: p.open_time,
      unrealized_pnl:
        p.unrealized_pnl != null ? Number(p.unrealized_pnl) : null,
      synced_at: now,
    }));

    const { error: upsertErr } = await admin
      .from("open_positions")
      .upsert(records, { onConflict: "account_id,external_position_id" });
    if (upsertErr) {
      return NextResponse.json(
        { error: `Upsert failed: ${upsertErr.message}` },
        { status: 500 }
      );
    }
  }

  // ---- Delete positions that aren't in the current snapshot ----
  let deleteQuery = admin
    .from("open_positions")
    .delete()
    .eq("account_id", account.id);

  if (positions.length > 0) {
    const idList = positions
      .map((p) => `"${String(p.external_position_id).replace(/"/g, '\\"')}"`)
      .join(",");
    deleteQuery = deleteQuery.not(
      "external_position_id",
      "in",
      `(${idList})`
    );
  }
  // If positions.length === 0, deleteQuery has no .not() clause → deletes ALL
  // positions for this account, which is correct (no positions are open).

  const { error: delErr } = await deleteQuery;
  if (delErr) {
    // Non-fatal — log but still return ok
    console.error("Failed to clear stale positions:", delErr);
  }

  return NextResponse.json({ ok: true, count: positions.length });
}
