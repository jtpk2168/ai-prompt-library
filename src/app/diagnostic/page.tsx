import { Header } from "@/components/header";
import { DiagnosticClient } from "./diagnostic-client";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { LibraryPromptLite } from "@/lib/diagnostic-library-match";

export async function generateMetadata() {
  const t = await getTranslations("diagnostic");
  return { title: t("pageTitle") };
}

export default async function DiagnosticPage() {
  const supabase = await createClient();

  // Fetch a slim list of all published prompts + their tags for client-side
  // solution → library prompt matching. ~110 rows, small payload.
  const [promptsRes, tagsRes, ptRes, catsRes] = await Promise.all([
    supabase
      .from("prompts")
      .select("id, slug, title_zh, title_en, subtitle, category_id")
      .eq("status", "published"),
    supabase.from("tags").select("id, name"),
    supabase.from("prompt_tags").select("prompt_id, tag_id"),
    supabase.from("categories").select("id, slug"),
  ]);

  const tagById = new Map<string, string>(
    (tagsRes.data || []).map((t) => [t.id, t.name]),
  );
  const catSlugById = new Map<string, string>(
    (catsRes.data || []).map((c) => [c.id, c.slug]),
  );

  const tagsByPromptId = new Map<string, string[]>();
  for (const pt of ptRes.data || []) {
    const name = tagById.get(pt.tag_id);
    if (!name) continue;
    const list = tagsByPromptId.get(pt.prompt_id) ?? [];
    list.push(name);
    tagsByPromptId.set(pt.prompt_id, list);
  }

  const libraryPrompts: LibraryPromptLite[] = (promptsRes.data || []).map(
    (p) => ({
      slug: p.slug,
      title_zh: p.title_zh || "",
      title_en: p.title_en || "",
      subtitle: p.subtitle || "",
      category_slug: catSlugById.get(p.category_id) || "",
      tag_names: tagsByPromptId.get(p.id) ?? [],
    }),
  );

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] bg-slate-50">
        <DiagnosticClient libraryPrompts={libraryPrompts} />
      </main>
    </>
  );
}
