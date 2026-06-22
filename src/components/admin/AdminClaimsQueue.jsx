/**
 * FindBack AI - Admin Claims Queue
 * Review, approve, reject claims with AI risk indicators.
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
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/ui/StatusBadge";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import { getPrimaryRecordPhoto } from "@/lib/media";
import { formatLocalizedDate, translateStatus } from "@/lib/i18n-helpers";
import {
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Search,
  Shield,
  Star,
} from "lucide-react";

export default function AdminClaimsQueue({ claims, foundItems = [] }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailDialog, setDetailDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const getRelatedItemStatus = (claimStatus) => {
    if (claimStatus === "approved") {
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
      const nextClaim = { ...claim, ...data };

      if (data.status) {
        const relatedItemStatus = getRelatedItemStatus(data.status);
        if (relatedItemStatus) {
          await appClient.entities.FoundItem.update(claim.found_item_id, {
            status: relatedItemStatus,
            ...(data.status === "completed"
              ? {
                  claim_confirmed: true,
                  claim_confirmed_at: data.received_confirmed_at || new Date().toISOString(),
                }
              : {}),
          });
        }
      }

      if (
        nextClaim.claimant_rating &&
        (data.review_status || data.claimant_rating || data.claimant_review || data.review_reviewed_at)
      ) {
        await appClient.entities.FoundItem.upsertRating(claim.found_item_id, {
          claim_id: claim.id,
          rating: nextClaim.claimant_rating,
          review: nextClaim.claimant_review || "",
          claimant_name: nextClaim.claimant_name || "",
          reviewer_email: nextClaim.claimant_email || "",
          review_status: nextClaim.review_status || "pending",
          review_submitted_at: nextClaim.review_submitted_at || "",
          review_reviewed_at: nextClaim.review_reviewed_at || "",
        });
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
      toast({ title: t("admin_claims_queue.claim_updated") });
    },
    onError: (error) => {
      toast({
        title: t("admin_claims_queue.claim_update_failed"),
        description: error.message || t("admin_claims_queue.claim_update_failed_description"),
        variant: "destructive",
      });
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
    if (score >= 70) return "border-red-900/50 bg-red-950/25 text-red-400";
    if (score >= 40) return "border-amber-900/50 bg-amber-950/25 text-amber-400";
    return "border-emerald-900/50 bg-emerald-950/25 text-emerald-400";
  };

  return (
    <div className="space-y-4">
      <div className="surface-card bg-slate-900 border-slate-800 p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t("admin_claims_queue.search_placeholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      <p className="text-sm text-slate-400">{t("admin_claims_queue.count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="surface-card bg-slate-900 border-slate-800 px-6 py-14 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">{t("admin_claims_queue.no_claims")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <Card
              key={claim.id}
              className={`${claim.risk_score >= 70 ? "border-red-900/50 bg-red-950/10" : "border-slate-800 bg-slate-900/40"}`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <RecordThumbnail
                    src={getPrimaryRecordPhoto(
                      claim,
                      foundItems.find((item) => item.id === claim.found_item_id)
                    )}
                    alt={claim.found_item_title || "Claim"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-100">{claim.found_item_title || t("admin_claims_queue.unknown_item")}</h3>
                      <StatusBadge status={claim.status} />
                      {claim.risk_score != null && (
                        <Badge className={getRiskColor(claim.risk_score)}>
                          {t("admin_claims_queue.risk_label", { score: claim.risk_score })}
                        </Badge>
                      )}
                      {claim.proof_photo_url && (
                        <Badge variant="outline" className="border-slate-800 text-slate-300">{t("admin_claims_queue.proof_photo")}</Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span>{claim.claimant_name} ({claim.claimant_email})</span>
                      <span>{claim.created_date ? formatLocalizedDate(claim.created_date, "MMM d") : ""}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{claim.reason}</p>

                    {claim.claimant_rating ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-3.5 w-3.5 ${
                                index < claim.claimant_rating ? "fill-amber-450 text-amber-400" : "text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <span>{t("admin_claims_queue.review_label", { status: translateStatus(t, claim.review_status || "submitted") })}</span>
                      </div>
                    ) : null}

                    {claim.risk_flags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {claim.risk_flags.slice(0, 3).map((flag, index) => (
                          <Badge key={index} variant="outline" className="border-red-900 bg-red-950 text-red-400">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-800 hover:bg-slate-800 text-slate-300 gap-1"
                      onClick={() => {
                        setDetailDialog(claim);
                        setAdminNotes(claim.admin_notes || "");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("admin_dashboard.review", "Review")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl font-bold">
              <Shield className="w-5 h-5 text-indigo-400" />
              {t("admin_claims_queue.claim_details", "Review Claim")}
            </DialogTitle>
          </DialogHeader>

          {detailDialog && (
            <div className="space-y-4 text-sm mt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.claimant")}</p>
                  <p className="mt-1.5 font-semibold text-white">{detailDialog.claimant_name}</p>
                  <p className="mt-0.5 text-slate-400">{detailDialog.claimant_email}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.status")}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={detailDialog.status} />
                    <span className="text-slate-300 text-xs">{t("claim_item.student_id")}: {detailDialog.student_id || t("common.not_available")}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.reason")}</p>
                <p className="mt-1.5 leading-relaxed text-slate-200">{detailDialog.reason}</p>
              </div>

              {detailDialog.identifying_details && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.identifying_details")}</p>
                  <p className="mt-1.5 leading-relaxed text-slate-200">{detailDialog.identifying_details}</p>
                </div>
              )}

              {detailDialog.received_confirmed_at && (
                <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 px-4 py-3 text-emerald-400">
                  {t("admin_claims_queue.received_on", {
                    date: formatLocalizedDate(detailDialog.received_confirmed_at, "MMM d, yyyy"),
                  })}
                </div>
              )}

              {detailDialog.proof_photo_url && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.proof_photo")}</p>
                  <img
                    src={detailDialog.proof_photo_url}
                    alt={t("admin_claims_queue.proof_photo")}
                    className="w-full max-h-60 rounded-xl border border-slate-800 object-contain bg-slate-950"
                  />
                </div>
              )}

              {detailDialog.risk_score != null && (
                <div className={`rounded-xl border px-4 py-3 ${getRiskColor(detailDialog.risk_score)}`}>
                  <p className="font-bold">{t("admin_claims_queue.risk_score", { score: detailDialog.risk_score })}</p>
                  {detailDialog.risk_flags?.map((flag, index) => (
                    <p key={index} className="mt-1 text-xs">{flag}</p>
                  ))}
                </div>
              )}

              {/* Status Update & Moderation action buttons */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <p className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.actions", "Claim Status Actions")}</p>
                <div className="flex flex-wrap gap-2">
                  {detailDialog.status === "submitted" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "approved" }, action: "Claim approved" })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {t("admin_claims_queue.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-900 bg-red-950/20 text-red-400 hover:bg-red-950/40"
                        onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "rejected" }, action: "Claim rejected" })}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        {t("admin_claims_queue.reject")}
                      </Button>
                    </>
                  )}
                  {detailDialog.status !== "under_review" && detailDialog.status !== "completed" && detailDialog.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-850"
                      onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "under_review" }, action: "Status → Under Review" })}
                    >
                      {t("admin_claims_queue.mark_under_review", "Mark Under Review")}
                    </Button>
                  )}
                  {detailDialog.status !== "need_more_info" && detailDialog.status !== "completed" && detailDialog.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-850"
                      onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "need_more_info" }, action: "Status → Need More Info" })}
                    >
                      {t("admin_claims_queue.request_more_info", "Request More Info")}
                    </Button>
                  )}
                  {detailDialog.status !== "completed" && detailDialog.status === "approved" && (
                    <Button
                      size="sm"
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-semibold animate-pulse"
                      onClick={() => updateMutation.mutate({
                        claim: detailDialog,
                        data: {
                          status: "completed",
                          received_confirmed_at: new Date().toISOString(),
                        },
                        action: "Status → Completed",
                      })}
                    >
                      {t("admin_claims_queue.mark_completed", "Complete Hand-off")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-400">{t("admin_claims_queue.admin_notes")}</label>
                <Textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  rows={2}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-650 focus-visible:ring-indigo-500"
                />
              </div>

              {detailDialog.claimant_rating ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-slate-200">{t("admin_claims_queue.claimant_rating")}</p>
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < detailDialog.claimant_rating ? "fill-amber-400 text-amber-400" : "text-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                  {detailDialog.claimant_review && (
                    <p className="mt-3 text-sm leading-6 text-slate-300">{detailDialog.claimant_review}</p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">
                    {t("admin_claims_queue.review_status", {
                      status: detailDialog.review_status
                        ? translateStatus(t, detailDialog.review_status)
                        : t("admin_claims_queue.not_submitted"),
                    })}
                  </p>
                </div>
              ) : null}

              {detailDialog.review_status === "pending" && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
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
                    {t("admin_claims_queue.approve_rating")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-850 hover:bg-slate-800 text-slate-300"
                    onClick={() =>
                      updateMutation.mutate({
                        claim: detailDialog,
                        data: {
                          review_status: "rejected",
                          review_reviewed_at: new Date().toISOString(),
                        },
                        action: "Review rejected",
                        notifyUser: {
                          title: t("admin_claims_queue.rating_rejected_title"),
                          message: t("admin_claims_queue.rating_rejected_message", { title: detailDialog.found_item_title }),
                        },
                      })
                    }
                  >
                    {t("admin_claims_queue.reject_rating")}
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-800/50">
            <Button
              variant="outline"
              className="border-slate-800 hover:bg-slate-800 text-slate-300"
              onClick={() => setDetailDialog(null)}
            >
              {t("common.close")}
            </Button>
            <Button
              className="bg-indigo-650 hover:bg-indigo-600 text-white"
              onClick={async () => {
                if (detailDialog) {
                  await appClient.entities.Claim.update(detailDialog.id, { admin_notes: adminNotes });
                  setDetailDialog(null);
                  queryClient.invalidateQueries();
                  toast({ title: t("admin_claims_queue.notes_saved") });
                }
              }}
            >
              {t("admin_claims_queue.save_notes", "Save & Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
