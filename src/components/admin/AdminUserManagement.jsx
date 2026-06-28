/**
 * FindBack AI - Admin User Management
 *
 * Admin panel listing every user account and letting an admin change a user's
 * role (student / staff / admin / suspended). Fetches accounts via React Query
 * and updates roles through a mutation with optimistic cache patching.
 * Suspending a user is gated behind a confirmation AlertDialog because it
 * revokes access.
 */
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { UserCog, Users, Loader2 } from "lucide-react";
import { appClient } from "@/api/appClient";

export default function AdminUserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Holds the user pending suspension while the confirm dialog is open (null = closed).
  const [suspendTarget, setSuspendTarget] = useState(null);

  // Query: load all user accounts; cached fresh for 30s to avoid refetch churn.
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => appClient.auth.listUsers(),
    staleTime: 30_000,
  });

  // Mutation: change a user's role. On success, patch just that user in the
  // cached list (optimistic-style in-place update) instead of refetching.
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => appClient.auth.updateUserRole(userId, role),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-users"], (prev = []) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      toast({ title: "Role updated" });
    },
    onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
  });

  // Role-select handler: suspension routes through a confirm dialog; all other
  // role changes apply immediately.
  const handleRoleChange = (user, role) => {
    if (role === "suspended") {
      setSuspendTarget({ ...user, pendingRole: role });
    } else {
      roleMutation.mutate({ userId: user.id, role });
    }
  };

  // Called when the suspend confirmation dialog is accepted.
  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    roleMutation.mutate({ userId: suspendTarget.id, role: "suspended" });
    setSuspendTarget(null);
  };

  // Map a role to a Badge visual variant (admin = destructive/red, etc.).
  const roleBadgeVariant = (role) => {
    if (role === "admin") return "destructive";
    if (role === "staff") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      {/* Header: title + account count (or loading indicator) */}
      <div className="flex items-center gap-2 pb-1">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">User Management</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${users.length} account${users.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading users…</span>
        </div>
      )}

      {/* Error state (e.g. backend unreachable) */}
      {isError && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Could not load users. Make sure the backend is running.
        </p>
      )}

      {/* Empty state: loaded successfully but no accounts exist */}
      {!isLoading && !isError && users.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No accounts yet. Users appear here after signing in or creating an account.
        </p>
      )}

      {/* User list: one row per account with avatar, name/email, role controls */}
      {!isLoading && users.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              {/* Identity: avatar initial + name + email */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar shows the first letter of the user's name */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {(user.full_name || user.name || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.full_name || user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Role controls: current-role badge, role-select dropdown, quick suspend */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={roleBadgeVariant(user.role)} className="capitalize text-xs">
                  {user.role}
                </Badge>
                {/* Role picker — selecting "suspended" opens the confirm dialog */}
                <Select
                  value={user.role}
                  onValueChange={(val) => handleRoleChange(user, val)}
                  disabled={roleMutation.isPending}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <UserCog className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                {/* Dedicated Suspend button — hidden for already-suspended users */}
                {user.role !== "suspended" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    onClick={() => setSuspendTarget({ ...user, pendingRole: "suspended" })}
                    disabled={roleMutation.isPending}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suspend confirmation dialog — open whenever suspendTarget is set */}
      <AlertDialog open={Boolean(suspendTarget)} onOpenChange={(open) => { if (!open) setSuspendTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend user?</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendTarget?.full_name || suspendTarget?.name} will lose access until their role is restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleConfirmSuspend}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
