export type DeptKey =
  | "sales"
  | "market"
  | "service"
  | "ops"
  | "stock"
  | "finance"
  | "hr"
  | "mgmt";

export type IndustryKey =
  | "general"
  | "fnb"
  | "retail"
  | "education"
  | "healthcare"
  | "professional"
  | "manufacturing"
  | "realestate"
  | "other";

export type SolutionType = "ai" | "light" | "full";

export interface Department {
  key: DeptKey;
  name: string;        // Chinese (primary)
  name_en: string;     // English
  fill: string;
  stroke: string;
  text: string;
  pains: string[];     // Chinese (primary)
  pains_en: string[];  // English, parallel-indexed with pains
}

export interface Solution {
  name: string;                 // Chinese (primary)
  name_en: string;              // English
  type: SolutionType;
  tool: string;                 // Chinese
  tool_en: string;              // English
  desc: string;                 // Chinese
  desc_en: string;              // English
  outcome: string;              // Chinese — "每月省 8 小时" — what the user gets
  outcome_en: string;           // English
  impact: number;               // 1-10 (how valuable)
  effort: number;               // 1-10 (how hard; lower = easier)
  hoursSavedPerMonth: number;   // rough estimate for totals
  tags: string[];               // keywords for matching custom-typed pains (stay in whatever language is most natural)
}

export interface AppState {
  industry: IndustryKey;
  industryCustom: string;
  company: string;
  selectedDepts: Set<DeptKey>;
  selectedPains: Record<DeptKey, Set<string>>;
  customPains: Record<DeptKey, string[]>;
}
