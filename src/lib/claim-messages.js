/**
 * claim-messages.js
 * -----------------------------------------------------------------------------
 * Small pure helpers for the claim messaging thread: deciding when a claimant
 * may post, and classifying a message as coming from the school (staff/admin)
 * side. No external dependencies.
 */

// Claim statuses considered "open" — i.e. the case is still active and accepts
// replies from the claimant.
const OPEN_CLAIM_STATUSES = new Set(["need_more_info", "under_review", "submitted", "pending_review"]);

// True if the claimant is allowed to reply, which is whenever the claim is in an
// open status (not only after staff request more info). Null-safe via default arg.
export function canClaimantReplyToThread(claim = {}) {
  // Two-way messaging: the claimant may reply at any time while the case is open,
  // not only after staff explicitly request more information.
  const status = String(claim.status || "").toLowerCase();
  return OPEN_CLAIM_STATUSES.has(status);
}

// True if a message was posted by the school side (staff or admin) rather than
// the claimant. Used to align/style messages in the thread.
export function isStaffMessage(message = {}) {
  // Staff reviewers post with sender_role "staff"; admins with "admin".
  // Both are the school side of the conversation (not the claimant).
  const role = String(message.sender_role || "").toLowerCase();
  return role === "admin" || role === "staff";
}
