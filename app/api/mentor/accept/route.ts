import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { inviteCode } = body;
  if (!inviteCode) return NextResponse.json({ error: "inviteCode required" }, { status: 400 });

  // Use service client to find the invite (it may belong to another user)
  const serviceClient = createServiceClient();
  const { data: link } = await serviceClient
    .from("mentor_links")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "pending")
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 404 });
  if (link.mentee_id === user.id) {
    return NextResponse.json({ error: "You cannot mentor yourself" }, { status: 400 });
  }

  // Update the link: set mentor_id and activate
  const { data: updated, error } = await serviceClient
    .from("mentor_links")
    .update({ mentor_id: user.id, status: "active" })
    .eq("id", link.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: updated });
}
