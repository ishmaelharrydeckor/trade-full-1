// app/api/insights/generate/route.ts
// POST /api/insights/generate
// Body: { accountId: string }
// 1. Verifies the user owns the account
// 2. Checks 30-min cooldown — if too recent, returns existing
// 3. Fetches recent trades, calls Gemini, stores result
// 4. Returns { insight, fromCache: boolean }

import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateInsights } from "@/lib/gemini";
import type { Trade } from "@/types/database";

const COOLDOWN_MINUTES = 30;
const FORCE_FLOOR_SECONDS = 60; // even "force regenerate" honors a 60s floor

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accountId: string | undefined = body.accountId;
  const force: boolean = !!body.force;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  // Verify ownership (RLS does this implicitly, but explicit is clearer)
  const { data: account } = await supabase
    .from("accounts")
    .select("id, user_id")
    .eq("id", accountId)
    .maybeSingle();
  if (!account || account.user_id !== user.id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Check cooldown: if a recent insight exists, return it instead of regenerating
  const { data: latest } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("account_id", accountId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) {
    const ageMs = Date.now() - new Date(latest.generated_at).getTime();
    const ageMin = ageMs / 60000;
    const ageSec = ageMs / 1000;

    // Standard cooldown — block regeneration
    if (!force && ageMin < COOLDOWN_MINUTES) {
      return NextResponse.json({
        insight: latest,
        fromCache: true,
        cooldownSecondsRemaining: Math.max(
          0,
          Math.round(COOLDOWN_MINUTES * 60 - ageSec)
        ),
      });
    }

    // Force-regenerate still has a 60s floor — prevents accidental spam
    if (force && ageSec < FORCE_FLOOR_SECONDS) {
      return NextResponse.json(
        {
          error: `Please wait ${Math.ceil(FORCE_FLOOR_SECONDS - ageSec)}s before regenerating.`,
        },
        { status: 429 }
      );
    }
  }

  // Fetch settings (for risk parts)
  const { data: settings } = await supabase
    .from("account_settings")
    .select("risk_parts")
    .eq("account_id", accountId)
    .maybeSingle();
  const riskParts = settings?.risk_parts ?? 10;

  // Fetch recent trades for the prompt
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("account_id", accountId)
    .order("close_time", { ascending: false, nullsFirst: false })
    .limit(50);

  if (!trades || trades.length === 0) {
    return NextResponse.json(
      {
        error:
          "No trades yet. Add or import some trades before generating insights.",
      },
      { status: 400 }
    );
  }

  // Call Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not configured. Add it to your Vercel environment variables.",
      },
      { status: 500 }
    );
  }

  let insightContent;
  try {
    insightContent = await generateInsights({
      trades: trades as Trade[],
      riskParts,
      apiKey,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gemini call failed: ${msg}` },
      { status: 502 }
    );
  }

  // Write via service-role client (bypasses RLS for INSERT, which is correct
  // since the user can SELECT their own rows via RLS but the API performs
  // the write on their behalf).
  const admin = createServiceClient();
  const { data: inserted, error: insertErr } = await admin
    .from("ai_insights")
    .insert({
      user_id: user.id,
      account_id: accountId,
      trades_count: trades.length,
      observations: insightContent.observations,
      blindspots: insightContent.blindspots,
      discipline_notes: insightContent.discipline_notes,
    })
    .select("*")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: `Failed to save insight: ${insertErr?.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ insight: inserted, fromCache: false });
}
