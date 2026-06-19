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
  MoreHorizontal,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminClaimsQueue({ claims, foundItems = [] }) {
  const { t } = useTranslation();
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
      const nextClaim = { ...claim, ...data };

      if (data.status) {
        const relatedItemStatus = getRelatedItemStatus(data.status);
        if (relatedItemStatus) {
          await appClient.entities.FoundItem.update(claim.found_item_id, { status: relatedItemStatus });
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
            placeholder={t("admin_claims_queue.search_placeholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-sm text-slate-600">{t("admin_claims_queue.count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">{t("admin_claims_queue.no_claims")}</p>
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
                  <RecordThumbnail
                    src={getPrimaryRecordPhoto(
                      claim,
                      foundItems.find((item) => item.id === claim.found_item_id)
                    )}
                    alt={claim.found_item_title || "Claim"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">{claim.found_item_title || t("admin_claims_queue.unknown_item")}</h3>
                      <StatusBadge status={claim.status} />
                      {claim.risk_score != null && (
                        <Badge className={getRiskColor(claim.risk_score)}>
                          {t("admin_claims_queue.risk_label", { score: claim.risk_score })}
                        </Badge>
                      )}
                      {claim.proof_photo_url && (
                        <Badge variant="outline">{t("admin_claims_queue.proof_photo")}</Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                      <span>{claim.claimant_name} ({claim.claimant_email})</span>
                      <span>{claim.created_date ? formatLocalizedDate(claim.created_date, "MMM d") : ""}</span>
                    </div>
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
                        <span>{t("admin_claims_queue.review_label", { status: translateStatus(t, claim.review_status || "submitted") })}</span>
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
                          {t("admin_claims_queue.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-700"
                          onClick={() => updateMutation.mutate({ claim, data: { status: "rejected" }, action: "Claim rejected" })}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t("admin_claims_queue.reject")}
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
                      {t("admin_claims_queue.details")}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ claim, data: { status: "under_review" }, action: "Status → Under Review" })}>
                          {t("admin_claims_queue.mark_under_review")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ claim, data: { status: "need_more_info" }, action: "Status → Need More Info" })}>
                          {t("admin_claims_queue.request_more_info")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ claim, data: { status: "completed" }, action: "Status → Completed" })}>
                          {t("admin_claims_queue.mark_completed")}
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
                                    title: t("admin_claims_queue.rating_approved_title"),
                                    message: t("admin_claims_queue.rating_approved_message", { title: claim.found_item_title }),
                                    link: `/ItemDetails?id=${claim.found_item_id}`,
                                  },
                                })
                              }
                            >
                              {t("admin_claims_queue.approve_rating")}
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
                                    title: t("admin_claims_queue.rating_rejected_title"),
                                    message: t("admin_claims_queue.rating_rejected_message", { title: claim.found_item_title }),
                                  },
                                })
                              }
                            >
                              {t("admin_claims_queue.reject_rating")}
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
            <DialogTitle>{t("admin_claims_queue.claim_details")}</DialogTitle>
          </DialogHeader>

          {detailDialog && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-sm font-semibold text-slate-700">{t("admin_claims_queue.claimant")}</p>
                  <p className="mt-2 font-medium text-slate-900">{detailDialog.claimant_name}</p>
                  <p className="mt-1 text-slate-600">{detailDialog.claimant_email}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-sm font-semibold text-slate-700">{t("admin_claims_queue.status")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={detailDialog.status} />
                    <span className="text-slate-600">{t("claim_item.student_id")}: {detailDialog.student_id || t("common.not_available")}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-700">{t("admin_claims_queue.reason")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{detailDialog.reason}</p>
              </div>

              {detailDialog.identifying_details && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">{t("admin_claims_queue.identifying_details")}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{detailDialog.identifying_details}</p>
                </div>
              )}

              {detailDialog.received_confirmed_at && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  {t("admin_claims_queue.received_on", {
                    date: formatLocalizedDate(detailDialog.received_confirmed_at, "MMM d, yyyy"),
                  })}
                </div>
              )}

              {detailDialog.proof_photo_url && (
                <img
                  src={detailDialog.proof_photo_url}
                  alt={t("admin_claims_queue.proof_photo")}
                  className="w-full rounded-xl border border-slate-200 object-contain"
                />
              )}

              {detailDialog.risk_score != null && (
                <div className={`rounded-xl border px-4 py-4 text-sm ${getRiskColor(detailDialog.risk_score)}`}>
                  <p className="font-semibold">{t("admin_claims_queue.risk_score", { score: detailDialog.risk_score })}</p>
                  {detailDialog.risk_flags?.map((flag, index) => (
                    <p key={index} className="mt-1 text-xs">{flag}</p>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">{t("admin_claims_queue.admin_notes")}</p>
                <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={3} />
              </div>

              {detailDialog.claimant_rating ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">{t("admin_claims_queue.claimant_rating")}</p>
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
                    {t("admin_claims_queue.approve_rating")}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>{t("common.close")}</Button>
            <Button
              onClick={async () => {
                if (detailDialog) {
                  await appClient.entities.Claim.update(detailDialog.id, { admin_notes: adminNotes });
                  setDetailDialog(null);
                  queryClient.invalidateQueries();
                  toast({ title: t("admin_claims_queue.notes_saved") });
                }
              }}
            >
              {t("admin_claims_queue.save_notes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
