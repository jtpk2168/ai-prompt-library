"use client";

import { useEffect, useRef, useState } from "react";
import { Intake } from "@/components/diagnostic/intake";
import { Pains } from "@/components/diagnostic/pains";
import { Result } from "@/components/diagnostic/result";
import { Stepper } from "@/components/diagnostic/stepper";
import type { DeptKey, IndustryKey } from "@/types/diagnostic";
import type { LibraryPromptLite } from "@/lib/diagnostic-library-match";
import {
  clearSession,
  hydrateSession,
  loadSession,
  relativeTime,
  saveSession,
  type SavedSession,
} from "@/lib/diagnostic-storage";
import { Button } from "@/components/ui/button";
import { RotateCw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Step = 1 | 2 | 3;

export function DiagnosticClient({
  libraryPrompts,
}: {
  libraryPrompts: LibraryPromptLite[];
}) {
  const t = useTranslations("diagnostic");
  const locale = useLocale();
  const [step, setStep] = useState<Step>(1);
  const [industry, setIndustry] = useState<IndustryKey>("general");
  const [industryCustom, setIndustryCustom] = useState("");
  const [company, setCompany] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<Set<DeptKey>>(new Set());
  const [selectedPains, setSelectedPains] = useState<
    Record<DeptKey, Set<string>>
  >({} as Record<DeptKey, Set<string>>);
  const [customPains, setCustomPains] = useState<Record<DeptKey, string[]>>(
    {} as Record<DeptKey, string[]>,
  );

  // "Continue last session" banner state
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const hasHydrated = useRef(false);

  // On mount: check for saved session
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.selectedDepts.length > 0) {
      setSavedSession(saved);
    }
  }, []);

  // Auto-save on state changes (skip until user has done anything)
  useEffect(() => {
    // Only save if user has made progress
    if (selectedDepts.size === 0 && step === 1 && !company && !industryCustom) {
      return;
    }
    saveSession({
      step,
      industry,
      industryCustom,
      company,
      selectedDepts,
      selectedPains,
      customPains,
    });
  }, [
    step,
    industry,
    industryCustom,
    company,
    selectedDepts,
    selectedPains,
    customPains,
  ]);

  const resumeSession = () => {
    if (!savedSession) return;
    const hydrated = hydrateSession(savedSession);
    setIndustry(hydrated.industry);
    setIndustryCustom(hydrated.industryCustom);
    setCompany(hydrated.company);
    setSelectedDepts(hydrated.selectedDepts);
    setSelectedPains(hydrated.selectedPains);
    setCustomPains(hydrated.customPains);
    setStep(hydrated.step);
    setSavedSession(null);
    hasHydrated.current = true;
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const dismissSession = () => {
    clearSession();
    setSavedSession(null);
  };

  const toggleDept = (key: DeptKey) => {
    const next = new Set(selectedDepts);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedDepts(next);
  };

  const togglePain = (dept: DeptKey, pain: string) => {
    const current = selectedPains[dept] ?? new Set<string>();
    const next = new Set(current);
    if (next.has(pain)) next.delete(pain);
    else next.add(pain);
    setSelectedPains({ ...selectedPains, [dept]: next });
  };

  const addCustom = (dept: DeptKey, pain: string) => {
    const customs = [...(customPains[dept] ?? []), pain];
    const sel = new Set(selectedPains[dept] ?? new Set<string>());
    sel.add(pain);
    setCustomPains({ ...customPains, [dept]: customs });
    setSelectedPains({ ...selectedPains, [dept]: sel });
  };

  const removeCustom = (dept: DeptKey, idx: number) => {
    const list = [...(customPains[dept] ?? [])];
    if (idx < 0 || idx >= list.length) return;
    const val = list[idx];
    list.splice(idx, 1);
    const sel = new Set(selectedPains[dept] ?? new Set<string>());
    sel.delete(val);
    setCustomPains({ ...customPains, [dept]: list });
    setSelectedPains({ ...selectedPains, [dept]: sel });
  };

  const goStep = (n: Step) => {
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const restart = () => {
    clearSession();
    setSelectedDepts(new Set());
    setSelectedPains({} as Record<DeptKey, Set<string>>);
    setCustomPains({} as Record<DeptKey, string[]>);
    setIndustry("general");
    setIndustryCustom("");
    setCompany("");
    goStep(1);
  };

  return (
    <div className="px-4 pb-10 pt-8">
      {/* CONTINUE LAST SESSION BANNER */}
      {savedSession && step === 1 && (
        <div className="mx-auto mb-5 max-w-[860px]">
          <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3.5 shadow-sm">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
              <RotateCw className="h-4 w-4 text-yellow-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">
                {t("continueLastTitle")}
              </div>
              <div className="text-xs text-slate-600">
                {t("continueLastMeta", {
                  depts: savedSession.selectedDepts.length,
                  time: relativeTime(savedSession.savedAt, locale),
                })}
              </div>
            </div>
            <Button
              type="button"
              onClick={resumeSession}
              size="sm"
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {t("continueLastButton")}
            </Button>
            <button
              type="button"
              onClick={dismissSession}
              aria-label={t("dismissLabel")}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-yellow-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEPPER */}
      <Stepper current={step} />

      {step === 1 && (
        <Intake
          industry={industry}
          industryCustom={industryCustom}
          company={company}
          selectedDepts={selectedDepts}
          onIndustry={setIndustry}
          onIndustryCustom={setIndustryCustom}
          onCompany={setCompany}
          onToggleDept={toggleDept}
          onNext={() => goStep(2)}
        />
      )}
      {step === 2 && (
        <Pains
          industry={industry}
          company={company}
          selectedDepts={selectedDepts}
          selectedPains={selectedPains}
          customPains={customPains}
          onTogglePain={togglePain}
          onAddCustom={addCustom}
          onRemoveCustom={removeCustom}
          onBack={() => goStep(1)}
          onNext={() => goStep(3)}
        />
      )}
      {step === 3 && (
        <Result
          industry={industry}
          industryCustom={industryCustom}
          company={company}
          selectedDepts={selectedDepts}
          selectedPains={selectedPains}
          libraryPrompts={libraryPrompts}
          onBack={() => goStep(2)}
          onRestart={restart}
        />
      )}
    </div>
  );
}
