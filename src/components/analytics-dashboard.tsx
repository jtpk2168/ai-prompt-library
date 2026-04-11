"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Copy,
  Heart,
  TrendingUp,
  RefreshCw,
  Users,
  FileText,
  MessageSquare,
  BookOpen,
  CalendarDays,
  Shield,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_COURSES,
  getTotalLessons,
  getTotalDuration,
} from "@/lib/mock-courses";

interface AnalyticsData {
  totals: { views: number; copies: number; favorites: number };
  platform: { totalUsers: number; totalPrompts: number; totalFeedback: number };
  topPrompts: {
    id: string;
    title_en: string;
    slug: string;
    times_copied: number;
    times_viewed: number;
    category: { name_en: string } | null;
  }[];
  dailyTrend: { date: string; count: number }[];
  categoryDistribution: { name: string; count: number }[];
  meta: { from: string; to: string; dayCount: number };
}

type TimeRange = "today" | "7d" | "30d" | "all" | "custom";

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

function getDateRange(range: TimeRange): { from: string; to: string } | null {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  switch (range) {
    case "today":
      return { from: to, to };
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case "all":
      return null; // no date filter
    default:
      return null;
  }
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [authRequired, setAuthRequired] = useState<boolean | null>(null);
  const [authToggling, setAuthToggling] = useState(false);

  const fetchData = useCallback((range: TimeRange, cFrom?: string, cTo?: string) => {
    setLoading(true);
    setError(false);

    let url = "/api/v1/admin/analytics/overview";
    const params = new URLSearchParams();

    if (range === "custom" && cFrom && cTo) {
      params.set("from", cFrom);
      params.set("to", cTo);
    } else if (range !== "all") {
      const dates = getDateRange(range);
      if (dates) {
        params.set("from", dates.from);
        params.set("to", dates.to);
      }
    }

    const qs = params.toString();
    if (qs) url += `?${qs}`;

    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData("30d");
    fetch("/api/v1/admin/settings")
      .then((r) => r.json())
      .then((s) => setAuthRequired(s.auth_required !== "false"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthToggle = async () => {
    const newValue = !authRequired;
    setAuthToggling(true);
    await fetch("/api/v1/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_required: newValue ? "true" : "false" }),
    });
    setAuthRequired(newValue);
    setAuthToggling(false);
  };

  const handleTimeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range !== "custom") {
      fetchData(range);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      setCalendarOpen(false);
      fetchData("custom", customFrom, customTo);
    }
  };

  // Course stats from mock data
  const courseStats = {
    totalCourses: MOCK_COURSES.length,
    totalLessons: MOCK_COURSES.reduce((s, c) => s + getTotalLessons(c), 0),
    totalDuration: MOCK_COURSES.reduce((s, c) => s + getTotalDuration(c), 0),
  };

  // Range label for display
  const rangeLabel = (() => {
    if (timeRange === "custom" && customFrom && customTo) {
      return `${customFrom} — ${customTo}`;
    }
    return TIME_OPTIONS.find((o) => o.value === timeRange)?.label ?? "";
  })();

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-5">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <p className="text-muted-foreground">Unable to load dashboard data</p>
            <Button variant="outline" size="sm" onClick={() => fetchData(timeRange)}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fill in missing days for chart
  const filledTrend = (() => {
    const map = new Map(data.dailyTrend.map((d) => [d.date, d.count]));
    const days: { date: string; count: number }[] = [];
    const fromDate = new Date(data.meta.from);
    const toDate = new Date(data.meta.to);
    const numDays = Math.min(Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 90);

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(toDate);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: map.get(key) || 0 });
    }
    return days;
  })();

  const maxCopies = Math.max(...filledTrend.map((d) => d.count), 1);
  const yTicks = (() => {
    const step = Math.ceil(maxCopies / 3);
    return [step * 3, step * 2, step, 0];
  })();
  const yMax = yTicks[0] || 1;

  // X-axis labels: spread ~5 evenly
  const xLabelIndices = (() => {
    const len = filledTrend.length;
    if (len <= 5) return Array.from({ length: len }, (_, i) => i);
    const step = (len - 1) / 4;
    return [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), len - 1];
  })();

  const totalCopiesPeriod = filledTrend.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      {/* Auth toggle */}
      {authRequired !== null && (
        <div
          className={cn(
            "mb-6 flex items-center justify-between rounded-xl border p-4",
            authRequired
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          )}
        >
          <div className="flex items-center gap-3">
            {authRequired ? (
              <Shield className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldOff className="h-5 w-5 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {authRequired ? "Login Required" : "Open Access"}
              </p>
              <p className="text-xs text-muted-foreground">
                {authRequired
                  ? "Users must log in to access the site"
                  : "Anyone can access the site without logging in"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuthToggle}
            disabled={authToggling}
            className={cn(
              "gap-2",
              authRequired
                ? "border-emerald-300 hover:bg-emerald-100"
                : "border-amber-300 hover:bg-amber-100"
            )}
          >
            {authToggling
              ? "Updating..."
              : authRequired
                ? "Disable Login"
                : "Enable Login"}
          </Button>
        </div>
      )}

      {/* Platform Stats — all-time */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
              <Users className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.platform.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
              <FileText className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.platform.totalPrompts}</p>
              <p className="text-sm text-muted-foreground">Prompts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
              <BookOpen className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courseStats.totalCourses}</p>
              <p className="text-sm text-muted-foreground">Courses · {courseStats.totalLessons} lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
              <MessageSquare className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.platform.totalFeedback}</p>
              <p className="text-sm text-muted-foreground">Feedback</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Activity — time-filtered section */}
      <div className="mb-8 rounded-xl border bg-white p-5">
        {/* Section header with time filter */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Prompt Activity</h2>
          <div className="flex flex-wrap items-center gap-1">
            {TIME_OPTIONS.filter((o) => o.value !== "custom").map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleTimeChange(opt.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  timeRange === opt.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  timeRange === "custom"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
                onClick={() => {
                  setTimeRange("custom");
                  setCalendarOpen(true);
                }}
              >
                <CalendarDays className="h-3 w-3" />
                Custom
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 space-y-3 p-4">
                <div className="space-y-2">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCustomApply}
                  disabled={!customFrom || !customTo}
                >
                  Apply
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPI row */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Eye className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold">{data.totals.views.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Copy className="h-5 w-5 text-secondary-foreground" />
            </div>
            <p className="text-2xl font-bold">{data.totals.copies.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Copies</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Heart className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold">{data.totals.favorites.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Favorites</p>
          </div>
        </div>

        {/* Daily trend chart — inside the same section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" />
              Daily Copy Trend
            </h3>
            <span className="text-xs text-muted-foreground">
              {totalCopiesPeriod} total copies
            </span>
          </div>
          <TooltipProvider delay={0}>
            <div className="flex">
              <div className="flex w-8 shrink-0 flex-col justify-between pb-6 pr-2 text-right">
                {yTicks.map((tick) => (
                  <span key={tick} className="text-[10px] leading-none text-muted-foreground">
                    {tick}
                  </span>
                ))}
              </div>
              <div className="flex-1">
                <div className="relative h-44 border-b border-l border-border">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-dashed border-border/50"
                      style={{ bottom: `${(i / 3) * 100}%` }}
                    />
                  ))}
                  <div className="relative z-10 flex h-full items-end gap-0.5 px-0.5">
                    {filledTrend.map((d) => {
                      const pct = d.count > 0 ? Math.max((d.count / yMax) * 100, 2) : 0;
                      const dateLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-MY", {
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <Tooltip key={d.date}>
                          <TooltipTrigger
                            className="flex-1 cursor-default rounded-t bg-primary/60 transition-all hover:bg-primary"
                            style={{ height: `${pct}%` }}
                            aria-label={`${dateLabel}: ${d.count} copies`}
                          />
                          <TooltipContent side="top">
                            <p className="font-medium">{dateLabel}</p>
                            <p className="text-background/70">{d.count} {d.count === 1 ? "copy" : "copies"}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
                <div className="relative mt-1.5 flex h-4">
                  {xLabelIndices.map((i) => {
                    const d = filledTrend[i];
                    if (!d) return null;
                    const leftPct = ((i + 0.5) / filledTrend.length) * 100;
                    return (
                      <span
                        key={d.date}
                        className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
                        style={{ left: `${leftPct}%` }}
                      >
                        {new Date(d.date + "T00:00:00").toLocaleDateString("en-MY", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryDistribution.map((cat) => {
                const total = data.categoryDistribution.reduce(
                  (s, c) => s + c.count,
                  0
                );
                const pct = total > 0 ? (cat.count / total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground">
                        {cat.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Copies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPrompts.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.title_en}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.category?.name_en}
                    </TableCell>
                    <TableCell className="text-right">{p.times_viewed}</TableCell>
                    <TableCell className="text-right font-medium">
                      {p.times_copied}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
