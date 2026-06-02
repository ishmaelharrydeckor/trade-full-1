import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify there's an active mentor link for this account
  const serviceClient = createServiceClient();
  const { data: link } = await serviceClient
    .from("mentor_links")
    .select("*")
    .eq("account_id", accountId)
    .eq("mentor_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "No active mentoring access" }, { status: 403 });

  // Fetch the account data using service client (bypasses RLS)
  const { data: account } = await serviceClient
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();

  const { data: trades } = await serviceClient
    .from("trades")
    .select("*")
    .eq("account_id", accountId)
    .eq("is_backtest", false)
    .order("close_time", { ascending: false, nullsFirst: false })
    .limit(200);

  const { data: transactions } = await serviceClient
    .from("account_transactions")
    .select("*")
    .eq("account_id", accountId)
    .order("occurred_at", { ascending: false });

  // Fetch mentee profile
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("display_name")
    .eq("id", link.mentee_id)
    .maybeSingle();

  return NextResponse.json({
    account,
    trades: trades ?? [],
    transactions: transactions ?? [],
    menteeName: profile?.display_name ?? "Student",
  });
}
