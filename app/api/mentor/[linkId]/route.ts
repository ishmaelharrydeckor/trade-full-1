import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const { data: link, error } = await supabase
    .from("mentor_links")
    .update({ status: body.status ?? "revoked" })
    .eq("id", linkId)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("mentor_links")
    .delete()
    .eq("id", linkId)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
