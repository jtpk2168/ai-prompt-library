import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Check if auth is required — use admin client to bypass RLS
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: authSetting } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "auth_required")
    .single();
  const authRequired = authSetting?.value !== "false";

  if (authRequired) {
    // Public paths that don't require authentication
    const isPublicPath =
      path === "/login" ||
      path === "/admin" ||
      path.startsWith("/api/v1/auth");

    // Require login for all pages except login and admin login
    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Force password reset for users with temporary passwords
    if (user?.user_metadata?.must_reset_password === true) {
      const isAllowed =
        path === "/reset-password" ||
        path.startsWith("/api/v1/auth") ||
        path.startsWith("/admin");
      if (!isAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = "/reset-password";
        return NextResponse.redirect(url);
      }
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (
      !user &&
      request.nextUrl.pathname !== "/admin" // Allow login page
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Protect admin API routes
  if (request.nextUrl.pathname.startsWith("/api/v1/admin")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST || "").split(",");
    if (!allowlist.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return supabaseResponse;
}
