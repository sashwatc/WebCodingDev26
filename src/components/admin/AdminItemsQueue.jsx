/**
 * FindBack AI - Admin Items Moderation Queue
 * Approve, reject, edit, flag, and manage found items.
 * Includes duplicate detection alerts and bulk actions.
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatLocalizedDate, translateLocation, translateStatus } from "@/lib/i18n-helpers";
import { canonicalFoundItemStatus } from "@/lib/found-items";
import {
  CheckCircle2,
  XCircle,
  Flag,
  Search,
  Package,
  Trash2,
  Eye,
} from "lucide-react";

// Found items carry canonical statuses (FOUND/CLAIM_PENDING/VERIFIED/ARCHIVED).
const ITEM_STATUS_OPTIONS = ["FOUND", "CLAIM_PENDING", "VERIFIED", "ARCHIVED"];

export default function AdminItemsQueue({ items = [], filterStatus = "all" }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, action }) => {
      await appClient.entities.FoundItem.update(id, data);
      // Audit logging is best-effort: never let a logging failure make the
      // approve/reject action appear broken to the admin.
      try {
        await appClient.entities.AuditLog.create({
          action,
          entity_type: "found_item",
          entity_id: id,
          performed_by: "admin",
          details: `Status changed to ${data.status || "updated"}`,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-fatal):", auditError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFoundItems"] });
      toast({ title: t("admin_items_queue.updated"), description: t("admin_items_queue.updated_description") });
    },
    onError: (error) => {
      toast({
        title: t("admin_items_queue.update_failed"),
        description: error.message || t("admin_items_queue.update_failed_description"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const result = await appClient.entities.FoundItem.delete(id);
      await appClient.entities.AuditLog.create({
        action: result?.archived ? "Item archived" : "Item deleted",
        entity_type: "found_item",
        entity_id: id,
        performed_by: "admin",
        details: result?.archived
          ? "Item archived because it has existing claims or lost-report references"
          : "Item removed from system",
      });
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["adminFoundItems"] });
      toast({
        title: result?.archived
          ? t("admin_items_queue.archived", "Item archived")
          : t("admin_items_queue.deleted"),
        description: result?.archived
          ? t("admin_items_queue.archived_description", "This item has related records, so it was archived instead of deleted.")
          : t("admin_items_queue.deleted_description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("admin_items_queue.delete_failed"),
        description: error.message || t("admin_items_queue.delete_failed_description"),
        variant: "destructive",
      });
    },
  });

  const filtered = items
    .filter((item) => statusFilter === "all" || canonicalFoundItemStatus(item.status) === statusFilter)
    .filter((item) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return [item.title, item.description, item.finder_name, item.item_code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  return (
    <div className="space-y-4">
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("admin_items_queue.search_placeholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-52 bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin_items_queue.all_statuses")}</SelectItem>
              {ITEM_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{translateStatus(t, s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("admin_items_queue.count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="search-state-panel">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("admin_items_queue.no_items")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`${item.is_flagged ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/10" : "border-border bg-card"} overflow-hidden`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-muted flex-shrink-0 border border-border">
                      {item.photo_urls?.[0] ? (
                        <img src={item.photo_urls[0]} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                        <StatusBadge status={item.status} />
                        {item.is_flagged && <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{t("admin_items_queue.flagged")}</Badge>}
                        {item.item_code && <Badge variant="outline" className="font-mono border-border text-muted-foreground">{item.item_code}</Badge>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{translateLocation(t, item.location_found)}</span>
                        <span>{item.date_found ? formatLocalizedDate(item.date_found, "MMM d") : ""}</span>
                        <span>{item.finder_name || t("admin_items_queue.unknown_finder")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border hover:bg-muted text-muted-foreground"
                      onClick={() => {
                        setSelectedItem(item);
                        setAdminNote("");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      {t("admin_dashboard.review", "Review")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 text-xl font-bold">
              <Package className="w-5 h-5 text-primary" />
              {t("admin_items_queue.review_submission", "Review Submission")}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 text-sm mt-2">
              <div className="flex gap-4 items-start">
                <div className="h-24 w-24 overflow-hidden rounded-xl bg-muted flex-shrink-0 border border-border">
                  {selectedItem.photo_urls?.[0] ? (
                    <img src={selectedItem.photo_urls[0]} alt={selectedItem.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate">{selectedItem.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedItem.status} />
                    {selectedItem.is_flagged && <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 font-semibold">{t("admin_items_queue.flagged")}</Badge>}
                    {selectedItem.item_code && <Badge variant="outline" className="font-mono border-border text-muted-foreground">{selectedItem.item_code}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin_items_queue.finder", "Finder")}: <span className="text-foreground font-medium">{selectedItem.finder_name || t("admin_items_queue.unknown_finder")}</span>
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="soft-panel p-3">
                  <p className="section-label">{t("common.location")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{translateLocation(t, selectedItem.location_found)}</p>
                </div>
                <div className="soft-panel p-3">
                  <p className="section-label">{t("common.date")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedItem.date_found ? formatLocalizedDate(selectedItem.date_found, "PPP") : t("common.not_available")}
                  </p>
                </div>
              </div>

              <div className="soft-panel p-4 space-y-2">
                <div>
                  <p className="section-label">{t("common.description")}</p>
                  <p className="mt-1.5 text-sm text-foreground leading-relaxed">{selectedItem.description}</p>
                </div>
                {selectedItem.ai_description && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-primary">{t("common.ai_description", "AI Enhancements")}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed italic">{selectedItem.ai_description}</p>
                  </div>
                )}
              </div>

              {/* Status Update select box & Flag button */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <label className="section-label">{t("admin_items_queue.update_status", "Update Status")}</label>
                  <Select
                    value={canonicalFoundItemStatus(selectedItem.status)}
                    onValueChange={(val) => {
                      updateMutation.mutate({
                        id: selectedItem.id,
                        data: { status: val },
                        action: `Status changed to ${val}`,
                      });
                      setSelectedItem({ ...selectedItem, status: val });
                    }}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{translateStatus(t, s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <Button
                    variant="outline"
                    className={`w-full ${
                      selectedItem.is_flagged
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20 dark:text-red-400 dark:border-red-900/50"
                        : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => {
                      const nextFlagged = !selectedItem.is_flagged;
                      updateMutation.mutate({
                        id: selectedItem.id,
                        data: { is_flagged: nextFlagged },
                        action: nextFlagged ? "Item flagged" : "Item unflagged",
                      });
                      setSelectedItem({ ...selectedItem, is_flagged: nextFlagged });
                    }}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    {selectedItem.is_flagged ? t("admin_items_queue.unflag") : t("admin_items_queue.flag")}
                  </Button>
                </div>
              </div>

              {/* Admin note section */}
              <div className="space-y-1.5 pt-2">
                <label className="section-label">{t("admin_items_queue.add_admin_note")}</label>
                <Textarea
                  placeholder={t("admin_items_queue.note_placeholder")}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={2}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                />
              </div>

              {/* Bottom Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                  onClick={() => setDeleteTarget(selectedItem)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("admin_items_queue.delete")}
                </Button>

                <div className="flex gap-2">
                  {selectedItem.status === "pending_review" && (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {t("admin_items_queue.reject")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The item will be removed from the active queue.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => {
                                updateMutation.mutate({ id: selectedItem.id, data: { status: "archived" }, action: "Item rejected" });
                                setSelectedItem({ ...selectedItem, status: "archived" });
                              }}
                            >
                              {t("admin_items_queue.reject")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {t("admin_items_queue.approve")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approve this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The item will be published and visible to students.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                updateMutation.mutate({ id: selectedItem.id, data: { status: "approved" }, action: "Item approved" });
                                setSelectedItem({ ...selectedItem, status: "approved" });
                              }}
                            >
                              {t("admin_items_queue.approve")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
            >
              {t("common.close")}
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (selectedItem && adminNote.trim()) {
                  await appClient.entities.AuditLog.create({
                    action: "Admin note added",
                    entity_type: "found_item",
                    entity_id: selectedItem.id,
                    performed_by: "admin",
                    details: adminNote,
                  });
                  toast({ title: t("admin_items_queue.note_saved") });
                }
                setSelectedItem(null);
              }}
            >
              {t("admin_items_queue.save_note", "Save & Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                  setSelectedItem(null);
                  setDeleteTarget(null);
                }
              }}
            >
              {t("admin_items_queue.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
