import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PromptCard } from "@/components/prompt-card";
import { CourseCard } from "@/components/course-card";
import { ContinueLearning } from "@/components/continue-learning";
import { MOCK_COURSES, getTotalLessons, getTotalDuration } from "@/lib/mock-courses";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  BookOpen,
  FileText,
  Play,
  Clock,
  Users,
} from "lucide-react";
import type { PromptWithCategory } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const [promptsRes, promptCountRes] = await Promise.all([
    supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("status", "published")
      .order("times_copied", { ascending: false })
      .limit(6),
    supabase
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  const prompts = (promptsRes.data || []) as PromptWithCategory[];
  const promptCount = promptCountRes.count ?? 0;

  // Aggregate course stats
  const totalCourses = MOCK_COURSES.length;
  const totalLessons = MOCK_COURSES.reduce((s, c) => s + getTotalLessons(c), 0);
  const totalMinutes = MOCK_COURSES.reduce((s, c) => s + getTotalDuration(c), 0);

  return (
    <>
      <Header />
      <main>
        {/* Hero — Dual product hub */}
        <section className="border-b bg-linear-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1.5 text-sm font-medium text-yellow-800">
                <Zap className="h-3.5 w-3.5" />
                Workshop Students Only
              </div>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Vibe Coding
                <span className="block text-yellow-600">Learning Hub</span>
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-base text-slate-600 sm:text-lg">
                Video courses and prompt templates to master AI-assisted coding.
                <br className="hidden sm:block" />
                Built for SME owners — no coding experience needed.
              </p>
            </div>

            {/* Dual CTA cards */}
            <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
              <Link
                href="/courses"
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-yellow-300 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Play className="h-6 w-6" />
                </div>
                <h2 className="mb-1 text-xl font-bold text-slate-900">
                  Video Courses
                </h2>
                <p className="mb-1 text-sm font-medium text-slate-600">
                  视频课程
                </p>
                <p className="mb-4 text-sm text-slate-500">
                  Watch step-by-step Loom videos and track your progress through
                  each course.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {totalCourses} courses
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {totalLessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalMinutes} min
                  </span>
                </div>
                <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-yellow-400 group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>

              <Link
                href="/library"
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-yellow-300 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="mb-1 text-xl font-bold text-slate-900">
                  Prompt Templates
                </h2>
                <p className="mb-1 text-sm font-medium text-slate-600">
                  提示词模板
                </p>
                <p className="mb-4 text-sm text-slate-500">
                  Copy-paste AI prompts for quotations, emails, data analysis,
                  and more.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {promptCount}+ templates
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    8 categories
                  </span>
                </div>
                <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-hover:bg-yellow-400 group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Continue Learning — only shows if user has in-progress courses */}
        <ContinueLearning />

        {/* Courses section */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Video Courses
              </h2>
              <p className="text-sm text-slate-500">
                Step-by-step video lessons at your own pace
              </p>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_COURSES.slice(0, 3).map((course, i) => (
              <CourseCard key={course.slug} course={course} index={i} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4">
          <hr className="border-slate-100" />
        </div>

        {/* Prompts section — different visual treatment */}
        <section className="mx-auto max-w-7xl px-4 py-10 pb-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Popular Prompts
              </h2>
              <p className="text-sm text-slate-500">
                Ready-to-use templates for Cursor, Claude, and v0
              </p>
            </div>
            <Link
              href="/library"
              className="flex items-center gap-1 text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              Browse All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400">
                  <Zap className="h-5 w-5 text-slate-900" />
                </div>
                <span className="font-bold text-white">Vibe Coding</span>
              </div>
              <p className="text-sm leading-relaxed">
                AI-assisted coding for SME owners.
                <br />
                No coding experience needed.
              </p>
            </div>

            {/* Learn */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Learn</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/courses" className="transition-colors hover:text-white">
                    Video Courses
                  </Link>
                </li>
                <li>
                  <Link href="/library" className="transition-colors hover:text-white">
                    Prompt Library
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="transition-colors hover:text-white">
                    My Favorites
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/feedback" className="transition-colors hover:text-white">
                    Submit Feedback
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            <p>Built with Vibe Coding</p>
            <p className="mt-1">© {new Date().getFullYear()} Vibe Coding Learning Hub</p>
          </div>
        </div>
      </footer>
    </>
  );
}
