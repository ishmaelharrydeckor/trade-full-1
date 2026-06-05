import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body.email || !body.logged_trades || !body.features_used || !body.sean_ellis_score || !body.would_recommend) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("beta_feedback")
      .insert({
        email: body.email,
        whatsapp: body.whatsapp || null,
        logged_trades: body.logged_trades,
        previous_tracking: body.previous_tracking,
        previous_tracking_other: body.previous_tracking_other || null,
        features_used: body.features_used,
        what_frustrated: body.what_frustrated || null,
        what_was_missing: body.what_was_missing || null,
        sean_ellis_score: body.sean_ellis_score,
        would_recommend: body.would_recommend,
        anything_else: body.anything_else || null,
        full_name: body.full_name || null,
        trading_experience: body.trading_experience || null,
        what_they_trade: body.what_they_trade || null,
        broker: body.broker || null,
        platform: body.platform || null,
        heard_from: body.heard_from || null,
        user_agent: req.headers.get("user-agent") || null,
      });
    
    if (error) {
      console.error("Beta feedback insert error:", error);
      return NextResponse.json(
        { error: "Failed to save feedback. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Beta feedback API error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}


