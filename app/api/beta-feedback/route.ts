import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("[beta-feedback] New submission:", JSON.stringify(body, null, 2));

    const supabase = createServiceClient();
    const { error } = await supabase.from("beta_feedback").insert(body);
    if (error) {
      console.error("[beta-feedback] Database insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[beta-feedback] Request error:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

