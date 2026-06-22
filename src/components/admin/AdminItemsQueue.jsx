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
import {
  CheckCircle2,
  XCircle,
  Flag,
  Search,
  Package,
  Trash2,
  Eye,
} from "lucide-react";

export default function AdminItemsQueue({ items, filterStatus = "all" }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, action }) => {
      await appClient.entities.FoundItem.update(id, data);
      await appClient.entities.AuditLog.create({
        action,
        entity_type: "found_item",
        entity_id: id,
        performed_by: "admin",
        details: `Status changed to ${data.status || "updated"}`,
      });
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
      await appClient.entities.FoundItem.delete(id);
      await appClient.entities.AuditLog.create({
        action: "Item deleted",
        entity_type: "found_item",
        entity_id: id,
        performed_by: "admin",
        details: "Item removed from system",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFoundItems"] });
      toast({ title: t("admin_items_queue.deleted"), description: t("admin_items_queue.deleted_description") });
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
    .filter((item) => statusFilter === "all" || item.status === statusFilter)
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
      <div className="surface-card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("admin_items_queue.search_placeholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-52 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin_items_queue.all_statuses")}</SelectItem>
              <SelectItem value="pending_review">{translateStatus(t, "pending_review")}</SelectItem>
              <SelectItem value="approved">{translateStatus(t, "approved")}</SelectItem>
              <SelectItem value="claimed">{translateStatus(t, "claimed")}</SelectItem>
              <SelectItem value="returned">{translateStatus(t, "returned")}</SelectItem>
              <SelectItem value="archived">{translateStatus(t, "archived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{t("admin_items_queue.count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="surface-card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 py-14 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">{t("admin_items_queue.no_items")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`${item.is_flagged ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/10" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40"} overflow-hidden`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                      {item.photo_urls?.[0] ? (
                        <img src={item.photo_urls[0]} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                        <StatusBadge status={item.status} />
                        {item.is_flagged && <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{t("admin_items_queue.flagged")}</Badge>}
                        {item.item_code && <Badge variant="outline" className="font-mono border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300">{item.item_code}</Badge>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
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
                      className="border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300"
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
            <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-xl font-bold">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {t("admin_items_queue.review_submission", "Review Submission")}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 text-sm mt-2">
              <div className="flex gap-4 items-start">
                <div className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                  {selectedItem.photo_urls?.[0] ? (
                    <img src={selectedItem.photo_urls[0]} alt={selectedItem.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{selectedItem.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedItem.status} />
                    {selectedItem.is_flagged && <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 font-semibold">{t("admin_items_queue.flagged")}</Badge>}
                    {selectedItem.item_code && <Badge variant="outline" className="font-mono border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">{selectedItem.item_code}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("admin_items_queue.finder", "Finder")}: <span className="text-slate-700 dark:text-slate-200 font-medium">{selectedItem.finder_name || t("admin_items_queue.unknown_finder")}</span>
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("common.location")}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{translateLocation(t, selectedItem.location_found)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("common.date")}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {selectedItem.date_found ? formatLocalizedDate(selectedItem.date_found, "PPP") : t("common.not_available")}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("common.description")}</p>
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selectedItem.description}</p>
                </div>
                {selectedItem.ai_description && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t("common.ai_description", "AI Enhancements")}</p>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">{selectedItem.ai_description}</p>
                  </div>
                )}
              </div>

              {/* Status Update select box & Flag button */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin_items_queue.update_status", "Update Status")}</label>
                  <Select
                    value={selectedItem.status}
                    onValueChange={(val) => {
                      updateMutation.mutate({
                        id: selectedItem.id,
                        data: { status: val },
                        action: `Status changed to ${val}`,
                      });
                      setSelectedItem({ ...selectedItem, status: val });
                    }}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_review">{translateStatus(t, "pending_review")}</SelectItem>
                      <SelectItem value="approved">{translateStatus(t, "approved")}</SelectItem>
                      <SelectItem value="claimed">{translateStatus(t, "claimed")}</SelectItem>
                      <SelectItem value="returned">{translateStatus(t, "returned")}</SelectItem>
                      <SelectItem value="archived">{translateStatus(t, "archived")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <Button
                    variant="outline"
                    className={`w-full ${
                      selectedItem.is_flagged
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 dark:bg-slate-950"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin_items_queue.add_admin_note")}</label>
                <Textarea
                  placeholder={t("admin_items_queue.note_placeholder")}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={2}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Bottom Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                  onClick={() => {
                    if (window.confirm(t("admin_items_queue.confirm_delete", "Are you sure you want to delete this item?"))) {
                      deleteMutation.mutate(selectedItem.id);
                      setSelectedItem(null);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("admin_items_queue.delete")}
                </Button>

                <div className="flex gap-2">
                  {selectedItem.status === "pending_review" && (
                    <>
                      <Button
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                        onClick={() => {
                          updateMutation.mutate({ id: selectedItem.id, data: { status: "archived" }, action: "Item rejected" });
                          setSelectedItem({ ...selectedItem, status: "archived" });
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t("admin_items_queue.reject")}
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => {
                          updateMutation.mutate({ id: selectedItem.id, data: { status: "approved" }, action: "Item approved" });
                          setSelectedItem({ ...selectedItem, status: "approved" });
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t("admin_items_queue.approve")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-200 dark:border-slate-800/50">
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
            >
              {t("common.close")}
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
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
    </div>
  );
}
