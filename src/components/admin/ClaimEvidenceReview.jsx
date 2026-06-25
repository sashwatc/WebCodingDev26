import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";
import { useClaimEvidenceReview, useSubmitClaimEvidenceReview } from "@/hooks/useClaimWorkflow";

export default function ClaimEvidenceReview({ claimId, className = "" }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [summaryDraft, setSummaryDraft] = useState("");

  const {
    data: evidence,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useClaimEvidenceReview(claimId, { enabled: Boolean(claimId), includeVaultClues: true });

  const submitReviewMutation = useSubmitClaimEvidenceReview(claimId);

  const handleSaveReview = async () => {
    if (submitReviewMutation.isPending) {
      return;
    }

    try {
      await submitReviewMutation.mutateAsync({
        verification_score: evidence?.verification_score,
        verification_flags: evidence?.verification_flags || [],
        verification_summary: summaryDraft.trim() || evidence?.verification_summary || "",
      });
      toast({
        title: t("claim_evidence.review_saved_title"),
        description: t("claim_evidence.review_saved_description"),
      });
    } catch (reviewError) {
      toast({
        title: t("claim_evidence.review_failed_title"),
        description: reviewError.message || t("claim_evidence.review_failed_description"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-4 text-sm text-amber-200 ${className}`}>
        <p className="font-semibold">{t("claim_evidence.unavailable_title")}</p>
        <p className="mt-1">{t("claim_evidence.unavailable_description")}</p>
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
          {t("common.retry", "Retry")}
        </Button>
      </div>
    );
  }

  if (!evidence) {
    return null;
  }

  const privateResponses = Object.entries(evidence.private_evidence_responses || {}).filter(([, value]) => value);

  return (
    <section className={`space-y-4 ${className}`} aria-labelledby="claim-evidence-heading">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden="true" />
        <h3 id="claim-evidence-heading" className="text-sm font-semibold text-slate-100">
          {t("claim_evidence.title")}
        </h3>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("claim_evidence.claimant_submission")}
        </p>
        {evidence.identifying_details && (
          <p className="mt-2 leading-6">{evidence.identifying_details}</p>
        )}
        {privateResponses.length > 0 && (
          <dl className="mt-3 space-y-2">
            {privateResponses.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-semibold text-slate-500">{key}</dt>
                <dd className="leading-6">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {evidence.evidence_checklist?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {evidence.evidence_checklist.map((entry) => (
              <Badge key={entry} variant="outline" className="border-slate-700 text-slate-300">
                {entry}
              </Badge>
            ))}
          </div>
        )}
        {evidence.proof_photo_url && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-500">{t("admin_claims_queue.proof_photo")}</p>
            <img
              src={evidence.proof_photo_url}
              alt={t("admin_claims_queue.proof_photo")}
              className="mt-2 max-h-56 w-full rounded-lg border border-slate-800 object-contain bg-black"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 px-4 py-3 text-sm text-amber-100">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
          {t("claim_evidence.sealed_clues_title")}
        </p>
        <p className="mt-1 text-xs text-amber-200/80">{t("claim_evidence.sealed_clues_notice")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {(evidence.private_verification_clues || []).length > 0 ? (
            evidence.private_verification_clues.map((clue) => <li key={clue}>{clue}</li>)
          ) : (
            <li>{t("claim_evidence.no_sealed_clues")}</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">
            {t("claim_evidence.verification_score", { score: evidence.verification_score ?? "—" })}
          </p>
          {(evidence.verification_flags || []).map((flag) => (
            <Badge key={flag} variant="outline" className="border-slate-700 text-slate-300">
              {flag}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {evidence.verification_summary || t("claim_evidence.no_summary")}
        </p>
        <div className="mt-3 space-y-2">
          <label htmlFor={`evidence-summary-${claimId}`} className="text-xs font-semibold text-slate-500">
            {t("claim_evidence.staff_summary_label")}
          </label>
          <Textarea
            id={`evidence-summary-${claimId}`}
            rows={3}
            value={summaryDraft || evidence.verification_summary || ""}
            onChange={(event) => setSummaryDraft(event.target.value)}
            className="bg-slate-900 border-slate-800 text-slate-100"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSaveReview}
            disabled={submitReviewMutation.isPending}
          >
            {submitReviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("claim_evidence.save_review")}
          </Button>
        </div>
      </div>
    </section>
  );
}
