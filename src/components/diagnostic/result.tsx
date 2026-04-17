"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEPTS,
  IND_LABELS,
  SOL_TYPE_LABEL,
  SOL_TYPE_STYLE,
} from "@/lib/diagnostic-data";
import {
  STEPS,
  buildDeptPrompt,
  rankedSolutionsForDept,
} from "@/lib/diagnostic-prompts";
import type { DeptKey, IndustryKey, Solution } from "@/types/diagnostic";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import {
  matchPromptsForSolution,
  type LibraryPromptLite,
} from "@/lib/diagnostic-library-match";

const EFFORT_LABEL_KEY = (effort: number): "effortLow" | "effortMid" | "effortHigh" => {
  if (effort <= 3) return "effortLow";
  if (effort <= 6) return "effortMid";
  return "effortHigh";
};

export function Result({
  industry,
  industryCustom,
  company,
  selectedDepts,
  selectedPains,
  libraryPrompts,
  onBack,
  onRestart,
}: {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  libraryPrompts: LibraryPromptLite[];
  onBack: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("diagnostic");
  const locale = useLocale();
  const [openDepts, setOpenDepts] = useState<Set<DeptKey>>(() => {
    // Auto-expand the first dept (highest priority after ranking)
    return new Set();
  });
  const [copied, setCopied] = useState<string | null>(null);

  const industryLabel =
    industry === "other"
      ? industryCustom.trim()
      : IND_LABELS[industry] || "";
  const displayCompany = company.trim() || t("yourCompany");

  const rankedDepts = useMemo(() => {
    const entries = [...selectedDepts]
      .filter((k) => (selectedPains[k]?.size ?? 0) > 0)
      .map((key) => {
        const pains = [...(selectedPains[key] ?? [])];
        const ranked = rankedSolutionsForDept(industry, key, pains);
        const topPriority = ranked[0]?.priority ?? 0;
        return { key, pains, ranked, topPriority };
      });
    entries.sort((a, b) => b.topPriority - a.topPriority);
    return entries;
  }, [selectedDepts, selectedPains, industry]);

  // Auto-expand the top-ranked dept on first render
  const firstDeptKey = rankedDepts[0]?.key;
  useEffect(() => {
    if (firstDeptKey) {
      setOpenDepts((prev) => (prev.size === 0 ? new Set([firstDeptKey]) : prev));
    }
  }, [firstDeptKey]);

  const totalProblems = rankedDepts.reduce(
    (sum, d) => sum + d.pains.length,
    0,
  );

  // Dedupe solutions across depts when calculating total savings
  const totalHoursRaw = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    for (const dept of rankedDepts) {
      for (const { solution } of dept.ranked) {
        const id = `${dept.key}:${solution.name}`;
        if (seen.has(id)) continue;
        seen.add(id);
        total += solution.hoursSavedPerMonth;
      }
    }
    return total;
  }, [rankedDepts]);

  // Present as a conservative range, not a single inflated number
  const savingsRange = useMemo(() => {
    const low = Math.max(5, Math.round(totalHoursRaw * 0.5 / 5) * 5);
    const high = Math.max(low + 5, Math.round(totalHoursRaw * 1.0 / 5) * 5);
    return { low, high };
  }, [totalHoursRaw]);

  const topPicks = useMemo(() => {
    const all = rankedDepts.flatMap((dept) =>
      dept.ranked.map((r) => ({ deptKey: dept.key, ...r })),
    );
    const seen = new Set<string>();
    const unique = [];
    for (const item of all.sort((a, b) => b.priority - a.priority)) {
      if (seen.has(item.solution.name)) continue;
      seen.add(item.solution.name);
      unique.push(item);
      if (unique.length === 3) break;
    }
    return unique;
  }, [rankedDepts]);

  const toggleDept = (k: DeptKey) => {
    const next = new Set(openDepts);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setOpenDepts(next);
  };

  const allExpanded =
    rankedDepts.length > 0 && openDepts.size === rankedDepts.length;

  const toggleAll = () => {
    if (allExpanded) {
      setOpenDepts(new Set());
    } else {
      setOpenDepts(new Set(rankedDepts.map((d) => d.key)));
    }
  };

  const scrollToDept = (k: DeptKey) => {
    const next = new Set(openDepts);
    next.add(k);
    setOpenDepts(next);
    setTimeout(() => {
      const el = document.getElementById(`dept-section-${k}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2200);
  };

  // Library match renderer
  const renderLibraryMatches = (sol: Solution) => {
    const matches = matchPromptsForSolution(sol, libraryPrompts, 2);
    if (matches.length === 0) return null;
    return (
      <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {t("libraryMatchLabel")}
        </div>
        <div className="flex flex-col gap-1">
          {matches.map((m) => (
            <Link
              key={m.slug}
              href={`/prompt/${m.slug}`}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:text-slate-900 hover:underline"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-400" />
              <span className="truncate">
                {locale === "en" ? m.title_en || m.title_zh : m.title_zh}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[900px]">
      {/* HERO */}
      <div className="mb-7">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("backButtonEdit")}
          </Button>
        </div>
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[20px] border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          ✓ {t("resultBadge")}
        </div>
        <h1 className="mb-2.5 text-[clamp(24px,2.8vw,36px)] font-bold leading-[1.15]">
          {displayCompany} · {t("resultTitle")}
        </h1>
        <p className="text-sm leading-[1.7] text-muted-foreground">
          {t("resultSubtitle", { count: totalProblems })}
        </p>
      </div>

      {/* SAVINGS SUMMARY — now a range */}
      <div className="mb-7 rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("savingsLabel")}
            </div>
            <div className="text-[40px] font-bold leading-none text-yellow-600 sm:text-[48px]">
              {savingsRange.low}–{savingsRange.high}
              <span className="ml-2 text-[18px] font-normal text-muted-foreground sm:text-[20px]">
                {t("savingsUnit")}
              </span>
            </div>
          </div>
          <div className="max-w-[380px] text-xs leading-[1.6] text-muted-foreground">
            {t("savingsExplain1")}
            <br />
            <span className="text-muted-foreground/70">
              {t("savingsDisclaimerRange")}
            </span>
          </div>
        </div>
      </div>

      {/* TOP PICKS */}
      {topPicks.length > 0 && (
        <div className="mb-9">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            ★ {t("topPicksLabel", { count: topPicks.length })}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topPicks.map((pick, i) => {
              const style = SOL_TYPE_STYLE[pick.solution.type];
              const d = DEPTS[pick.deptKey];
              return (
                <button
                  key={`${pick.deptKey}-${pick.solution.name}`}
                  type="button"
                  onClick={() => scrollToDept(pick.deptKey)}
                  className="group flex flex-col rounded-xl border border-yellow-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-yellow-400 hover:shadow-md"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[20px] font-bold leading-none text-yellow-600">
                      {i + 1}
                    </span>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: d.fill,
                        color: d.text,
                        borderColor: `${d.stroke}50`,
                      }}
                    >
                      {d.name}
                    </span>
                  </div>
                  <div className="mb-1 text-sm font-semibold">
                    {pick.solution.name}
                  </div>
                  <div className="mb-1 text-[11px] leading-[1.5] text-slate-500">
                    {t("forPainLabel")}
                    {pick.pain}
                  </div>
                  <div className="mb-3 text-xs font-medium leading-[1.5] text-emerald-700">
                    → {pick.solution.outcome}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-md border px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: style.bg,
                        color: style.text,
                        borderColor: style.border,
                      }}
                    >
                      {SOL_TYPE_LABEL[pick.solution.type]}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {t(EFFORT_LABEL_KEY(pick.solution.effort))}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PER-DEPT ACCORDIONS */}
      <div className="mb-9">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("fullPlanLabel")}
          </div>
          {rankedDepts.length > 1 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:underline"
            >
              {allExpanded ? t("collapseAll") : t("expandAll")}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {rankedDepts.map(({ key, pains, ranked }) => {
            const d = DEPTS[key];
            const isOpen = openDepts.has(key);
            const prompt = buildDeptPrompt({
              dept: key,
              pains,
              industry,
              company,
              industryLabel,
            });
            const promptId = `prompt-${key}`;
            const deptHoursSaved = ranked.reduce(
              (sum, r) => sum + r.solution.hoursSavedPerMonth,
              0,
            );

            return (
              <div
                key={key}
                id={`dept-section-${key}`}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                <button
                  onClick={() => toggleDept(key)}
                  className="flex w-full items-center gap-3 px-[18px] py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span
                    className="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      background: d.fill,
                      color: d.text,
                      borderColor: `${d.stroke}50`,
                    }}
                  >
                    {d.name}
                  </span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {t("deptSummary", {
                      pains: pains.length,
                      hours: deptHoursSaved,
                    })}
                  </span>
                  <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                    {isOpen ? t("collapse") : t("expand")}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t bg-slate-50">
                    <div className="flex flex-col gap-4 p-[18px]">
                      {/* PROMPT BLOCK FIRST — the action the user needs */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                            {t("promptToClaudeLabel")}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyPrompt(promptId, prompt)}
                            className="flex items-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800"
                          >
                            {copied === promptId ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                {t("copiedLabel")}
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                {t("copyLabel")}
                              </>
                            )}
                          </button>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-slate-900 p-3.5">
                          <pre className="whitespace-pre-wrap text-[12.5px] font-mono leading-[1.65] text-white/90">
                            {prompt}
                          </pre>
                        </div>
                      </div>

                      {/* EXPLANATION — solutions it covers */}
                      <div>
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                          {t("whatThisDoesLabel")}
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {ranked.map(({ pain, solution: sol }, rIdx) => {
                            const style = SOL_TYPE_STYLE[sol.type];
                            const isFirst = rIdx === 0;
                            return (
                              <div
                                key={pain}
                                className={`rounded-lg border bg-white p-3.5 ${
                                  isFirst
                                    ? "border-yellow-400 shadow-sm"
                                    : "border-input"
                                }`}
                              >
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      {isFirst && (
                                        <span className="rounded-md border border-yellow-200 bg-yellow-50 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">
                                          ★ {t("startHereBadge")}
                                        </span>
                                      )}
                                      <div className="text-sm font-semibold">
                                        {sol.name}
                                      </div>
                                    </div>
                                    <div className="mb-1.5 text-xs text-muted-foreground">
                                      {t("forPainLabel")}
                                      {pain}
                                    </div>
                                    <div className="mb-1.5 text-[13px] leading-[1.6] text-muted-foreground">
                                      {sol.desc}
                                    </div>
                                    <div className="text-[12px] font-semibold leading-[1.5] text-emerald-700">
                                      → {sol.outcome}
                                    </div>
                                    {renderLibraryMatches(sol)}
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span
                                      className="whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold"
                                      style={{
                                        background: style.bg,
                                        color: style.text,
                                        borderColor: style.border,
                                      }}
                                    >
                                      {SOL_TYPE_LABEL[sol.type]}
                                    </span>
                                    <span className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      {t(EFFORT_LABEL_KEY(sol.effort))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* NEXT STEPS */}
      <div className="mb-9">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("stepsLabel")}
        </div>
        <div className="flex flex-col gap-2.5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex gap-3.5 rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="min-w-[32px] text-[22px] font-bold leading-none text-yellow-500">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="mb-0.5 text-sm font-semibold">{s.main}</div>
                <div className="text-xs leading-[1.6] text-muted-foreground">
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {t("restartButton")}
      </button>
    </div>
  );
}
