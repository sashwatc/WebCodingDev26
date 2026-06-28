/**
 * return-pass.js
 * -----------------------------------------------------------------------------
 * Pure helpers for the "return pass" (item pickup) feature: deriving a pass's
 * effective status, expiry checks, building/parsing pass links and routes,
 * correlating notifications to a claim/pass, and redacting one-time codes from
 * notification text. No external dependencies.
 */

// Matches a return-pass id segment in a "/return-pass/<id>" URL path.
const RETURN_PASS_LINK_PATTERN = /\/return-pass\/([^/?#]+)/i;

/**
 * Derive the effective status of a pass, accounting for explicit status,
 * redemption, and expiry. Returns "redeemed" if redeemed, the raw status for
 * "expired"/"cancelled", "expired" when past `expires_at`, else the status or
 * "unknown". Null-safe.
 */
export function normalizeReturnPassStatus(pass = {}) {
  const status = String(pass.status || "").toLowerCase();
  if (status === "redeemed" || pass.redeemed_at) {
    return "redeemed";
  }
  if (status === "expired" || status === "cancelled") {
    return status;
  }
  if (pass.expires_at && isReturnPassExpired(pass.expires_at)) {
    return "expired";
  }
  return status || "unknown";
}

// True if `expiresAt` is a valid timestamp at or before now. Falsy input -> false.
export function isReturnPassExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }
  const expires = new Date(expiresAt);
  return Number.isFinite(expires.getTime()) && expires.getTime() <= Date.now();
}

// True only when a pass is currently usable: status "active" and not expired.
export function isReturnPassActive(pass = {}) {
  const status = normalizeReturnPassStatus(pass);
  return status === "active" && !isReturnPassExpired(pass.expires_at);
}

/**
 * Extract a return-pass id from a link string. Tries, in order: a
 * "/return-pass/<id>" path match, then a parsed URL's `?id=` query param, then a
 * path match on the parsed URL. Returns "" when nothing is found / parsing fails.
 */
export function parseReturnPassIdFromLink(link = "") {
  const value = String(link || "").trim();
  if (!value) {
    return "";
  }

  // 1) Direct "/return-pass/<id>" substring match.
  const hashMatch = value.match(RETURN_PASS_LINK_PATTERN);
  if (hashMatch?.[1]) {
    return hashMatch[1];
  }

  try {
    // 2) Parse as a URL (relative links resolved against a dummy base) and check
    //    the `id` query param, then 3) a path match.
    const url = new URL(value, "https://findback.local");
    const queryId = url.searchParams.get("id");
    if (queryId) {
      return queryId;
    }
    const pathMatch = url.pathname.match(RETURN_PASS_LINK_PATTERN);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }
  } catch {
    // Not a parseable URL; fall through to "".
  }

  return "";
}

// Build the in-app route to a pickup pass; falls back to the dashboard when no id.
export function getPickupPassRoute(passId) {
  if (!passId) {
    return "/UserDashboard";
  }
  return `/PickupPass?id=${encodeURIComponent(passId)}`;
}

/**
 * Find the notification that corresponds to a claim's return pass. Considers
 * only "return_pass_ready"/"pickup_reminder" notifications, matching either by
 * related found-item id or by a pass link plus matching claim id. Returns the
 * matching notification or undefined.
 */
export function findReturnPassNotificationForClaim(notifications = [], claim = {}) {
  const claimId = claim?.id || "";
  const foundItemId = claim?.found_item_id || "";

  return notifications.find((notification) => {
    // Only pass-related notification types qualify.
    const type = String(notification.type || notification.event_type || "").toLowerCase();
    if (!["return_pass_ready", "pickup_reminder"].includes(type)) {
      return false;
    }

    // Match by related found-item id when available.
    const relatedItemId = notification.related_item_id || notification.relatedItemId || "";
    if (foundItemId && relatedItemId && relatedItemId === foundItemId) {
      return true;
    }

    // Otherwise match by a pass link combined with the same claim id.
    const passId = parseReturnPassIdFromLink(notification.link || notification.action_link || "");
    return Boolean(passId && notification.claim_id === claimId);
  });
}

// Get a return-pass id from a notification: explicit field first, else parse it
// out of the notification's link.
export function getReturnPassIdFromNotification(notification = {}) {
  return (
    notification.return_pass_id
    || notification.returnPassId
    || parseReturnPassIdFromLink(notification.link || notification.action_link || "")
  );
}

/**
 * Redact one-time pickup/verification codes from notification copy so secret
 * codes are never shown inline (they live only in the secure Pickup Pass).
 * Replaces "code: 123456"-style phrases and bare 6-digit numbers near the words
 * "code"/"pass". Returns the trimmed, sanitized message ("" for empty input).
 */
export function sanitizeNotificationMessage(message = "") {
  const text = String(message || "");
  if (!text) {
    return "";
  }

  return text
    // Replace labeled codes (one-time/pickup/verification code: NNNN) with a safe phrase.
    .replace(/\b(one[- ]time code|pickup code|verification code)\s*[:#]?\s*\d{4,8}\b/gi, "$1 available in your secure Pickup Pass")
    // Replace generic "code: NNNN" with a safe phrase.
    .replace(/\bcode\s*[:#]?\s*\d{4,8}\b/gi, "code available in your secure Pickup Pass")
    // Replace bare 6-digit numbers, but only when preceded by "code"/"pass" nearby.
    .replace(/\b\d{6}\b/g, (match, offset, source) => {
      const before = source.slice(Math.max(0, offset - 12), offset).toLowerCase();
      if (before.includes("code") || before.includes("pass")) {
        return "[secure code]";
      }
      return match;
    })
    .trim();
}
