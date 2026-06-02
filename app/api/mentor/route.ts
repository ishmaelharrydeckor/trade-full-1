import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get links where user is mentor OR mentee
  const { data: links, error } = await supabase
    .from("mentor_links")
    .select("*")
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: links ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { accountId, mentorEmail } = body;
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  // Verify mentee owns this account
  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("id", accountId)
    .maybeSingle();
  if (!account || account.user_id !== user.id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Create a pending invite link (mentor will be set when they accept)
  const { data: link, error } = await supabase
    .from("mentor_links")
    .insert({
      mentee_id: user.id,
      mentor_id: user.id, // placeholder, updated on accept
      account_id: accountId,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link });
}
