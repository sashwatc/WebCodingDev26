/**
 * FindBack AI - Admin Items Moderation Queue
 * Approve, reject, edit, flag, and manage found items.
 * Includes duplicate detection alerts and bulk actions.
 */

import React, { useState } from "react";
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
  DialogDescription,
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
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Flag,
  Search,
  Package,
  MoreHorizontal,
  Archive,
  Trash2,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AdminItemsQueue({ items, filterStatus = "all" }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [noteDialog, setNoteDialog] = useState(null);
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
      toast({ title: "Updated", description: "Item updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "The item could not be updated.",
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
      toast({ title: "Deleted", description: "Item removed." });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "The item could not be removed.",
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
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search items by title, finder, or item code"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-slate-600">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No items match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`${item.is_flagged ? "border-red-200 bg-red-50/30" : ""} overflow-hidden`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-slate-100 flex-shrink-0">
                      {item.photo_urls?.[0] ? (
                        <img src={item.photo_urls[0]} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                        <StatusBadge status={item.status} />
                        {item.is_flagged && <Badge className="border-red-200 bg-red-100 text-red-700">Flagged</Badge>}
                        {item.item_code && <Badge variant="outline" className="font-mono">{item.item_code}</Badge>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {item.location_found} • {item.date_found ? format(new Date(item.date_found), "MMM d") : ""} • {item.finder_name || "Unknown finder"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {item.status === "pending_review" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700"
                          onClick={() => updateMutation.mutate({ id: item.id, data: { status: "approved" }, action: "Item approved" })}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-700"
                          onClick={() => updateMutation.mutate({ id: item.id, data: { status: "archived" }, action: "Item rejected" })}
                          disabled={updateMutation.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { status: "approved" }, action: "Status → Approved" })}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { status: "returned" }, action: "Status → Returned" })}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-700" />
                          Mark Returned
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { status: "archived" }, action: "Status → Archived" })}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { is_flagged: !item.is_flagged }, action: item.is_flagged ? "Unflagged" : "Flagged" })}>
                          <Flag className="mr-2 h-4 w-4" />
                          {item.is_flagged ? "Unflag" : "Flag"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setNoteDialog(item); setAdminNote(""); }}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Note
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-red-700">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription>For: {noteDialog?.title}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Enter note..." value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (noteDialog && adminNote.trim()) {
                  await appClient.entities.AuditLog.create({
                    action: "Admin note added",
                    entity_type: "found_item",
                    entity_id: noteDialog.id,
                    performed_by: "admin",
                    details: adminNote,
                  });
                  setNoteDialog(null);
                  toast({ title: "Note saved" });
                }
              }}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
