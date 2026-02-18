import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    if (!email) {
      return NextResponse.json({ approved: false });
    }

    const supabase = getClient();
    const { data } = await supabase
      .from("waitlist")
      .select("approved")
      .eq("email", email)
      .maybeSingle();

    return NextResponse.json({ approved: data?.approved === true });
  } catch {
    return NextResponse.json({ approved: false });
  }
}
