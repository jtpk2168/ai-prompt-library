import Link from "next/link";
import { Clock, Star, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import type { PromptWithCategory } from "@/types/database";

export function PromptCard({
  prompt,
  compact,
}: {
  prompt: PromptWithCategory;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link href={`/prompt/${prompt.slug}`}>
        <Card className="group transition-all hover:shadow-sm hover:border-slate-300">
          <CardContent className="p-3.5">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                {prompt.category?.name_en}
              </span>
            </div>
            <h3 className="text-sm font-medium leading-snug group-hover:text-yellow-600 transition-colors">
              {prompt.title_en}
            </h3>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/prompt/${prompt.slug}`}>
      <Card className="group relative h-full transition-all hover:shadow-md hover:border-slate-300">
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton promptId={prompt.id} />
        </div>
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {prompt.category?.name_en}
            </span>
          </div>

          <h3 className="mb-1 font-semibold leading-snug group-hover:text-yellow-600 transition-colors line-clamp-2">
            {prompt.title_en}
          </h3>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {prompt.subtitle}
          </p>

          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {prompt.estimated_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Copy className="h-3 w-3" />
              {prompt.times_copied}
            </span>
            {prompt.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {prompt.rating.toFixed(1)}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground/60">
              {prompt.version}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
