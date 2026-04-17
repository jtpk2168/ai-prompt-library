import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public GET for module visibility settings. Safe to expose:
// these toggles control UI visibility, not security.
// Auth (auth_required) is NOT returned here — only via the admin route.

const PUBLIC_KEYS = ["library_enabled", "courses_enabled", "feedback_enabled"] as const;

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", PUBLIC_KEYS as unknown as string[]);

  const settings: Record<string, string> = {};
  // Default every public key to "true" if missing from DB
  PUBLIC_KEYS.forEach((k) => {
    settings[k] = "true";
  });
  (data || []).forEach((row) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json(settings);
}
