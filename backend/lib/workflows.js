const { stores } = require("./stores");

const CLAIM_STATUSES = new Set([
  "submitted",
  "under_review",
  "need_more_info",
  "approved",
  "rejected",
  "completed",
]);

const REFERENCED_ITEM_ARCHIVE_STATUSES = new Set(["claimed", "returned", "archived"]);

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getKeywordSet(values) {
  return new Set(
    values
      .flatMap((value) => tokenize(value))
      .filter((token) => token.length > 2)
      .filter((token) => !["the", "and", "with", "from", "that", "this", "lost", "found", "item"].includes(token))
  );
}

function getOverlapScore(sourceTokens, targetTokens) {
  let overlap = 0;
  sourceTokens.forEach((token) => {
    if (targetTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
}

function getDaysBetween(first, second) {
  if (!first || !second) {
    return null;
  }

  const a = new Date(first);
  const b = new Date(second);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return null;
  }

  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function getFoundItemId(item = {}) {
  return item.id || item._id || "";
}

function normalizeMatch(match = {}) {
  if (typeof match === "string") {
    return {
      found_item_id: match,
      confidence: 0,
      reasons: [],
      source: "legacy_match",
      created_date: new Date().toISOString(),
    };
  }

  const foundItemId = match.found_item_id || match.foundItemId || "";
  if (!foundItemId) {
    return null;
  }

  return {
    found_item_id: foundItemId,
    confidence: Math.max(0, Math.min(100, Math.round(Number(match.confidence) || 0))),
    reasons: Array.isArray(match.reasons) ? unique(match.reasons.map(String)) : [],
    source: match.source || "ai_suggestion",
    created_date: match.created_date || new Date().toISOString(),
  };
}

function mergeMatchSuggestions(currentMatches = [], nextMatches = []) {
  const byFoundItemId = new Map();

  for (const match of [...currentMatches, ...nextMatches]) {
    const normalized = normalizeMatch(match);
    if (!normalized) {
      continue;
    }

    const existing = byFoundItemId.get(normalized.found_item_id);
    if (!existing || normalized.confidence >= existing.confidence) {
      byFoundItemId.set(normalized.found_item_id, {
        ...existing,
        ...normalized,
        reasons: unique([...(existing?.reasons || []), ...(normalized.reasons || [])]),
      });
    }
  }

  return [...byFoundItemId.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

function scoreLostReportAgainstFoundItem(lostReport = {}, item = {}) {
  const itemId = getFoundItemId(item);
  if (!itemId || item.record_type === "lost" || item.itemType === "lost" || item.item_type === "lost") {
    return null;
  }

  if (["returned", "archived"].includes(item.status)) {
    return null;
  }

  let confidence = 0;
  const reasons = [];
  const lostTokens = getKeywordSet([
    lostReport.item_type,
    lostReport.description,
    lostReport.category,
    lostReport.brand,
    lostReport.color,
    lostReport.last_seen_location,
  ]);
  const itemTokens = getKeywordSet([
    item.title,
    item.description,
    item.aiDescription,
    item.ai_description,
    item.subcategory,
    item.category,
    item.brand,
    item.color,
    item.locationFound,
    item.location_found,
    ...(item.tags || []),
  ]);

  if (lostReport.category && item.category === lostReport.category) {
    confidence += 24;
    reasons.push("category match");
  }
  if (lostReport.color && String(item.color || "").toLowerCase() === String(lostReport.color).toLowerCase()) {
    confidence += 15;
    reasons.push("color match");
  }
  if (lostReport.brand && String(item.brand || "").toLowerCase() === String(lostReport.brand).toLowerCase()) {
    confidence += 18;
    reasons.push("brand match");
  }
  if (
    lostReport.last_seen_location &&
    String(item.locationFound || item.location_found || "").toLowerCase() === String(lostReport.last_seen_location).toLowerCase()
  ) {
    confidence += 16;
    reasons.push("location match");
  }

  const overlap = getOverlapScore(lostTokens, itemTokens);
  if (overlap > 0) {
    confidence += Math.min(28, overlap * 6);
    reasons.push("description overlap");
  }

  const dateGap = getDaysBetween(lostReport.date_lost, item.dateFound || item.date_found);
  if (dateGap != null && dateGap <= 2) {
    confidence += 12;
    reasons.push("date proximity");
  } else if (dateGap != null && dateGap <= 5) {
    confidence += 6;
    reasons.push("recent timing");
  }

  if (confidence <= 20) {
    return null;
  }

  return {
    found_item_id: itemId,
    confidence: Math.min(99, Math.round(confidence)),
    reasons: unique(reasons),
    source: "ai_suggestion",
  };
}

function generateMatchesForLostReport(lostReport = {}, foundItems = []) {
  return foundItems
    .map((item) => scoreLostReportAgainstFoundItem(lostReport, item))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

async function syncMatchesForLostReport(report) {
  if (!report) {
    return report;
  }

  const foundItems = await stores.FoundItem.list();
  const aiMatches = generateMatchesForLostReport(report, foundItems);
  const matchedItems = mergeMatchSuggestions(report.matched_items || [], aiMatches);
  const nextStatus = matchedItems.length > 0 && !["resolved", "closed"].includes(report.status)
    ? "matched"
    : report.status || "open";

  if (
    JSON.stringify(matchedItems) === JSON.stringify(report.matched_items || []) &&
    nextStatus === report.status
  ) {
    return report;
  }

  return stores.LostReport.save({
    ...report,
    matched_items: matchedItems,
    status: nextStatus,
  });
}

async function syncMatchesForFoundItem(foundItem) {
  if (!foundItem || REFERENCED_ITEM_ARCHIVE_STATUSES.has(foundItem.status)) {
    return [];
  }

  const foundItemId = getFoundItemId(foundItem);
  const lostReports = await stores.LostReport.list();
  const updatedReports = [];

  for (const report of lostReports) {
    if (["resolved", "closed"].includes(report.status)) {
      continue;
    }

    const explicitMatch = report.id && report.id === (foundItem.linkedLostReportId || foundItem.linked_lost_report_id)
      ? {
          found_item_id: foundItemId,
          confidence: 100,
          reasons: ["finder response"],
          source: "finder_response",
        }
      : null;
    const aiMatch = scoreLostReportAgainstFoundItem(report, foundItem);
    const nextMatches = mergeMatchSuggestions(report.matched_items || [], [explicitMatch, aiMatch].filter(Boolean));

    if (JSON.stringify(nextMatches) === JSON.stringify(report.matched_items || [])) {
      continue;
    }

    updatedReports.push(
      await stores.LostReport.save({
        ...report,
        matched_items: nextMatches,
        status: "matched",
      })
    );
  }

  return updatedReports;
}

async function hasFoundItemReferences(foundItemId) {
  const [claims, lostReports] = await Promise.all([
    stores.Claim.list(),
    stores.LostReport.list(),
  ]);

  return (
    claims.some((claim) => claim.found_item_id === foundItemId) ||
    lostReports.some((report) =>
      Array.isArray(report.matched_items) &&
      report.matched_items.some((match) => {
        const matchFoundItemId = typeof match === "string" ? match : (match?.found_item_id || match?.foundItemId);
        return matchFoundItemId === foundItemId;
      })
    )
  );
}

function validationError(message, statusCode = 400) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.statusCode = statusCode;
  return error;
}

async function validateClaimSave(nextClaim = {}, previousClaim = null) {
  if (!normalizeText(nextClaim.found_item_id)) {
    throw validationError("found_item_id is required");
  }
  if (!normalizeText(nextClaim.claimant_name)) {
    throw validationError("claimant_name is required");
  }
  if (!normalizeText(nextClaim.claimant_email)) {
    throw validationError("claimant_email is required");
  }
  if (!normalizeText(nextClaim.reason)) {
    throw validationError("reason is required");
  }
  if (nextClaim.status && !CLAIM_STATUSES.has(nextClaim.status)) {
    throw validationError(`Invalid claim status: ${nextClaim.status}`);
  }

  const foundItem = await stores.FoundItem.findById(nextClaim.found_item_id);
  if (!foundItem) {
    throw validationError("Claim must reference an existing Found Item", 404);
  }
  if (["returned", "archived"].includes(foundItem.status) && nextClaim.status !== "completed") {
    throw validationError("This Found Item is no longer available for new claim activity", 409);
  }

  if (nextClaim.status === "approved") {
    const claims = await stores.Claim.list();
    const approvedExisting = claims.find(
      (claim) =>
        claim.found_item_id === nextClaim.found_item_id &&
        claim.id !== nextClaim.id &&
        ["approved", "completed"].includes(claim.status)
    );

    if (approvedExisting) {
      throw validationError("Another claim is already approved for this Found Item", 409);
    }
  }

  if (!previousClaim && ["approved", "completed"].includes(nextClaim.status)) {
    throw validationError("New claims must start in the submitted workflow", 400);
  }
}

async function applyClaimStatusSideEffects(nextClaim = {}, previousClaim = null) {
  if (!nextClaim.status || nextClaim.status === previousClaim?.status) {
    return;
  }

  const foundItem = await stores.FoundItem.findById(nextClaim.found_item_id);
  if (!foundItem) {
    return;
  }

  if (nextClaim.status === "approved") {
    await stores.FoundItem.save({
      ...foundItem,
      status: "claimed",
    });
    return;
  }

  if (nextClaim.status === "completed") {
    const completedAt = nextClaim.received_confirmed_at || new Date().toISOString();
    await stores.FoundItem.save({
      ...foundItem,
      status: "returned",
      claimConfirmed: true,
      claim_confirmed: true,
      claimConfirmedAt: completedAt,
      claim_confirmed_at: completedAt,
    });
    return;
  }

  if (nextClaim.status === "rejected" && previousClaim?.status === "approved") {
    const claims = await stores.Claim.list();
    const stillApproved = claims.some(
      (claim) =>
        claim.id !== nextClaim.id &&
        claim.found_item_id === nextClaim.found_item_id &&
        ["approved", "completed"].includes(claim.status)
    );

    if (!stillApproved && foundItem.status === "claimed") {
      await stores.FoundItem.save({
        ...foundItem,
        status: "approved",
      });
    }
  }
}

module.exports = {
  applyClaimStatusSideEffects,
  generateMatchesForLostReport,
  hasFoundItemReferences,
  mergeMatchSuggestions,
  syncMatchesForFoundItem,
  syncMatchesForLostReport,
  validateClaimSave,
};
