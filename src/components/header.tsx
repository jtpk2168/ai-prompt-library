"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Video, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [libraryEnabled, setLibraryEnabled] = useState(true);
  const [coursesEnabled, setCoursesEnabled] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch module visibility settings
    fetch("/api/v1/settings")
      .then((r) => r.json())
      .then((s: Record<string, string>) => {
        setLibraryEnabled(s.library_enabled !== "false");
        setCoursesEnabled(s.courses_enabled !== "false");
      })
      .catch(() => {
        // Silent fallback — default to enabled
      });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (pathname.startsWith("/admin")) return null;

  const displayName = user?.user_metadata?.full_name || user?.email;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">Vibe Coding</span>
        </Link>

        <nav className="flex items-center gap-1">
          {libraryEnabled && (
            <Link
              href="/library"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                pathname.startsWith("/library") && "bg-secondary"
              )}
            >
              Library
            </Link>
          )}
          {coursesEnabled && (
            <Link
              href="/courses"
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                pathname.startsWith("/courses") && "bg-secondary"
              )}
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </Link>
          )}
        </nav>

        {/* Right side: auth */}
        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <div className="flex items-center gap-1 border-l pl-3 ml-2">
              <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                <User className="h-3.5 w-3.5" />
                {displayName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
