/**
 * ClaimCaseMessageThread
 * --------------------------------------------------------------------------
 * A two-sided message thread attached to a single ownership claim. It shows
 * the back-and-forth between the claimant and staff/admin and provides a
 * composer for adding new messages.
 *
 * It is role-aware via the `viewerRole` prop ("claimant" | "admin"):
 *   - Admins can always reply (as a "staff_note") and, unless the claim is in a
 *     terminal state, can send a "request more info" message that also flags
 *     the claim for follow-up.
 *   - Claimants can reply only when the claim/thread state permits it
 *     (decided by canClaimantReplyToThread).
 *
 * Messages are fetched and mutated through React Query hooks
 * (useClaimCaseMessages / useSendClaimCaseMessage / useRequestClaimMoreInfo),
 * so the list refreshes automatically and supports manual refetch.
 */

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { formatLocalizedDate } from "@/lib/i18n-helpers";
import { canClaimantReplyToThread, isStaffMessage } from "@/lib/claim-messages";
import { useClaimCaseMessages, useRequestClaimMoreInfo, useSendClaimCaseMessage } from "@/hooks/useClaimWorkflow";

export default function ClaimCaseMessageThread({
  claim,             // The claim record this thread belongs to.
  viewerRole = "claimant", // "claimant" or "admin" — drives permissions & alignment.
  className = "",    // Optional extra classes for the outer section.
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  // Controlled value of the message composer.
  const [draft, setDraft] = useState("");
  // Ref to the scrollable message list, used to auto-scroll to the newest message.
  const threadRef = useRef(null);
  const claimId = claim?.id;
  const isAdmin = viewerRole === "admin";

  // Fetch the thread's messages (only enabled once we have a claim id).
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useClaimCaseMessages(claimId, { enabled: Boolean(claimId) });

  // Mutations for the two send paths: a plain message and "request more info".
  const sendMutation = useSendClaimCaseMessage(claimId);
  const requestMoreInfoMutation = useRequestClaimMoreInfo(claimId);

  // Permission flags:
  // - canReply: admins always; claimants only when the workflow allows.
  // - canRequestMoreInfo: admins only, and not when the claim has reached a
  //   terminal status (completed/rejected/approved).
  const canReply = isAdmin || canClaimantReplyToThread(claim, messages);
  const canRequestMoreInfo = isAdmin && !["completed", "rejected", "approved"].includes(String(claim?.status || "").toLowerCase());

  // Keep the view pinned to the bottom whenever new messages arrive or a send
  // succeeds, so the latest message is always visible.
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, sendMutation.isSuccess, requestMoreInfoMutation.isSuccess]);

  // Send a normal message. Tagged "staff_note" for admins, "claimant_reply"
  // for claimants. Clears the draft and toasts on success; toasts on failure.
  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sendMutation.isPending) {
      return;
    }

    try {
      await sendMutation.mutateAsync({
        body,
        message_type: isAdmin ? "staff_note" : "claimant_reply",
      });
      setDraft("");
      toast({
        title: t("claim_messages.sent_title"),
        description: t("claim_messages.sent_description"),
      });
    } catch (sendError) {
      toast({
        title: t("claim_messages.send_failed_title"),
        description: sendError.message || t("claim_messages.send_failed_description"),
        variant: "destructive",
      });
    }
  };

  // Admin-only: send the draft as a formal "request more info" message, which
  // also records admin_notes on the claim. Clears draft and toasts on result.
  const handleRequestMoreInfo = async () => {
    const body = draft.trim();
    if (!body || requestMoreInfoMutation.isPending) {
      return;
    }

    try {
      await requestMoreInfoMutation.mutateAsync({
        message: body,
        admin_notes: body,
      });
      setDraft("");
      toast({
        title: t("claim_messages.request_sent_title"),
        description: t("claim_messages.request_sent_description"),
      });
    } catch (requestError) {
      toast({
        title: t("claim_messages.request_failed_title"),
        description: requestError.message || t("claim_messages.send_failed_description"),
        variant: "destructive",
      });
    }
  };

  return (
    <section className={`rounded-xl border border-border bg-card ${className}`} aria-labelledby="claim-thread-heading">
      {/* Header: thread title + manual refresh button (spins while fetching) */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 id="claim-thread-heading" className="text-sm font-semibold text-foreground">
            {t("claim_messages.thread_title")}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={t("claim_messages.refresh")}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Scrollable message list (auto-scrolls to bottom via threadRef) */}
      <div
        ref={threadRef}
        className="max-h-72 space-y-3 overflow-y-auto px-4 py-4 motion-reduce:transition-none"
        tabIndex={0}
        aria-live="polite"
        aria-busy={isLoading || isFetching}
      >
        {/* Four render states: loading skeletons, error, empty, or messages */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <p className="font-medium">{t("claim_messages.unavailable_title")}</p>
            <p className="mt-1">{t("claim_messages.unavailable_description")}</p>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("claim_messages.empty")}</p>
        ) : (
          messages.map((message) => {
            // "mine" = authored by the current viewer's side. For admins that's
            // staff messages; for claimants it's non-staff messages. Used to
            // right-align and tint the viewer's own bubbles.
            const mine = isAdmin ? isStaffMessage(message) : !isStaffMessage(message);
            return (
              <article
                key={message.id}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                  mine
                    ? "ml-auto bg-primary/10 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {/* Sender name (falls back to a role label) + timestamp */}
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {message.sender_name || (isStaffMessage(message) ? t("claim_messages.staff_label") : t("claim_messages.claimant_label"))}
                  </span>
                  <span>{formatLocalizedDate(message.created_date, "MMM d, h:mm a")}</span>
                </div>
                {/* Message body, preserving author line breaks */}
                <p className="whitespace-pre-wrap leading-6">{message.body}</p>
              </article>
            );
          })
        )}
      </div>

      {/* Composer footer: hidden (replaced by a "locked" note) when the viewer
          has no available action; otherwise a textarea plus action buttons */}
      <div className="border-t border-border px-4 py-4">
        {!canReply && !canRequestMoreInfo ? (
          <p className="text-sm text-muted-foreground">{t("claim_messages.reply_locked")}</p>
        ) : (
          <div className="space-y-3">
            {/* Accessible label for the message input */}
            <label htmlFor={`claim-thread-input-${claimId}`} className="sr-only">
              {t("claim_messages.compose_label")}
            </label>
            <Textarea
              id={`claim-thread-input-${claimId}`}
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                isAdmin
                  ? t("claim_messages.admin_placeholder")
                  : t("claim_messages.claimant_placeholder")
              }
              disabled={sendMutation.isPending || requestMoreInfoMutation.isPending}
            />
            {/* Action buttons: reply (everyone allowed) and, for admins,
                request-more-info. Both disabled while empty or sending */}
            <div className="flex flex-wrap gap-2">
              {canReply && (
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMutation.isPending || requestMoreInfoMutation.isPending}
                >
                  {(sendMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("claim_messages.send_reply")}
                </Button>
              )}
              {canRequestMoreInfo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRequestMoreInfo}
                  disabled={!draft.trim() || sendMutation.isPending || requestMoreInfoMutation.isPending}
                >
                  {(requestMoreInfoMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("claim_messages.request_more_info")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
