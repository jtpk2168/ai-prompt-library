"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldOff,
  BookOpen,
  BookOpenCheck,
  Video,
  VideoOff,
  MessageSquare,
  MessageSquareOff,
} from "lucide-react";
import { toast } from "sonner";

type SettingKey = "auth_required" | "library_enabled" | "courses_enabled" | "feedback_enabled";

interface ToggleDef {
  key: SettingKey;
  enabledLabel: string;
  disabledLabel: string;
  enabledDesc: string;
  disabledDesc: string;
  enabledIcon: typeof Shield;
  disabledIcon: typeof Shield;
  enabledButtonText: string;
  disabledButtonText: string;
}

const TOGGLES: ToggleDef[] = [
  {
    key: "auth_required",
    enabledLabel: "Login Required",
    disabledLabel: "Open Access",
    enabledDesc: "Users must log in to access the site",
    disabledDesc: "Anyone can access the site without logging in",
    enabledIcon: Shield,
    disabledIcon: ShieldOff,
    enabledButtonText: "Disable Login",
    disabledButtonText: "Enable Login",
  },
  {
    key: "library_enabled",
    enabledLabel: "Library + Favorites Visible",
    disabledLabel: "Library + Favorites Hidden",
    enabledDesc: "Prompt library and favorites are visible to all users",
    disabledDesc: "Prompt library and favorites are hidden from users",
    enabledIcon: BookOpenCheck,
    disabledIcon: BookOpen,
    enabledButtonText: "Hide Library",
    disabledButtonText: "Show Library",
  },
  {
    key: "courses_enabled",
    enabledLabel: "Courses Visible",
    disabledLabel: "Courses Hidden",
    enabledDesc: "Video courses are visible to all users",
    disabledDesc: "Video courses are hidden from users",
    enabledIcon: Video,
    disabledIcon: VideoOff,
    enabledButtonText: "Hide Courses",
    disabledButtonText: "Show Courses",
  },
  {
    key: "feedback_enabled",
    enabledLabel: "Feedback Visible",
    disabledLabel: "Feedback Hidden",
    enabledDesc: "Users can submit feedback",
    disabledDesc: "Feedback form is hidden from users",
    enabledIcon: MessageSquare,
    disabledIcon: MessageSquareOff,
    enabledButtonText: "Hide Feedback",
    disabledButtonText: "Show Feedback",
  },
];

export function ModuleToggles() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [updating, setUpdating] = useState<SettingKey | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data || {}));
  }, []);

  const isEnabled = (key: SettingKey) => {
    // auth_required defaults to enabled (true); module toggles default to enabled (true)
    const value = settings?.[key];
    return value !== "false";
  };

  const handleToggle = async (key: SettingKey) => {
    if (updating) return;
    const currentlyEnabled = isEnabled(key);
    const newValue = currentlyEnabled ? "false" : "true";

    setUpdating(key);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) throw new Error("Failed");
      setSettings((prev) => ({ ...(prev || {}), [key]: newValue }));
      toast.success("Setting updated");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setUpdating(null);
    }
  };

  if (!settings) {
    return (
      <div className="space-y-3">
        {TOGGLES.map((t) => (
          <div
            key={t.key}
            className="h-20 animate-pulse rounded-xl border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {TOGGLES.map((t) => {
        const enabled = isEnabled(t.key);
        const Icon = enabled ? t.enabledIcon : t.disabledIcon;
        const isUpdating = updating === t.key;
        return (
          <div
            key={t.key}
            className={cn(
              "flex items-center justify-between rounded-xl border p-4",
              enabled
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-5 w-5",
                  enabled ? "text-emerald-600" : "text-amber-600"
                )}
              />
              <div>
                <p className="text-sm font-semibold">
                  {enabled ? t.enabledLabel : t.disabledLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {enabled ? t.enabledDesc : t.disabledDesc}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggle(t.key)}
              disabled={isUpdating}
              className={cn(
                "gap-2 shrink-0",
                enabled
                  ? "border-emerald-300 hover:bg-emerald-100"
                  : "border-amber-300 hover:bg-amber-100"
              )}
            >
              {isUpdating
                ? "Updating..."
                : enabled
                  ? t.enabledButtonText
                  : t.disabledButtonText}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
