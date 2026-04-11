import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Parse date range from query params
  const searchParams = request.nextUrl.searchParams;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default: last 30 days
  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = toParam ? new Date(toParam + "T23:59:59.999Z") : now;

  const since = from.toISOString();
  const until = to.toISOString();
  const dayCount = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  // Build event queries with date range
  let viewsQuery = supabase
    .from("prompt_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "view")
    .gte("created_at", since);
  let copiesQuery = supabase
    .from("prompt_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "copy")
    .gte("created_at", since);
  let favoritesQuery = supabase
    .from("prompt_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "favorite")
    .gte("created_at", since);

  // Only add upper bound if not "all time"
  if (fromParam) {
    viewsQuery = viewsQuery.lte("created_at", until);
    copiesQuery = copiesQuery.lte("created_at", until);
    favoritesQuery = favoritesQuery.lte("created_at", until);
  }

  const [viewsRes, copiesRes, favoritesRes] = await Promise.all([
    viewsQuery,
    copiesQuery,
    favoritesQuery,
  ]);

  // Top 10 prompts by copies (all-time, not affected by filter)
  const { data: topPrompts } = await supabase
    .from("prompts")
    .select("id, title_en, slug, times_copied, times_viewed, category:categories(name_en)")
    .order("times_copied", { ascending: false })
    .limit(10);

  // Daily trend for the selected range
  let trendQuery = supabase
    .from("prompt_events")
    .select("created_at, event_type")
    .eq("event_type", "copy")
    .gte("created_at", since)
    .order("created_at");

  if (fromParam) {
    trendQuery = trendQuery.lte("created_at", until);
  }

  const { data: dailyEvents } = await trendQuery;

  const dailyTrend: Record<string, number> = {};
  (dailyEvents || []).forEach((event) => {
    const day = event.created_at.split("T")[0];
    dailyTrend[day] = (dailyTrend[day] || 0) + 1;
  });

  // Category distribution (all-time)
  const { data: categoryStats } = await supabase
    .from("prompts")
    .select("category:categories(name_en)")
    .eq("status", "published");

  const categoryDistribution: Record<string, number> = {};
  (categoryStats || []).forEach((p: Record<string, unknown>) => {
    const cat = p.category as { name_en: string } | null;
    const name = cat?.name_en || "Unknown";
    categoryDistribution[name] = (categoryDistribution[name] || 0) + 1;
  });

  // Platform stats
  const [usersRes, promptCountRes, feedbackRes] = await Promise.all([
    admin.auth.admin.listUsers(),
    supabase
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    admin
      .from("feedback")
      .select("id", { count: "exact", head: true }),
  ]);

  const adminEmails = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const totalUsers = (usersRes.data?.users || []).filter(
    (u) => !adminEmails.includes(u.email?.toLowerCase() ?? "")
  ).length;

  return NextResponse.json({
    totals: {
      views: viewsRes.count || 0,
      copies: copiesRes.count || 0,
      favorites: favoritesRes.count || 0,
    },
    platform: {
      totalUsers,
      totalPrompts: promptCountRes.count || 0,
      totalFeedback: feedbackRes.count || 0,
    },
    topPrompts: topPrompts || [],
    dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({
      date,
      count,
    })),
    categoryDistribution: Object.entries(categoryDistribution).map(
      ([name, count]) => ({ name, count })
    ),
    meta: { from: since, to: until, dayCount },
  });
}
