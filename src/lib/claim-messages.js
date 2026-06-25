const OPEN_CLAIM_STATUSES = new Set(["need_more_info", "under_review", "submitted", "pending_review"]);

export function canClaimantReplyToThread(claim = {}, messages = []) {
  const status = String(claim.status || "").toLowerCase();
  if (!OPEN_CLAIM_STATUSES.has(status)) {
    return false;
  }

  if (status === "need_more_info") {
    return true;
  }

  const sorted = [...messages].sort((a, b) => String(a.created_date || "").localeCompare(String(b.created_date || "")));
  const lastStaffRequest = [...sorted].reverse().find((message) => message.sender_role === "admin" && message.message_type === "staff_request");
  if (!lastStaffRequest) {
    return false;
  }

  const staffIndex = sorted.findIndex((message) => message.id === lastStaffRequest.id);
  return !sorted.slice(staffIndex + 1).some((message) => message.sender_role === "claimant");
}

export function isStaffMessage(message = {}) {
  return String(message.sender_role || "").toLowerCase() === "admin";
}
