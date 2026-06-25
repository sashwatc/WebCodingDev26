const RETURN_PASS_LINK_PATTERN = /\/return-pass\/([^/?#]+)/i;

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

export function isReturnPassExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }
  const expires = new Date(expiresAt);
  return Number.isFinite(expires.getTime()) && expires.getTime() <= Date.now();
}

export function isReturnPassActive(pass = {}) {
  const status = normalizeReturnPassStatus(pass);
  return status === "active" && !isReturnPassExpired(pass.expires_at);
}

export function parseReturnPassIdFromLink(link = "") {
  const value = String(link || "").trim();
  if (!value) {
    return "";
  }

  const hashMatch = value.match(RETURN_PASS_LINK_PATTERN);
  if (hashMatch?.[1]) {
    return hashMatch[1];
  }

  try {
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
  }

  return "";
}

export function getPickupPassRoute(passId) {
  if (!passId) {
    return "/UserDashboard";
  }
  return `/PickupPass?id=${encodeURIComponent(passId)}`;
}

export function findReturnPassNotificationForClaim(notifications = [], claim = {}) {
  const claimId = claim?.id || "";
  const foundItemId = claim?.found_item_id || "";

  return notifications.find((notification) => {
    const type = String(notification.type || notification.event_type || "").toLowerCase();
    if (!["return_pass_ready", "pickup_reminder"].includes(type)) {
      return false;
    }

    const relatedItemId = notification.related_item_id || notification.relatedItemId || "";
    if (foundItemId && relatedItemId && relatedItemId === foundItemId) {
      return true;
    }

    const passId = parseReturnPassIdFromLink(notification.link || notification.action_link || "");
    return Boolean(passId && notification.claim_id === claimId);
  });
}

export function getReturnPassIdFromNotification(notification = {}) {
  return (
    notification.return_pass_id
    || notification.returnPassId
    || parseReturnPassIdFromLink(notification.link || notification.action_link || "")
  );
}

export function sanitizeNotificationMessage(message = "") {
  const text = String(message || "");
  if (!text) {
    return "";
  }

  return text
    .replace(/\b(one[- ]time code|pickup code|verification code)\s*[:#]?\s*\d{4,8}\b/gi, "$1 available in your secure Pickup Pass")
    .replace(/\bcode\s*[:#]?\s*\d{4,8}\b/gi, "code available in your secure Pickup Pass")
    .replace(/\b\d{6}\b/g, (match, offset, source) => {
      const before = source.slice(Math.max(0, offset - 12), offset).toLowerCase();
      if (before.includes("code") || before.includes("pass")) {
        return "[secure code]";
      }
      return match;
    })
    .trim();
}
