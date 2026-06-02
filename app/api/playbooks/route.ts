import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const { data: playbooks, error } = await supabase
    .from("playbooks")
    .select("*")
    .eq("account_id", accountId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playbooks: playbooks ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { accountId, name, description, rules, tags } = body;
  if (!accountId || !name) {
    return NextResponse.json({ error: "accountId and name are required" }, { status: 400 });
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

  const { data: playbook, error } = await supabase
    .from("playbooks")
    .insert({
      user_id: user.id,
      account_id: accountId,
      name,
      description: description || null,
      rules: rules || [],
      tags: tags || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playbook });
}
