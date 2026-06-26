const OPEN_CLAIM_STATUSES = new Set(["need_more_info", "under_review", "submitted", "pending_review"]);

export function canClaimantReplyToThread(claim = {}) {
  // Two-way messaging: the claimant may reply at any time while the case is open,
  // not only after staff explicitly request more information.
  const status = String(claim.status || "").toLowerCase();
  return OPEN_CLAIM_STATUSES.has(status);
}

export function isStaffMessage(message = {}) {
  return String(message.sender_role || "").toLowerCase() === "admin";
}
