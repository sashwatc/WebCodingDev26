/**
 * useClaimWorkflow.js
 * -----------------------------------------------------------------------------
 * React Query hooks for the claim review workflow: the case-message thread and
 * the evidence/proof-vault review. Each hook wraps an `appClient` call and,
 * for mutations, invalidates the affected caches so lists/threads refresh.
 * Stable query-key factories are exported so callers can target the same caches.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";

// Query key for a claim's case-message thread.
export function claimCaseMessagesQueryKey(claimId) {
  return ["claimCaseMessages", claimId];
}

// Query key for a claim's evidence-review data.
export function claimEvidenceReviewQueryKey(claimId) {
  return ["claimEvidenceReview", claimId];
}

// Fetch the message thread for a claim. Disabled without a claimId; polls every
// 30s so both sides see new messages without a manual refresh.
export function useClaimCaseMessages(claimId, { enabled = true } = {}) {
  return useQuery({
    queryKey: claimCaseMessagesQueryKey(claimId),
    queryFn: () => appClient.claimCaseMessages.list(claimId),
    enabled: Boolean(claimId) && enabled,
    refetchInterval: 30_000,
    retry: 1,
  });
}

// Mutation to post a message to a claim's thread. On success, refreshes the
// thread plus the user/admin claim lists (which show last-message previews).
export function useSendClaimCaseMessage(claimId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => appClient.claimCaseMessages.send(claimId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claimCaseMessagesQueryKey(claimId) });
      queryClient.invalidateQueries({ queryKey: ["userClaims"] });
      queryClient.invalidateQueries({ queryKey: ["adminClaims"] });
    },
  });
}

// Mutation (staff/admin) to request more info on a claim. On success, refreshes
// the thread, both claim lists, and the evidence-review (status may change).
export function useRequestClaimMoreInfo(claimId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => appClient.claims.requestMoreInfo(claimId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claimCaseMessagesQueryKey(claimId) });
      queryClient.invalidateQueries({ queryKey: ["adminClaims"] });
      queryClient.invalidateQueries({ queryKey: ["userClaims"] });
      queryClient.invalidateQueries({ queryKey: claimEvidenceReviewQueryKey(claimId) });
    },
  });
}

// Fetch the evidence/proof-vault review for a claim. `includeVaultClues` is part
// of the query key so toggling it fetches separately. Disabled without a claimId.
export function useClaimEvidenceReview(claimId, { enabled = true, includeVaultClues = false } = {}) {
  return useQuery({
    queryKey: [...claimEvidenceReviewQueryKey(claimId), includeVaultClues],
    queryFn: () => appClient.proofVault.evidenceReview(claimId, { includeVaultClues }),
    enabled: Boolean(claimId) && enabled,
    retry: 1,
  });
}

// Mutation to submit an evidence review decision. On success, refreshes the
// claim's evidence review and the admin claim list.
export function useSubmitClaimEvidenceReview(claimId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review) => appClient.proofVault.submitEvidenceReview(claimId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claimEvidenceReviewQueryKey(claimId) });
      queryClient.invalidateQueries({ queryKey: ["adminClaims"] });
    },
  });
}
