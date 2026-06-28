/**
 * useReturnPassWorkflow.js
 * -----------------------------------------------------------------------------
 * React Query hooks for the return-pass (item pickup) workflow: fetching a pass,
 * creating one for a claim, verifying/redeeming a one-time code, and sending
 * pickup reminders. Mutations broadly invalidate the related caches via the
 * shared `invalidateReturnPassWorkflow` helper so every affected view refreshes.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";

// Query key for a single pickup/return pass by id.
export function returnPassQueryKey(passId) {
  return ["pickupPass", passId];
}

// Invalidate every cache that a return-pass state change can affect: passes,
// claims, found-item lists, recovery center/cases, notifications, and audit logs.
// Called from the create/redeem mutations to keep all related views consistent.
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

// Fetch a single return pass by id. Disabled when no passId is provided.
export function useReturnPass(passId, { enabled = true } = {}) {
  return useQuery({
    queryKey: returnPassQueryKey(passId),
    queryFn: () => appClient.returnPasses.get(passId),
    enabled: Boolean(passId) && enabled,
    retry: 1,
  });
}

// Mutation (staff/admin) to create a return pass for a claim. On success,
// invalidates the whole return-pass workflow so all related views update.
export function useCreateReturnPass(claimId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => appClient.returnPasses.create(claimId, payload),
    onSuccess: () => {
      invalidateReturnPassWorkflow(queryClient);
    },
  });
}

// Mutation to verify a one-time code (e.g. at the pickup desk). Read-only check,
// so it does not invalidate any caches.
export function useVerifyReturnPass() {
  return useMutation({
    mutationFn: (oneTimeCode) => appClient.returnPasses.verify(oneTimeCode),
  });
}

// Mutation to redeem a pass with its one-time code (completes the return). On
// success, invalidates the whole return-pass workflow.
export function useRedeemReturnPass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passId, oneTimeCode }) => appClient.returnPasses.redeem(passId, oneTimeCode),
    onSuccess: () => {
      invalidateReturnPassWorkflow(queryClient);
    },
  });
}

// Mutation to send a pickup reminder for a pass. On success, refreshes just the
// pass and the notification lists (no broader state changes).
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
