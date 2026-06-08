// app/auth/callback/route.ts
// Handles the callback from email confirmation links and OAuth redirects.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange fails but the user is already authenticated locally,
  // redirect them to the intended page (e.g. /reset-password) where they can still update their password.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
