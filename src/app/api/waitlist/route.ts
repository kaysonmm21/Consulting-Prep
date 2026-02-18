import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client is created inside the handler so missing env vars only fail at
// request time (not build time).
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = getClient();

    // Return existing position if already signed up.
    const { data: existing } = await supabase
      .from("waitlist")
      .select("position")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ position: existing.position });
    }

    // Count current entries to assign a sequential position.
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    const position = (count ?? 0) + 1;

    const { error } = await supabase.from("waitlist").insert({ email, position });

    if (error) {
      // Handle rare race-condition duplicate.
      if (error.code === "23505") {
        const { data: dup } = await supabase
          .from("waitlist")
          .select("position")
          .eq("email", email)
          .maybeSingle();
        return NextResponse.json({ position: dup?.position ?? 1 });
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Failed to join waitlist. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ position });
  } catch (err) {
    console.error("Waitlist unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}
