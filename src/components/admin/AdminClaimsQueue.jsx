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
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/ui/StatusBadge";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import ClaimEvidenceReview from "@/components/admin/ClaimEvidenceReview";
import IssueReturnPassPanel from "@/components/admin/IssueReturnPassPanel";
import ClaimCaseMessageThread from "@/components/claims/ClaimCaseMessageThread";
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

export default function AdminClaimsQueue({ claims = [], foundItems = [] }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailDialog, setDetailDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const updateMutation = useMutation({
    mutationFn: async ({ claim, data, action }) => {
      let updatedClaim;

      if (data.status === "approved") {
        updatedClaim = await appClient.claims.approve(claim, data);
      } else if (data.status === "rejected") {
        updatedClaim = await appClient.claims.reject(claim, data);
      } else if (data.status === "need_more_info") {
        updatedClaim = await appClient.claims.requestMoreInfo(claim, data);
      } else if (data.status === "under_review") {
        updatedClaim = await appClient.claims.markUnderReview(claim, data);
      } else if (data.status === "completed") {
        updatedClaim = await appClient.claims.complete(claim, data);
      } else if (data.review_status === "approved") {
        updatedClaim = await appClient.claims.approveRating(claim, data);
      } else if (data.review_status === "rejected") {
        updatedClaim = await appClient.claims.rejectRating(claim, data);
      } else {
        updatedClaim = await appClient.claims.updateWorkflow(claim, data);
      }

      const nextClaim = { ...claim, ...(updatedClaim || {}), ...data };

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

      // Audit logging is best-effort: a logging failure must not surface as a
      // failed approve/reject when the claim action itself succeeded.
      try {
        await appClient.entities.AuditLog.create({
          action,
          entity_type: "claim",
          entity_id: updatedClaim?.id || updatedClaim?._id || claim.id,
          performed_by: "admin",
          details: data.status
            ? `Claim status: ${data.status}`
            : data.review_status
              ? `Review status: ${data.review_status}`
              : "Claim updated",
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-fatal):", auditError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClaims"] });
      queryClient.invalidateQueries({ queryKey: ["adminFoundItems"] });
      queryClient.invalidateQueries({ queryKey: ["userClaims"] });
      setDetailDialog(null);
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
    if (score >= 70) return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-400";
    if (score >= 40) return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-400";
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-400";
  };

  return (
    <div className="space-y-4">
      <div className="surface-card p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin_claims_queue.search_placeholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 bg-background border-border text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("admin_claims_queue.count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("admin_claims_queue.no_claims")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <Card
              key={claim.id}
              className={`${claim.risk_score >= 70 ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/10" : "border-border bg-card/40"}`}
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
                      <h3 className="text-base font-semibold text-foreground">{claim.found_item_title || t("admin_claims_queue.unknown_item")}</h3>
                      <StatusBadge status={claim.status} />
                      {claim.risk_score != null && (
                        <Badge className={getRiskColor(claim.risk_score)}>
                          {t("admin_claims_queue.risk_label", { score: claim.risk_score })}
                        </Badge>
                      )}
                      {claim.proof_photo_url && (
                        <Badge variant="outline" className="border-border text-muted-foreground">{t("admin_claims_queue.proof_photo")}</Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>{claim.claimant_name} ({claim.claimant_email})</span>
                      <span>{claim.created_date ? formatLocalizedDate(claim.created_date, "MMM d") : ""}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{claim.reason}</p>

                    {claim.claimant_rating ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-3.5 w-3.5 ${
                                index < claim.claimant_rating ? "fill-amber-450 text-amber-400" : "text-muted-foreground"
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
                          <Badge key={index} variant="outline" className="border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
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
                      className="border-border hover:bg-muted text-muted-foreground gap-1"
                      onClick={() => {
                        setDetailDialog(claim);
                        setAdminNotes(claim.admin_notes || "");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("admin_dashboard.review", "Review")}
                    </Button>
                    {["submitted", "under_review", "need_more_info", "pending_review"].includes(claim.status) && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1" disabled={updateMutation.isPending}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t("admin_claims_queue.approve")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve this claim?</AlertDialogTitle>
                              <AlertDialogDescription>The claim will be approved. You can then issue a claim code for pickup.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => updateMutation.mutate({ claim, data: { status: "approved" }, action: "Claim approved" })}
                              >
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 gap-1"
                              disabled={updateMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              {t("admin_claims_queue.reject")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disapprove this claim?</AlertDialogTitle>
                              <AlertDialogDescription>The student will be notified their claim was not approved.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => updateMutation.mutate({ claim, data: { status: "rejected" }, action: "Claim rejected" })}
                              >
                                Disapprove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 text-xl font-bold">
              <Shield className="w-5 h-5 text-primary" />
              {t("admin_claims_queue.claim_details", "Review Claim")}
            </DialogTitle>
          </DialogHeader>

          {detailDialog && (
            <div className="space-y-4 text-sm mt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground">{t("admin_claims_queue.claimant")}</p>
                  <p className="mt-1.5 font-semibold text-foreground">{detailDialog.claimant_name}</p>
                  <p className="mt-0.5 text-muted-foreground">{detailDialog.claimant_email}</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground">{t("admin_claims_queue.status")}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={detailDialog.status} />
                    <span className="text-muted-foreground text-xs">{t("claim_item.student_id")}: {detailDialog.student_id || t("common.not_available")}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">{t("admin_claims_queue.reason")}</p>
                <p className="mt-1.5 leading-relaxed text-foreground">{detailDialog.reason}</p>
              </div>

              {detailDialog.received_confirmed_at && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                  {t("admin_claims_queue.received_on", {
                    date: formatLocalizedDate(detailDialog.received_confirmed_at, "MMM d, yyyy"),
                  })}
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

              <ClaimEvidenceReview claimId={detailDialog.id} />

              <IssueReturnPassPanel claim={detailDialog} existingPassId={detailDialog.return_pass_id || ""} />

              <ClaimCaseMessageThread claim={detailDialog} viewerRole="admin" />

              {/* Status Update & Moderation action buttons */}
              <div className="pt-4 border-t border-border/80 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">{t("admin_claims_queue.actions", "Claim Status Actions")}</p>
                <div className="flex flex-wrap gap-2">
                  {detailDialog.status === "submitted" && (
                    <>
                      {/* Direct actions (no nested AlertDialog inside this Dialog, which
                          could swallow the click). The card-level confirm covers intent. */}
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "approved" }, action: "Claim approved" })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {t("admin_claims_queue.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "rejected" }, action: "Claim rejected" })}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        {t("admin_claims_queue.reject")}
                      </Button>
                    </>
                  )}
                  {detailDialog.status !== "under_review" && detailDialog.status !== "completed" && detailDialog.status !== "rejected" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border bg-background text-muted-foreground hover:bg-muted"
                        >
                          {t("admin_claims_queue.mark_under_review", "Mark Under Review")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mark claim as under review?</AlertDialogTitle>
                          <AlertDialogDescription>The claim status will be updated to under review while you investigate further.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateMutation.mutate({ claim: detailDialog, data: { status: "under_review" }, action: "Status → Under Review" })}
                          >
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {detailDialog.status !== "need_more_info" && detailDialog.status !== "completed" && detailDialog.status !== "rejected" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border bg-background text-muted-foreground hover:bg-muted"
                        >
                          {t("admin_claims_queue.request_more_info", "Request More Info")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Request more information?</AlertDialogTitle>
                          <AlertDialogDescription>The student will receive a message asking for additional details.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateMutation.mutate({
                              claim: detailDialog,
                              data: {
                                status: "need_more_info",
                                admin_notes: adminNotes.trim() || detailDialog.admin_notes || "",
                              },
                              action: "Status → Need More Info",
                            })}
                          >
                            Request Info
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {detailDialog.status !== "completed" && detailDialog.status === "approved" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white font-semibold animate-pulse"
                        >
                          {t("admin_claims_queue.mark_completed", "Complete Hand-off")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Complete hand-off?</AlertDialogTitle>
                          <AlertDialogDescription>This will mark the item as handed off to the student and close the claim.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={() => updateMutation.mutate({
                              claim: detailDialog,
                              data: {
                                status: "completed",
                                received_confirmed_at: new Date().toISOString(),
                              },
                              action: "Status → Completed",
                            })}
                          >
                            Complete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-muted-foreground">{t("admin_claims_queue.admin_notes")}</label>
                <Textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  rows={2}
                  className="bg-background border-border text-foreground placeholder-muted-foreground focus-visible:ring-ring"
                />
              </div>

              {detailDialog.claimant_rating ? (
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{t("admin_claims_queue.claimant_rating")}</p>
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < detailDialog.claimant_rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  {detailDialog.claimant_review && (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{detailDialog.claimant_review}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {t("admin_claims_queue.approve_rating")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve this rating?</AlertDialogTitle>
                        <AlertDialogDescription>The student's review will be published publicly on the item listing.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() =>
                            updateMutation.mutate({
                              claim: detailDialog,
                              data: {
                                review_status: "approved",
                                review_reviewed_at: new Date().toISOString(),
                              },
                              action: "Review approved",
                            })
                          }
                        >
                          Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border hover:bg-muted text-muted-foreground"
                      >
                        {t("admin_claims_queue.reject_rating")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject this rating?</AlertDialogTitle>
                        <AlertDialogDescription>The student's review will not be published. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() =>
                            updateMutation.mutate({
                              claim: detailDialog,
                              data: {
                                review_status: "rejected",
                                review_reviewed_at: new Date().toISOString(),
                              },
                              action: "Review rejected",
                            })
                          }
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              className="border-border hover:bg-muted text-muted-foreground"
              onClick={() => setDetailDialog(null)}
            >
              {t("common.close")}
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (detailDialog) {
                  await appClient.claims.updateWorkflow(detailDialog, { admin_notes: adminNotes });
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
