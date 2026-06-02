// app/api/backtest/sessions/[sessionId]/route.ts
// PATCH /api/backtest/sessions/<id>  — update playback position or status

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (body.current_bar_time !== undefined) {
    updates.current_bar_time = body.current_bar_time;
  }
  if (body.status !== undefined) {
    if (!["active", "completed", "archived"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.name !== undefined) {
    updates.name = String(body.name).trim().slice(0, 200);
  }
  if (body.open_positions !== undefined) {
    if (!Array.isArray(body.open_positions)) {
      return NextResponse.json(
        { error: "open_positions must be an array" },
        { status: 400 }
      );
    }
    updates.open_positions = body.open_positions;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  // RLS enforces ownership
  const { data, error } = await supabase
    .from("backtest_sessions")
    .update(updates)
    .eq("id", params.sessionId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ session: data });
}
