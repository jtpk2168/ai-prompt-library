"use client";

import { DEPTS, DEPT_ORDER } from "@/lib/diagnostic-data";
import type { DeptKey } from "@/types/diagnostic";
import { Check } from "lucide-react";

interface DeptGridProps {
  selected: Set<DeptKey>;
  onToggle: (key: DeptKey) => void;
}

export function DeptGrid({ selected, onToggle }: DeptGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {DEPT_ORDER.map((key) => {
        const d = DEPTS[key];
        const isSelected = selected.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            aria-pressed={isSelected}
            className={`group relative flex min-h-[84px] flex-col items-start justify-end gap-1.5 rounded-xl border-2 p-3.5 text-left transition-all sm:min-h-[96px] ${
              isSelected
                ? "shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
            style={
              isSelected
                ? {
                    background: d.fill,
                    borderColor: d.stroke,
                  }
                : undefined
            }
          >
            <div
              className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                isSelected
                  ? "border-transparent"
                  : "border-slate-300 bg-white"
              }`}
              style={
                isSelected
                  ? { background: d.stroke, borderColor: d.stroke }
                  : undefined
              }
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
            <div
              className={`text-[15px] font-semibold leading-tight ${
                isSelected ? "" : "text-slate-700"
              }`}
              style={isSelected ? { color: d.text } : undefined}
            >
              {d.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
