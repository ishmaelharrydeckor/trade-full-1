// app/api/admin/users/[id]/confirm-email/route.ts
// POST /api/admin/users/<userId>/confirm-email
// Manually sets email_confirmed_at for a user. Admin-only.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.updateUserById(params.id, {
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
