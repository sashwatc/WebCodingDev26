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
  claim,
  viewerRole = "claimant",
  className = "",
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const threadRef = useRef(null);
  const claimId = claim?.id;
  const isAdmin = viewerRole === "admin";

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useClaimCaseMessages(claimId, { enabled: Boolean(claimId) });

  const sendMutation = useSendClaimCaseMessage(claimId);
  const requestMoreInfoMutation = useRequestClaimMoreInfo(claimId);

  const canReply = isAdmin || canClaimantReplyToThread(claim, messages);
  const canRequestMoreInfo = isAdmin && !["completed", "rejected", "approved"].includes(String(claim?.status || "").toLowerCase());

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, sendMutation.isSuccess, requestMoreInfoMutation.isSuccess]);

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
    <section className={`rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 ${className}`} aria-labelledby="claim-thread-heading">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 id="claim-thread-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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

      <div
        ref={threadRef}
        className="max-h-72 space-y-3 overflow-y-auto px-4 py-4 motion-reduce:transition-none"
        tabIndex={0}
        aria-live="polite"
        aria-busy={isLoading || isFetching}
      >
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
          <p className="text-sm text-slate-500">{t("claim_messages.empty")}</p>
        ) : (
          messages.map((message) => {
            const mine = isAdmin ? isStaffMessage(message) : !isStaffMessage(message);
            return (
              <article
                key={message.id}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                  mine
                    ? "ml-auto bg-primary/10 text-slate-900 dark:text-slate-100"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {message.sender_name || (isStaffMessage(message) ? t("claim_messages.staff_label") : t("claim_messages.claimant_label"))}
                  </span>
                  <span>{formatLocalizedDate(message.created_date, "MMM d, h:mm a")}</span>
                </div>
                <p className="whitespace-pre-wrap leading-6">{message.body}</p>
              </article>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
        {!canReply && !canRequestMoreInfo ? (
          <p className="text-sm text-slate-500">{t("claim_messages.reply_locked")}</p>
        ) : (
          <div className="space-y-3">
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
