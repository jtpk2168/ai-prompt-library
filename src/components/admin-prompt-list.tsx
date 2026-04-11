"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Plus, Eye, Edit, Trash2, ToggleLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { FilterPills } from "@/components/admin-filters";
import type { PromptWithCategory, Category } from "@/types/database";

interface Props {
  prompts: PromptWithCategory[];
  categories: Category[];
}

export function AdminPromptList({ prompts, categories }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const query = filter.toLowerCase();
  const filtered = prompts.filter((p) => {
    const matchesSearch =
      p.title_en.toLowerCase().includes(query) ||
      p.title_zh?.toLowerCase().includes(query) ||
      p.slug.includes(query);
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || p.category?.slug === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const publishedCount = prompts.filter((p) => p.status === "published").length;
  const draftCount = prompts.filter((p) => p.status === "draft").length;

  const handlePublish = async (id: string, currentStatus: string) => {
    const action = currentStatus === "published" ? "unpublished" : "published";
    await fetch(`/api/v1/admin/prompts/${id}/publish`, { method: "POST" });
    toast.success(`Prompt ${action}`);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    await fetch(`/api/v1/admin/prompts/${id}`, { method: "DELETE" });
    toast.success("Prompt deleted");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Prompt Management</h1>
        <Link href="/admin/prompts/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New Prompt
        </Link>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search prompts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterPills
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All", count: prompts.length },
              { value: "published", label: "Published", count: publishedCount },
              { value: "draft", label: "Draft", count: draftCount },
            ]}
          />
          <FilterPills
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "All" },
              ...categories.map((c) => ({ value: c.slug, label: c.name_en })),
            ]}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Copies</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {filter ? "No prompts match your search" : "No prompts yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{prompt.title_en}</div>
                      <div className="text-xs text-muted-foreground">
                        /{prompt.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">
                      {prompt.category?.name_en}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        prompt.status === "published" ? "default" : "secondary"
                      }
                    >
                      {prompt.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {prompt.times_copied}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(`/prompt/${prompt.slug}`, "_blank")}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/prompts/${prompt.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePublish(prompt.id, prompt.status)}>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          {prompt.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(prompt.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
