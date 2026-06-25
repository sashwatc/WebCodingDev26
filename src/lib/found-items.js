export function canonicalFoundItemStatus(status) {
  const trimmed = String(status || "").trim();
  const upper = trimmed.toUpperCase();
  switch (upper) {
    case "APPROVED":
    case "AVAILABLE":
      return "FOUND";
    case "PENDING_CLAIM":
      return "CLAIM_PENDING";
    case "CLAIMED":
      return "VERIFIED";
    case "RETURNED":
    case "COMPLETED":
    case "RESOLVED":
      return "ARCHIVED";
    default:
      return ["FOUND", "CLAIM_PENDING", "VERIFIED", "ARCHIVED"].includes(upper) ? upper : trimmed.toLowerCase();
  }
}

export function isPublicFoundItemStatus(status) {
  const canonical = canonicalFoundItemStatus(status);
  return canonical === "FOUND" || canonical === "CLAIM_PENDING";
}

export function isArchivedFoundItemStatus(status) {
  const canonical = canonicalFoundItemStatus(status);
  return canonical === "ARCHIVED" || canonical === "VERIFIED";
}

export function isClaimableFoundItemStatus(status) {
  return canonicalFoundItemStatus(status) === "FOUND";
}
