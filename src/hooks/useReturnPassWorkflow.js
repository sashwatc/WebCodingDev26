import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";

export function returnPassQueryKey(passId) {
  return ["pickupPass", passId];
}

export function invalidateReturnPassWorkflow(queryClient) {
  const keys = [
    ["pickupPass"],
    ["adminClaims"],
    ["userClaims"],
    ["adminFoundItems"],
    ["dashboardFoundItems"],
    ["adminRecoveryCenter"],
    ["adminRecoveryCases"],
    ["userRecoveryCases"],
    ["userNotifications"],
    ["navNotifications"],
    ["adminAuditLogs"],
  ];

  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

export function useReturnPass(passId, { enabled = true } = {}) {
  return useQuery({
    queryKey: returnPassQueryKey(passId),
    queryFn: () => appClient.returnPasses.get(passId),
    enabled: Boolean(passId) && enabled,
    retry: 1,
  });
}

export function useCreateReturnPass(claimId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => appClient.returnPasses.create(claimId, payload),
    onSuccess: () => {
      invalidateReturnPassWorkflow(queryClient);
    },
  });
}

export function useVerifyReturnPass() {
  return useMutation({
    mutationFn: (oneTimeCode) => appClient.returnPasses.verify(oneTimeCode),
  });
}

export function useRedeemReturnPass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, oneTimeCode }) => appClient.returnPasses.redeem(passId, oneTimeCode),
    onSuccess: () => {
      invalidateReturnPassWorkflow(queryClient);
    },
  });
}

export function useSendPickupReminder(passId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => appClient.returnPasses.reminder(passId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnPassQueryKey(passId) });
      queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["navNotifications"] });
    },
  });
}
