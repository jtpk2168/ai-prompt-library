"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

type Step = 1 | 2 | 3;

export function Stepper({ current }: { current: Step }) {
  const t = useTranslations("diagnostic");
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: t("stepperLabel1") },
    { n: 2, label: t("stepperLabel2") },
    { n: 3, label: t("stepperLabel3") },
  ];

  return (
    <div className="mx-auto mb-6 max-w-[860px]">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((s, i) => {
          const isCurrent = s.n === current;
          const isDone = s.n < current;
          return (
            <div key={s.n} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                    isCurrent
                      ? "bg-yellow-400 text-slate-900"
                      : isDone
                        ? "bg-slate-900 text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : s.n}
                </div>
                <span
                  className={`hidden text-[13px] font-semibold sm:inline ${
                    isCurrent
                      ? "text-slate-900"
                      : isDone
                        ? "text-slate-600"
                        : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-[2px] w-8 sm:w-16 rounded-full ${
                    isDone ? "bg-slate-900" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {current === 1 && (
        <div className="mt-2 text-center text-xs text-muted-foreground">
          {t("stepperTime")}
        </div>
      )}
    </div>
  );
}
