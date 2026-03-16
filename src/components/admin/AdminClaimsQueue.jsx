/**
 * FindBack AI - Admin Claims Queue
 * Review, approve, reject claims with AI risk indicators.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, Eye, AlertTriangle,
  Search, Shield, MoreHorizontal, MessageSquare
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function AdminClaimsQueue({ claims }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailDialog, setDetailDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, action }) => {
      await base44.entities.Claim.update(id, data);
      await base44.entities.AuditLog.create({
        action,
        entity_type: "claim",
        entity_id: id,
        performed_by: "admin",
        details: `Claim status: ${data.status}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClaims"] });
      toast({ title: "Claim updated" });
    },
  });

  const filtered = claims.filter(claim => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [claim.claimant_name, claim.found_item_title, claim.reason]
      .filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const getRiskColor = (score) => {
    if (score >= 70) return "bg-red-100 text-red-700";
    if (score >= 40) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <p className="text-sm text-slate-500">{filtered.length} claims</p>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No claims to review.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(claim => (
            <Card key={claim.id} className={`hover:shadow-sm transition-shadow ${claim.risk_score >= 70 ? "border-l-4 border-l-red-400" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">{claim.found_item_title || "Unknown Item"}</span>
                      <StatusBadge status={claim.status} />
                      {claim.risk_score != null && (
                        <Badge className={`text-[10px] ${getRiskColor(claim.risk_score)}`}>
                          Risk: {claim.risk_score}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      by {claim.claimant_name} ({claim.claimant_email}) •{" "}
                      {claim.created_date ? format(new Date(claim.created_date), "MMM d") : ""}
                    </p>
                    {claim.risk_flags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {claim.risk_flags.slice(0, 3).map((flag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-red-600 border-red-200">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions for submitted claims */}
                  {claim.status === "submitted" && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50 h-8 gap-1"
                        onClick={() => updateMutation.mutate({ id: claim.id, data: { status: "approved" }, action: "Claim approved" })}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 h-8 gap-1"
                        onClick={() => updateMutation.mutate({ id: claim.id, data: { status: "rejected" }, action: "Claim rejected" })}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" className="gap-1 h-8"
                    onClick={() => { setDetailDialog(claim); setAdminNotes(claim.admin_notes || ""); }}>
                    <Eye className="w-3.5 h-3.5" /> Details
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: claim.id, data: { status: "under_review" }, action: "Status → Under Review" })}>
                        Mark Under Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: claim.id, data: { status: "need_more_info" }, action: "Status → Need More Info" })}>
                        Request More Info
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: claim.id, data: { status: "completed" }, action: "Status → Completed" })}>
                        Mark Completed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Claimant:</span> <span className="font-medium">{detailDialog.claimant_name}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium">{detailDialog.claimant_email}</span></div>
                <div><span className="text-slate-500">Student ID:</span> <span className="font-medium">{detailDialog.student_id || "N/A"}</span></div>
                <div><span className="text-slate-500">Status:</span> <StatusBadge status={detailDialog.status} /></div>
              </div>
              <div className="text-sm">
                <p className="text-slate-500 mb-1">Reason:</p>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-700">{detailDialog.reason}</p>
              </div>
              {detailDialog.identifying_details && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-1">Identifying Details:</p>
                  <p className="bg-slate-50 p-3 rounded-lg text-slate-700">{detailDialog.identifying_details}</p>
                </div>
              )}
              {detailDialog.proof_photo_url && (
                <img src={detailDialog.proof_photo_url} alt="Proof" className="w-full max-h-48 object-contain rounded-lg border" />
              )}
              {detailDialog.risk_score != null && (
                <div className={`p-3 rounded-lg ${getRiskColor(detailDialog.risk_score)} border text-sm`}>
                  <p className="font-semibold">AI Risk Score: {detailDialog.risk_score}/100</p>
                  {detailDialog.risk_flags?.map((f, i) => <p key={i} className="text-xs mt-0.5">• {f}</p>)}
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500 mb-1">Admin Notes:</p>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
            <Button onClick={async () => {
              if (detailDialog) {
                await base44.entities.Claim.update(detailDialog.id, { admin_notes: adminNotes });
                setDetailDialog(null);
                queryClient.invalidateQueries({ queryKey: ["adminClaims"] });
                toast({ title: "Notes saved" });
              }
            }}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}