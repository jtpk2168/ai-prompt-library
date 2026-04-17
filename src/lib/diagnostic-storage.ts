import type { DeptKey, IndustryKey } from "@/types/diagnostic";

const STORAGE_KEY = "diagnostic:lastSession:v1";

export interface SavedSession {
  savedAt: number;
  step: 1 | 2 | 3;
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: DeptKey[];
  selectedPains: Record<string, string[]>;
  customPains: Record<string, string[]>;
}

interface LoadState {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  customPains: Record<DeptKey, string[]>;
}

export function saveSession(session: {
  step: 1 | 2 | 3;
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  customPains: Record<DeptKey, string[]>;
}): void {
  if (typeof window === "undefined") return;
  try {
    const serialized: SavedSession = {
      savedAt: Date.now(),
      step: session.step,
      industry: session.industry,
      industryCustom: session.industryCustom,
      company: session.company,
      selectedDepts: [...session.selectedDepts],
      selectedPains: Object.fromEntries(
        Object.entries(session.selectedPains).map(([k, v]) => [k, [...v]]),
      ),
      customPains: session.customPains,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // ignore quota errors
  }
}

export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function hydrateSession(saved: SavedSession): LoadState & { step: 1 | 2 | 3 } {
  const selectedPains: Record<DeptKey, Set<string>> = {} as Record<
    DeptKey,
    Set<string>
  >;
  for (const [dept, pains] of Object.entries(saved.selectedPains || {})) {
    selectedPains[dept as DeptKey] = new Set(pains);
  }
  const customPains: Record<DeptKey, string[]> = {} as Record<DeptKey, string[]>;
  for (const [dept, pains] of Object.entries(saved.customPains || {})) {
    customPains[dept as DeptKey] = pains;
  }
  return {
    step: saved.step,
    industry: saved.industry,
    industryCustom: saved.industryCustom,
    company: saved.company,
    selectedDepts: new Set(saved.selectedDepts),
    selectedPains,
    customPains,
  };
}

/** Returns a friendly "3 小时前" style relative timestamp. */
export function relativeTime(savedAt: number, locale: string = "zh"): string {
  const diffMs = Date.now() - savedAt;
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (locale === "en") {
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
}
