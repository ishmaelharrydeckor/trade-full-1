// app/api/insights/latest/route.ts
// GET /api/insights/latest?accountId=...
// Returns the most recent insight for an account, or null.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  // RLS will filter to the user's own insights, so even if a wrong accountId
  // is passed, we'll just get nothing back.
  const { data: latest } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("account_id", accountId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ insight: latest ?? null });
}
