/**
 * found-items.js
 * -----------------------------------------------------------------------------
 * Helpers for normalizing/classifying found-item status values. The backend
 * uses several status spellings; these map them onto four canonical buckets
 * (FOUND, CLAIM_PENDING, VERIFIED, ARCHIVED) and expose predicates over them.
 */

/**
 * Map any backend status string to one of the canonical buckets.
 * APPROVED/AVAILABLE -> FOUND, PENDING_CLAIM -> CLAIM_PENDING,
 * CLAIMED -> VERIFIED, RETURNED/COMPLETED/RESOLVED -> ARCHIVED.
 * Already-canonical values pass through; anything unknown falls back to the
 * lowercased original. Null-safe.
 */
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
      // Pass through known canonical buckets; otherwise lowercase the input.
      return ["FOUND", "CLAIM_PENDING", "VERIFIED", "ARCHIVED"].includes(upper) ? upper : trimmed.toLowerCase();
  }
}

// True if the item should be visible to the public (available or claim-pending).
export function isPublicFoundItemStatus(status) {
  const canonical = canonicalFoundItemStatus(status);
  return canonical === "FOUND" || canonical === "CLAIM_PENDING";
}

// True if the item is effectively closed out (archived or verified/claimed).
export function isArchivedFoundItemStatus(status) {
  const canonical = canonicalFoundItemStatus(status);
  return canonical === "ARCHIVED" || canonical === "VERIFIED";
}

// True only when the item is available to be claimed (canonical FOUND).
export function isClaimableFoundItemStatus(status) {
  return canonicalFoundItemStatus(status) === "FOUND";
}
