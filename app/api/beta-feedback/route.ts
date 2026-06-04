import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the feedback data for now — we'll wire up Supabase later
    // once the beta_feedback migration is created.
    console.log("[beta-feedback] New submission:", JSON.stringify(body, null, 2));

    // TODO: Store in Supabase beta_feedback table
    // const supabase = await createClient();
    // const { error } = await supabase.from("beta_feedback").insert(body);
    // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
