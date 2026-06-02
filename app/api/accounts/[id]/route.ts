// app/api/accounts/[id]/route.ts
// PATCH  — edit account info (name, broker, account_number, starting_balance, archived)
// DELETE — hard-delete account (cascades to trades/transactions/etc via FK)

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EDITABLE = [
  "name",
  "broker",
  "account_number",
  "starting_balance",
  "archived",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  for (const field of EDITABLE) {
    if (body[field] === undefined) continue;
    let v = body[field];
    if (field === "name" || field === "broker" || field === "account_number") {
      v = v == null ? null : String(v).trim().slice(0, 200);
    }
    if (field === "starting_balance") {
      const n = Number(v);
      if (isNaN(n) || n < 0) {
        return NextResponse.json(
          { error: "starting_balance must be a non-negative number" },
          { status: 400 }
        );
      }
      v = n;
    }
    if (field === "archived") {
      v = Boolean(v);
    }
    updates[field] = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // RLS enforces ownership
  const { data, error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ account: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Require the account name in the request body as a typo gate
  const body = await request.json().catch(() => ({}));
  const typedName: string | undefined = body.confirm_name;

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, user_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!account || account.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (typedName !== account.name) {
    return NextResponse.json(
      { error: "Confirmation name does not match. Type the exact account name." },
      { status: 400 }
    );
  }

  // CASCADE deletes trades/transactions/etc via FK constraints set in earlier migrations
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
