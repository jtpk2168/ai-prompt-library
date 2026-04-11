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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { FilterPills } from "@/components/admin-filters";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    must_reset_password?: boolean;
  };
}

export function AdminUserList({ users }: { users: AuthUser[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultPassword, setResultPassword] = useState("");
  const [resultEmail, setResultEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const query = filter.toLowerCase();
  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.user_metadata?.full_name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "needs_reset" && u.user_metadata?.must_reset_password) ||
      (statusFilter === "active" && !u.user_metadata?.must_reset_password);
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => !u.user_metadata?.must_reset_password).length;
  const resetCount = users.filter((u) => u.user_metadata?.must_reset_password).length;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create user");
        return;
      }

      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success("User created and welcome email sent");
      }

      // Show password result dialog
      setResultPassword(data.password);
      setResultEmail(email.trim());
      setAddOpen(false);
      setResultOpen(true);
      setName("");
      setEmail("");
      router.refresh();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    const res = await fetch(`/api/v1/admin/users/${id}/resend`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to resend");
      return;
    }

    if (data.warning) {
      toast.warning(data.warning);
    } else {
      toast.success("Welcome email resent with new password");
    }

    if (data.password) {
      setResultPassword(data.password);
      setResultEmail("");
      setResultOpen(true);
    }

    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to delete user");
      return;
    }

    toast.success("User deleted");
    router.refresh();
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(resultPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
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
            { value: "all", label: "All", count: users.length },
            { value: "active", label: "Active", count: activeCount },
            { value: "needs_reset", label: "Needs Reset", count: resetCount },
          ]}
        />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {filter ? "No users match your search" : "No users yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.user_metadata?.full_name || "—"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.user_metadata?.must_reset_password ? (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                        Needs Reset
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
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
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleResend(user.id)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
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

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tan Wei Ming"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. weiming@company.com"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A random password will be generated and sent to this email.
              The user must reset their password on first login.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The welcome email has been sent. You can also copy the temporary
              password below to share manually (e.g. via WhatsApp).
            </p>
            {resultEmail && (
              <div className="text-sm">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{resultEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={resultPassword}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyPassword}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button onClick={() => setResultOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
