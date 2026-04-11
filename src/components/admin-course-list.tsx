"use client";

import { useState } from "react";
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
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  Search,
} from "lucide-react";
import { FilterPills } from "@/components/admin-filters";
import { toast } from "sonner";
import {
  MOCK_COURSES,
  getTotalLessons,
  getTotalDuration,
} from "@/lib/mock-courses";

export function AdminCourseList() {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const query = filter.toLowerCase();
  const filtered = MOCK_COURSES.filter((c) => {
    const matchesSearch =
      c.title_en.toLowerCase().includes(query) ||
      c.title_zh.toLowerCase().includes(query) ||
      c.slug.includes(query);
    // Mock courses are all published for now
    const matchesStatus = statusFilter === "all" || statusFilter === "published";
    return matchesSearch && matchesStatus;
  });

  const handlePublish = (slug: string) => {
    toast.success(`Course "${slug}" status toggled (mock)`);
  };

  const handleDelete = (slug: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    toast.success(`Course "${slug}" deleted (mock)`);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <Link href="/admin/courses/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterPills
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All", count: MOCK_COURSES.length },
            { value: "published", label: "Published", count: MOCK_COURSES.length },
            { value: "draft", label: "Draft", count: 0 },
          ]}
        />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Modules</TableHead>
              <TableHead className="hidden sm:table-cell">Lessons</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  {filter
                    ? "No courses match your search"
                    : "No courses yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((course) => (
                <TableRow key={course.slug}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.title_en}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.title_zh}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {course.modules.length}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {getTotalLessons(course)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getTotalDuration(course)} min
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Published</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/courses/${course.slug}`,
                              "_blank"
                            )
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.location.href = `/admin/courses/${course.slug}/edit`
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePublish(course.slug)}
                        >
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Unpublish
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(course.slug)}
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
