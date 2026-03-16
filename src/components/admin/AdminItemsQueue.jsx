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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, Flag, Search,
  Package, MoreHorizontal, Archive, Trash2,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function AdminItemsQueue({ items, filterStatus = "all" }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [noteDialog, setNoteDialog] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  // Status update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, action }) => {
      await appClient.entities.FoundItem.update(id, data);
      // Log audit
      await appClient.entities.AuditLog.create({
        action: action,
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
  });

  // Filter items
  const filtered = items
    .filter(item => statusFilter === "all" || item.status === statusFilter)
    .filter(item => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [item.title, item.description, item.finder_name, item.item_code]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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

      {/* Count */}
      <p className="text-sm text-slate-500">{filtered.length} items</p>

      {/* Item List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No items match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Card key={item.id} className={`transition-shadow hover:shadow-sm ${item.is_flagged ? "border-l-4 border-l-red-400" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                    {item.photo_urls?.[0] ? (
                      <img src={item.photo_urls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-slate-900 truncate">{item.title}</span>
                      <StatusBadge status={item.status} />
                      {item.is_flagged && <Badge className="bg-red-100 text-red-700 text-[10px]">Flagged</Badge>}
                      {item.item_code && <Badge variant="outline" className="font-mono text-[10px]">{item.item_code}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.location_found} • {item.date_found ? format(new Date(item.date_found), "MMM d") : ""} • by {item.finder_name || "Unknown"}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  {item.status === "pending_review" && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        className="text-emerald-600 hover:bg-emerald-50 gap-1 h-8"
                        onClick={() => updateMutation.mutate({ id: item.id, data: { status: "approved" }, action: "Item approved" })}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-red-600 hover:bg-red-50 gap-1 h-8"
                        onClick={() => updateMutation.mutate({ id: item.id, data: { status: "archived" }, action: "Item rejected" })}
                        disabled={updateMutation.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}

                  {/* More Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { status: "approved" }, action: "Status → Approved" })}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Approved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { status: "returned" }, action: "Status → Returned" })}>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Mark Returned
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { status: "archived" }, action: "Status → Archived" })}>
                        <Archive className="w-4 h-4 mr-2" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, data: { is_flagged: !item.is_flagged }, action: item.is_flagged ? "Unflagged" : "Flagged" })}>
                        <Flag className="w-4 h-4 mr-2" /> {item.is_flagged ? "Unflag" : "Flag"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setNoteDialog(item); setAdminNote(""); }}>
                        <MessageSquare className="w-4 h-4 mr-2" /> Add Note
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription>For: {noteDialog?.title}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Enter note..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
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
            }}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}