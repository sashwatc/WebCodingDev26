import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";

export function claimCaseMessagesQueryKey(claimId) {
  return ["claimCaseMessages", claimId];
}

export function claimEvidenceReviewQueryKey(claimId) {
  return ["claimEvidenceReview", claimId];
}

export function useClaimCaseMessages(claimId, { enabled = true } = {}) {
  return useQuery({
    queryKey: claimCaseMessagesQueryKey(claimId),
    queryFn: () => appClient.claimCaseMessages.list(claimId),
    enabled: Boolean(claimId) && enabled,
    retry: 1,
  });
}

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

export function useClaimEvidenceReview(claimId, { enabled = true, includeVaultClues = false } = {}) {
  return useQuery({
    queryKey: [...claimEvidenceReviewQueryKey(claimId), includeVaultClues],
    queryFn: () => appClient.proofVault.evidenceReview(claimId, { includeVaultClues }),
    enabled: Boolean(claimId) && enabled,
    retry: 1,
  });
}

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
