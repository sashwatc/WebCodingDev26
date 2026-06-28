/**
 * FindBack AI - Claim Evidence Review
 *
 * Admin-only panel shown inside the claim review dialog. Fetches and displays
 * the evidence a claimant submitted to prove ownership: their identifying
 * description, answers to private verification questions, an evidence
 * checklist, an optional proof photo, and the sealed "verification clues" the
 * finder recorded (the secret details only the true owner should know).
 * Handles loading, error (with retry), and empty states.
 *
 * Props:
 *  - claimId:   id of the claim whose evidence to load (query is disabled when absent)
 *  - className: optional extra classes for the root element
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";
import { useClaimEvidenceReview } from "@/hooks/useClaimWorkflow";

export default function ClaimEvidenceReview({ claimId, className = "" }) {
  const { t } = useTranslation();

  // Query the claim's evidence bundle. `enabled` gates the fetch on a claimId;
  // includeVaultClues requests the sealed finder-recorded verification clues.
  const {
    data: evidence,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useClaimEvidenceReview(claimId, { enabled: Boolean(claimId), includeVaultClues: true });

  // Loading state: skeleton placeholders while the evidence is fetched.
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Error state: warning panel with a Retry button that refetches the evidence.
  if (error) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 ${className}`}>
        <p className="font-semibold">{t("claim_evidence.unavailable_title")}</p>
        <p className="mt-1">{t("claim_evidence.unavailable_description")}</p>
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
          {t("common.retry", "Retry")}
        </Button>
      </div>
    );
  }

  // Empty state: no evidence record to show, render nothing.
  if (!evidence) {
    return null;
  }

  // Flatten the private Q&A map into entries, dropping any blank answers.
  const privateResponses = Object.entries(evidence.private_evidence_responses || {}).filter(([, value]) => value);

  return (
    <section className={`space-y-4 ${className}`} aria-labelledby="claim-evidence-heading">
      {/* Section heading */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden="true" />
        <h3 id="claim-evidence-heading" className="text-sm font-semibold text-foreground">
          {t("claim_evidence.title")}
        </h3>
      </div>

      {/* Claimant's submission: identifying details, private Q&A, checklist, proof photo */}
      <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("claim_evidence.claimant_submission")}
        </p>
        {/* Free-text identifying description provided by the claimant */}
        {evidence.identifying_details && (
          <p className="mt-2 leading-6">{evidence.identifying_details}</p>
        )}
        {/* Answers to the private verification questions (key = question) */}
        {privateResponses.length > 0 && (
          <dl className="mt-3 space-y-2">
            {privateResponses.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-semibold text-muted-foreground">{key}</dt>
                <dd className="leading-6">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {/* Checklist of evidence types the claimant attested to (badges) */}
        {evidence.evidence_checklist?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {evidence.evidence_checklist.map((entry) => (
              <Badge key={entry} variant="outline" className="border-border text-muted-foreground">
                {entry}
              </Badge>
            ))}
          </div>
        )}
        {/* Optional proof photo uploaded by the claimant */}
        {evidence.proof_photo_url && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">{t("admin_claims_queue.proof_photo")}</p>
            <img
              src={evidence.proof_photo_url}
              alt={t("admin_claims_queue.proof_photo")}
              className="mt-2 max-h-56 w-full rounded-lg border border-border object-contain bg-black"
            />
          </div>
        )}
      </div>

      {/* Sealed verification clues: the finder-recorded secret details only the
          true owner should know — used by the admin to validate the claim */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/15 dark:text-amber-100">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
          {t("claim_evidence.sealed_clues_title")}
        </p>
        <p className="mt-1 text-xs text-amber-200/80">{t("claim_evidence.sealed_clues_notice")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {/* List the clues, or a placeholder when the finder recorded none */}
          {(evidence.private_verification_clues || []).length > 0 ? (
            evidence.private_verification_clues.map((clue) => <li key={clue}>{clue}</li>)
          ) : (
            <li>{t("claim_evidence.no_sealed_clues")}</li>
          )}
        </ul>
      </div>
    </section>
  );
}
