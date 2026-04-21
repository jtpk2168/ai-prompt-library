"use client";

import {
  DEPTS,
  INDUSTRY_OPTIONS,
  INDUSTRY_OPTIONS_EN,
} from "@/lib/diagnostic-data";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";
import { DeptGrid } from "./dept-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function Intake({
  industry,
  industryCustom,
  company,
  selectedDepts,
  onIndustry,
  onIndustryCustom,
  onCompany,
  onToggleDept,
  onNext,
}: {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  onIndustry: (v: IndustryKey) => void;
  onIndustryCustom: (v: string) => void;
  onCompany: (v: string) => void;
  onToggleDept: (k: DeptKey) => void;
  onNext: () => void;
}) {
  const t = useTranslations("diagnostic");
  const locale = useLocale();
  const industryOptions =
    locale === "en" ? INDUSTRY_OPTIONS_EN : INDUSTRY_OPTIONS;

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-7">
      {/* HERO — the main question, up front */}
      <div>
        <h1 className="mb-2 text-[clamp(22px,2.6vw,32px)] font-bold leading-[1.2]">
          {t("step1Title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-[1.6]">
          {t("step1Subtitle")}
        </p>
      </div>

      {/* DEPT GRID — the primary interaction */}
      <div>
        <DeptGrid selected={selectedDepts} onToggle={onToggleDept} />

        {selectedDepts.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">
              {t("departmentSelectedLabel", { count: selectedDepts.size })}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[...selectedDepts].map((key) => {
                const d = DEPTS[key];
                return (
                  <span
                    key={key}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: d.fill, color: d.text }}
                  >
                    {locale === "en" ? d.name_en : d.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* INDUSTRY + COMPANY — secondary, below the main choice */}
      <div className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="mb-3 text-[13px] font-semibold text-slate-700">
          {t("aboutYouLabel")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("industryLabel")}
            </Label>
            <select
              value={industry}
              onChange={(e) => onIndustry(e.target.value as IndustryKey)}
              className="h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            >
              {industryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {industry === "other" && (
              <Input
                type="text"
                value={industryCustom}
                onChange={(e) => onIndustryCustom(e.target.value)}
                placeholder={t("industryCustomPlaceholder")}
                className="mt-2"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("companyLabel")}
            </Label>
            <Input
              type="text"
              value={company}
              onChange={(e) => onCompany(e.target.value)}
              placeholder={t("companyPlaceholder")}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        disabled={selectedDepts.size === 0}
        onClick={onNext}
        className="h-auto w-full gap-3 bg-slate-900 py-3.5 px-5 text-sm font-semibold tracking-wide text-white hover:bg-slate-800"
      >
        <span className="flex-1 text-left">{t("nextButtonIntake")}</span>
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
