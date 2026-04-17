"use client";

import { useState } from "react";
import { DEPTS, getPainsForDept } from "@/lib/diagnostic-data";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function Pains({
  industry,
  company,
  selectedDepts,
  selectedPains,
  customPains,
  onTogglePain,
  onAddCustom,
  onRemoveCustom,
  onBack,
  onNext,
}: {
  industry: IndustryKey;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  customPains: Record<DeptKey, string[]>;
  onTogglePain: (dept: DeptKey, pain: string) => void;
  onAddCustom: (dept: DeptKey, pain: string) => void;
  onRemoveCustom: (dept: DeptKey, idx: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("diagnostic");
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const total = [...selectedDepts].reduce(
    (sum, k) => sum + (selectedPains[k]?.size ?? 0),
    0,
  );

  const displayCompany = company.trim() || t("yourCompany");

  return (
    <>
      <div className="mx-auto max-w-[860px] pb-28">
        {/* HERO */}
        <div className="mb-7">
          <h1 className="mb-2 text-[clamp(22px,2.6vw,32px)] font-bold leading-[1.2]">
            {displayCompany} · {t("step2Title")}
          </h1>
          <p className="text-sm text-muted-foreground leading-[1.6]">
            {t("step2SubtitleShort")}
          </p>
        </div>

        {/* DEPT CARDS */}
        <div className="flex flex-col gap-4">
          {[...selectedDepts].map((key) => {
            const d = DEPTS[key];
            const pains = getPainsForDept(industry, key);
            const sel = selectedPains[key] ?? new Set<string>();
            const customs = (customPains[key] ?? []).filter(Boolean);
            const draft = customDrafts[key] ?? "";
            const deptSelectedCount = sel.size;
            // "Select all" toggles only the canned pains (customs are user-added)
            const allCannedSelected = pains.every((p) => sel.has(p));

            const handleSelectAll = () => {
              if (allCannedSelected) {
                pains.forEach((p) => {
                  if (sel.has(p)) onTogglePain(key, p);
                });
              } else {
                pains.forEach((p) => {
                  if (!sel.has(p)) onTogglePain(key, p);
                });
              }
            };

            const addCurrentDraft = () => {
              if (draft.trim()) {
                onAddCustom(key, draft.trim());
                setCustomDrafts({ ...customDrafts, [key]: "" });
              }
            };

            return (
              <div
                key={key}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                {/* DEPT HEADER */}
                <div
                  className="flex items-center gap-2.5 border-b px-[18px] py-3"
                  style={{ background: `${d.fill}50` }}
                >
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
                  <span className="text-xs font-medium text-slate-600">
                    {t("deptSelectedCount", { count: deptSelectedCount })}
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ml-auto text-[11px] font-semibold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                  >
                    {allCannedSelected
                      ? t("unselectAll")
                      : t("selectAll")}
                  </button>
                </div>

                {/* PAIN LIST — canned + customs merged */}
                <div className="flex flex-col gap-2 p-[18px]">
                  {/* Custom pains first — they feel more personal / important */}
                  {customs.map((pain, i) => {
                    const selected = sel.has(pain);
                    return (
                      <div
                        key={`c-${i}`}
                        className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-all ${
                          selected
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-input bg-white hover:border-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onTogglePain(key, pain)}
                          aria-pressed={selected}
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                            selected
                              ? "border-yellow-400 bg-yellow-400"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected && (
                            <Check className="h-3 w-3 text-slate-900" />
                          )}
                        </button>
                        <div
                          className="flex-1 cursor-pointer text-sm"
                          onClick={() => onTogglePain(key, pain)}
                        >
                          {pain}
                          <span className="ml-2 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800">
                            {t("yourPainBadge")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveCustom(
                              key,
                              (customPains[key] ?? []).indexOf(pain),
                            )
                          }
                          aria-label={t("removeLabel")}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Canned pains */}
                  {pains.map((pain) => {
                    const selected = sel.has(pain);
                    return (
                      <div
                        key={pain}
                        onClick={() => onTogglePain(key, pain)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition-all ${
                          selected
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-input bg-white hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                            selected
                              ? "border-yellow-400 bg-yellow-400"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected && (
                            <Check className="h-3 w-3 text-slate-900" />
                          )}
                        </div>
                        <div className="text-sm">{pain}</div>
                      </div>
                    );
                  })}

                  {/* Add-custom row — inline, merged visually with the list */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      value={draft}
                      onChange={(e) =>
                        setCustomDrafts({
                          ...customDrafts,
                          [key]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCurrentDraft();
                        }
                      }}
                      maxLength={80}
                      placeholder={t("customPainPlaceholderShort")}
                      className="h-10 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCurrentDraft}
                      disabled={!draft.trim()}
                      variant="outline"
                      className="h-10 gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      {t("customPainAddButton")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STICKY CTA BAR */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("backButton")}</span>
          </Button>
          <div className="flex-1 text-center text-sm text-slate-600">
            <span className="text-lg font-bold text-slate-900">{total}</span>
            <span className="ml-1 text-muted-foreground">
              {t("confirmedPainsSuffix")}
            </span>
          </div>
          <Button
            disabled={total === 0}
            onClick={onNext}
            className="h-auto gap-2 bg-slate-900 py-3 px-5 text-sm font-semibold tracking-wide text-white hover:bg-slate-800"
          >
            <span>{t("nextButtonPains")}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
