// app/api/ea/download/route.ts
// GET /api/ea/download?accountId=<uuid>
// Returns a customized .mq5 file with the user's account token baked in.
// The user just drops it into MT5 and runs — no copy-paste required.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EA_TEMPLATE } from "@/lib/ea-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // RLS limits this to the user's own accounts
  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, ea_token")
    .eq("id", accountId)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Compute base URL from the current request so the EA always points to
  // the right backend (works for prod, preview deploys, localhost, etc.)
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Substitute the two placeholders
  const customized = EA_TEMPLATE.replace(/__EA_TOKEN__/g, account.ea_token).replace(
    /__WEBHOOK_URL__/g,
    baseUrl
  );

  // Sanitize filename — strip anything that isn't alnum/dash/underscore
  const safeName = account.name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);

  return new NextResponse(customized, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="TradeFull1_${safeName}.mq5"`,
      "Cache-Control": "no-store",
    },
  });
}
