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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Search,
  Shield,
  MoreHorizontal,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminClaimsQueue({ claims }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailDialog, setDetailDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const getRelatedItemStatus = (claimStatus) => {
    if (["submitted", "under_review", "need_more_info", "approved"].includes(claimStatus)) {
      return "claimed";
    }

    if (claimStatus === "rejected") {
      return "approved";
    }

    if (claimStatus === "completed") {
      return "returned";
    }

    return undefined;
  };

  const updateMutation = useMutation({
    mutationFn: async ({ claim, data, action, notifyUser = null }) => {
      await appClient.entities.Claim.update(claim.id, data);

      if (data.status) {
        const relatedItemStatus = getRelatedItemStatus(data.status);
        if (relatedItemStatus) {
          await appClient.entities.FoundItem.update(claim.found_item_id, { status: relatedItemStatus });
        }
      }

      if (notifyUser) {
        await appClient.entities.Notification.create({
          user_email: claim.claimant_email,
          title: notifyUser.title,
          message: notifyUser.message,
          type: "admin_action",
          link: notifyUser.link || "/UserDashboard",
          related_item_id: claim.found_item_id,
        });
      }

      await appClient.entities.AuditLog.create({
        action,
        entity_type: "claim",
        entity_id: claim.id,
        performed_by: "admin",
        details: data.status
          ? `Claim status: ${data.status}`
          : data.review_status
            ? `Review status: ${data.review_status}`
            : "Claim updated",
      });
    },
    onSuccess: () => {
      setDetailDialog(null);
      queryClient.invalidateQueries();
      toast({ title: "Claim updated" });
    },
  });

  const filtered = claims.filter((claim) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return [claim.claimant_name, claim.found_item_title, claim.reason]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const getRiskColor = (score) => {
    if (score >= 70) return "border-red-200 bg-red-50 text-red-700";
    if (score >= 40) return "border-amber-200 bg-amber-50 text-amber-800";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  return (
    <div className="space-y-4">
      <div className="surface-card p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search claims by item, claimant, or reason"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-sm text-slate-600">{filtered.length} claim{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No claims to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <Card
              key={claim.id}
              className={`${claim.risk_score >= 70 ? "border-red-200 bg-red-50/20" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">{claim.found_item_title || "Unknown item"}</h3>
                      <StatusBadge status={claim.status} />
                      {claim.risk_score != null && (
                        <Badge className={getRiskColor(claim.risk_score)}>
                          Risk {claim.risk_score}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {claim.claimant_name} ({claim.claimant_email}) •{" "}
                      {claim.created_date ? format(new Date(claim.created_date), "MMM d") : ""}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{claim.reason}</p>

                    {claim.claimant_rating ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-3.5 w-3.5 ${
                                index < claim.claimant_rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span>Review {claim.review_status || "submitted"}</span>
                      </div>
                    ) : null}

                    {claim.risk_flags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {claim.risk_flags.slice(0, 3).map((flag, index) => (
                          <Badge key={index} variant="outline" className="border-red-200 bg-white text-red-700">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {claim.status === "submitted" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700"
                          onClick={() => updateMutation.mutate({ claim, data: { status: "approved" }, action: "Claim approved" })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-700"
                          onClick={() => updateMutation.mutate({ claim, data: { status: "rejected" }, action: "Claim rejected" })}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setDetailDialog(claim);
                        setAdminNotes(claim.admin_notes || "");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ claim, data: { status: "under_review" }, action: "Status → Under Review" })}>
                          Mark Under Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ claim, data: { status: "need_more_info" }, action: "Status → Need More Info" })}>
                          Request More Info
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ claim, data: { status: "completed" }, action: "Status → Completed" })}>
                          Mark Completed
                        </DropdownMenuItem>
                        {claim.review_status === "pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                updateMutation.mutate({
                                  claim,
                                  data: {
                                    review_status: "approved",
                                    review_reviewed_at: new Date().toISOString(),
                                  },
                                  action: "Review approved",
                                  notifyUser: {
                                    title: "Rating approved",
                                    message: `Your rating for ${claim.found_item_title} is now visible.`,
                                    link: `/ItemDetails?id=${claim.found_item_id}`,
                                  },
                                })
                              }
                            >
                              Approve Rating
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateMutation.mutate({
                                  claim,
                                  data: {
                                    review_status: "rejected",
                                    review_reviewed_at: new Date().toISOString(),
                                  },
                                  action: "Review rejected",
                                  notifyUser: {
                                    title: "Rating needs changes",
                                    message: `Your rating for ${claim.found_item_title} was not approved yet. You can edit and resubmit it from your dashboard.`,
                                  },
                                })
                              }
                            >
                              Reject Rating
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
          </DialogHeader>

          {detailDialog && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Claimant</p>
                  <p className="mt-2 font-medium text-slate-900">{detailDialog.claimant_name}</p>
                  <p className="mt-1 text-slate-600">{detailDialog.claimant_email}</p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={detailDialog.status} />
                    <span className="text-slate-600">Student ID: {detailDialog.student_id || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{detailDialog.reason}</p>
              </div>

              {detailDialog.identifying_details && (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Identifying Details</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{detailDialog.identifying_details}</p>
                </div>
              )}

              {detailDialog.received_confirmed_at && (
                <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  Claimant confirmed receipt on {format(new Date(detailDialog.received_confirmed_at), "MMM d, yyyy")}
                </div>
              )}

              {detailDialog.proof_photo_url && (
                <img
                  src={detailDialog.proof_photo_url}
                  alt="Proof"
                  className="w-full rounded-[18px] border border-slate-200 object-contain"
                />
              )}

              {detailDialog.risk_score != null && (
                <div className={`rounded-[18px] border px-4 py-4 text-sm ${getRiskColor(detailDialog.risk_score)}`}>
                  <p className="font-semibold">Risk score: {detailDialog.risk_score}/100</p>
                  {detailDialog.risk_flags?.map((flag, index) => (
                    <p key={index} className="mt-1 text-xs">• {flag}</p>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Admin notes</p>
                <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={3} />
              </div>

              {detailDialog.claimant_rating ? (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Claimant Rating</p>
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < detailDialog.claimant_rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {detailDialog.claimant_review && (
                    <p className="mt-3 text-sm leading-6 text-slate-700">{detailDialog.claimant_review}</p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">
                    Review status: {detailDialog.review_status || "not submitted"}
                  </p>
                </div>
              ) : null}

              {detailDialog.review_status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        claim: detailDialog,
                        data: {
                          review_status: "approved",
                          review_reviewed_at: new Date().toISOString(),
                        },
                        action: "Review approved",
                        notifyUser: {
                          title: "Rating approved",
                          message: `Your rating for ${detailDialog.found_item_title} is now visible.`,
                          link: `/ItemDetails?id=${detailDialog.found_item_id}`,
                        },
                      })
                    }
                  >
                    Approve Rating
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate({
                        claim: detailDialog,
                        data: {
                          review_status: "rejected",
                          review_reviewed_at: new Date().toISOString(),
                        },
                        action: "Review rejected",
                        notifyUser: {
                          title: "Rating needs changes",
                          message: `Your rating for ${detailDialog.found_item_title} was not approved yet. You can edit and resubmit it from your dashboard.`,
                        },
                      })
                    }
                  >
                    Reject Rating
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
            <Button
              onClick={async () => {
                if (detailDialog) {
                  await appClient.entities.Claim.update(detailDialog.id, { admin_notes: adminNotes });
                  setDetailDialog(null);
                  queryClient.invalidateQueries();
                  toast({ title: "Notes saved" });
                }
              }}
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
