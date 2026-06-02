// app/api/accounts/[id]/rotate-token/route.ts
// POST — generate a new ea_token, invalidating the old one. Any EA still
// using the old token will get 401 on next sync until re-downloaded.

import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!account || account.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate a fresh token (32 bytes -> 64 hex chars)
  const newToken = crypto.randomBytes(32).toString("hex");

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("accounts")
    .update({ ea_token: newToken })
    .eq("id", params.id)
    .select("ea_token")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to rotate token" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ea_token: data.ea_token });
}
