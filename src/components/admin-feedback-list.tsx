"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  user_email: string;
  user_name: string;
  category: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-50 text-blue-700 border-blue-200" },
  reviewed: { label: "Reviewed", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { label: "Archived", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  bug: "Bug",
  feature: "Feature",
  content: "Content",
};

export function AdminFeedbackList({ feedback }: { feedback: FeedbackItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");

  const query = filter.toLowerCase();
  const filtered = feedback.filter(
    (f) =>
      f.user_name.toLowerCase().includes(query) ||
      f.user_email.toLowerCase().includes(query) ||
      f.message.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
  );

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/v1/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Marked as ${status}`);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;

    const res = await fetch(`/api/v1/admin/feedback/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }

    toast.success("Feedback deleted");
    router.refresh();
  };

  const newCount = feedback.filter((f) => f.status === "new").length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          {newCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {newCount} new {newCount === 1 ? "submission" : "submissions"}
            </p>
          )}
        </div>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search feedback..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
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
                  {filter ? "No feedback matches your search" : "No feedback yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const statusConfig = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {item.user_name || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.user_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{item.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
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
                            onClick={() => handleStatus(item.id, "reviewed")}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Mark Reviewed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatus(item.id, "resolved")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatus(item.id, "archived")}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
