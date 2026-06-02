// lib/admin.ts
// Server-side admin check. Returns true if the current user has is_admin=true
// on their profile. Used to gate /admin pages and API routes.

import { createClient } from "./supabase/server";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.is_admin === true;
}
