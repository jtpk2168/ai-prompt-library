import type { Solution } from "@/types/diagnostic";

/**
 * A slim "just-enough" prompt shape for client-side matching.
 * Fetched server-side on the diagnostic page and passed down.
 */
export interface LibraryPromptLite {
  slug: string;
  title_zh: string;
  title_en: string;
  subtitle: string;
  category_slug: string;
  tag_names: string[];
}

/**
 * Score a prompt's relevance to a solution by counting keyword overlaps between
 * the solution's tags + name and the prompt's titles/subtitle/tags.
 *
 * Higher is better. Zero means no overlap — caller should drop it.
 */
function scorePrompt(sol: Solution, prompt: LibraryPromptLite): number {
  const haystack = [
    prompt.title_zh,
    prompt.title_en,
    prompt.subtitle,
    ...prompt.tag_names,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  // Solution name words (split on 空格 and CJK)
  const nameTokens = sol.name
    .toLowerCase()
    .split(/[\s·、／/]+/)
    .filter((t) => t.length >= 2);
  for (const token of nameTokens) {
    if (haystack.includes(token)) score += 2;
  }

  // Solution tags
  for (const tag of sol.tags) {
    const t = tag.toLowerCase();
    if (t.length >= 2 && haystack.includes(t)) score += 1;
  }

  return score;
}

/**
 * Find up to `limit` library prompts that match a solution.
 * Returns prompts sorted by score DESC.
 */
export function matchPromptsForSolution(
  sol: Solution,
  allPrompts: LibraryPromptLite[],
  limit: number = 2,
): LibraryPromptLite[] {
  if (!allPrompts.length) return [];
  const scored = allPrompts
    .map((p) => ({ p, score: scorePrompt(sol, p) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((x) => x.p);
}
