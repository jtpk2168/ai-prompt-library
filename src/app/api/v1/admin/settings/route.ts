import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  const settings: Record<string, string> = {};
  (data || []).forEach((row) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as Record<string, string>;
  const supabase = createAdminClient();

  for (const [key, value] of Object.entries(body)) {
    await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }

  return NextResponse.json({ success: true });
}
