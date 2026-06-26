import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { UserCog, Users } from "lucide-react";

const LS_KEY = "ltf_demo_user_roles";

const DEFAULT_USERS = [
  { id: "u1", name: "Alice Johnson", email: "alice@pvhs.edu", role: "student" },
  { id: "u2", name: "Bob Smith", email: "bob@pvhs.edu", role: "student" },
  { id: "u3", name: "Ms. Rivera", email: "mrivera@pvhs.edu", role: "staff" },
  { id: "u4", name: "Mr. Nguyen", email: "mnguyen@pvhs.edu", role: "staff" },
  { id: "u5", name: "Admin User", email: "admin@pvhs.edu", role: "admin" },
];

function loadRoles() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function AdminUserManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [roleOverrides, setRoleOverrides] = useState(loadRoles);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const getRole = (user) => roleOverrides[user.id] ?? user.role;

  const handleRoleChange = (userId, newRole) => {
    const next = { ...roleOverrides, [userId]: newRole };
    setRoleOverrides(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    toast({ title: t("admin_user_mgmt.role_updated", "Role updated") });
  };

  const handleSuspend = (user) => {
    const next = { ...roleOverrides, [user.id]: "suspended" };
    setRoleOverrides(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    setSuspendTarget(null);
    toast({ title: t("admin_user_mgmt.suspended", "User suspended") });
  };

  const roleBadgeVariant = (role) => {
    if (role === "admin") return "destructive";
    if (role === "staff") return "secondary";
    if (role === "suspended") return "outline";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t("admin_user_mgmt.title", "User Management")}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{t("admin_user_mgmt.demo_note", "Demo data — stored locally")}</span>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
        {DEFAULT_USERS.map((user) => {
          const role = getRole(user);
          return (
            <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={roleBadgeVariant(role)} className="capitalize text-xs">
                  {role}
                </Badge>
                <Select value={role} onValueChange={(val) => handleRoleChange(user.id, val)}>
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
                {role !== "suspended" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    onClick={() => setSuspendTarget(user)}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={Boolean(suspendTarget)} onOpenChange={(open) => { if (!open) setSuspendTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin_user_mgmt.confirm_suspend_title", "Suspend user?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin_user_mgmt.confirm_suspend_body", "{{name}} will lose access until their role is restored.", { name: suspendTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => suspendTarget && handleSuspend(suspendTarget)}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
