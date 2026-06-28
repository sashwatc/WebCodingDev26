/**
 * workflows.js
 *
 * Domain/business-logic layer sitting on top of the data stores (./stores).
 * It implements the lost-and-found matching engine and the claim lifecycle
 * rules, coordinating across the FoundItem, LostReport, and Claim stores.
 *
 * Responsibilities:
 *   - Heuristic text/attribute matching between lost reports and found items
 *     (tokenization, keyword overlap, scoring -> confidence percentages).
 *   - Keeping each lost report's `matched_items` and status in sync as items
 *     and reports change (syncMatchesForLostReport / syncMatchesForFoundItem).
 *   - Referential-integrity checks before deleting a found item.
 *   - Validating claim saves and applying status-driven side effects to the
 *     referenced found item (claimed/returned/etc.).
 *
 * This module is backend-agnostic: it goes through the store interface and
 * never touches a database directly.
 */

const { stores } = require("./stores");

// Valid claim workflow states; used to reject unknown status values.
const CLAIM_STATUSES = new Set([
  "submitted",
  "under_review",
  "need_more_info",
  "approved",
  "rejected",
  "completed",
]);

// Found-item statuses that mean it is no longer actively matchable (it has been
// claimed, returned, or archived).
const REFERENCED_ITEM_ARCHIVE_STATUSES = new Set(["claimed", "returned", "archived"]);

// Coerce a value to a string and collapse all runs of whitespace into single
// spaces, trimming the ends.
function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

// Split text into lowercase alphanumeric word tokens (punctuation removed,
// empties dropped). Basis for keyword matching.
function tokenize(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// De-duplicate an array, dropping falsy entries (first-seen order preserved).
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

// Build a keyword Set from several text values: tokenize each, keep tokens
// longer than 2 chars, and drop common stop words (the, and, with, ... plus
// domain-noise words like lost/found/item) so matching focuses on meaningful
// terms.
function getKeywordSet(values) {
  return new Set(
    values
      .flatMap((value) => tokenize(value))
      .filter((token) => token.length > 2)
      .filter((token) => !["the", "and", "with", "from", "that", "this", "lost", "found", "item"].includes(token))
  );
}

// Count how many of the source tokens also appear in the target token set
// (i.e. the size of the keyword intersection).
function getOverlapScore(sourceTokens, targetTokens) {
  let overlap = 0;
  sourceTokens.forEach((token) => {
    if (targetTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
}

// Absolute number of days between two date inputs, or null if either is
// missing or unparseable.
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

// Resolve a found item's identifier, tolerating either the app `id` or Mongo
// `_id`; returns "" when neither is present.
function getFoundItemId(item = {}) {
  return item.id || item._id || "";
}

// Normalize a match suggestion into a canonical object shape. Accepts either a
// bare found-item-id string (legacy format) or a full match object. Returns
// null when no found_item_id can be determined. Clamps confidence to 0-100 and
// de-dupes reasons.
function normalizeMatch(match = {}) {
  // Legacy form: a plain string is just the found item id.
  if (typeof match === "string") {
    return {
      found_item_id: match,
      confidence: 0,
      reasons: [],
      source: "legacy_match",
      created_date: new Date().toISOString(),
    };
  }

  // Object form: accept either snake_case or camelCase id field.
  const foundItemId = match.found_item_id || match.foundItemId || "";
  if (!foundItemId) {
    return null;
  }

  return {
    found_item_id: foundItemId,
    // Clamp/round confidence into the integer range 0..100.
    confidence: Math.max(0, Math.min(100, Math.round(Number(match.confidence) || 0))),
    reasons: Array.isArray(match.reasons) ? unique(match.reasons.map(String)) : [],
    source: match.source || "ai_suggestion",
    created_date: match.created_date || new Date().toISOString(),
  };
}

/**
 * Merge two lists of match suggestions, deduplicating by found_item_id.
 *
 * For each found item id the highest-confidence suggestion wins, but reasons
 * from all merged suggestions are unioned. Result is sorted by confidence
 * descending and capped at the top 8. Pure (no side effects).
 *
 * @param {Array} currentMatches Existing matches (any accepted match shape).
 * @param {Array} nextMatches    New matches to merge in.
 * @returns {Array} Normalized, de-duplicated, sorted, capped match objects.
 */
function mergeMatchSuggestions(currentMatches = [], nextMatches = []) {
  const byFoundItemId = new Map();

  // Walk all matches; keep the strongest per found item, unioning reasons.
  for (const match of [...currentMatches, ...nextMatches]) {
    const normalized = normalizeMatch(match);
    if (!normalized) {
      continue;
    }

    const existing = byFoundItemId.get(normalized.found_item_id);
    // Replace only when this suggestion's confidence is >= the stored one.
    if (!existing || normalized.confidence >= existing.confidence) {
      byFoundItemId.set(normalized.found_item_id, {
        ...existing,
        ...normalized,
        reasons: unique([...(existing?.reasons || []), ...(normalized.reasons || [])]),
      });
    }
  }

  // Highest-confidence matches first, limited to 8.
  return [...byFoundItemId.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

/**
 * Score how well a single found item matches a lost report.
 *
 * Returns null when the item is ineligible (no id, it is itself a lost record,
 * or it is already returned/archived) or when the computed confidence is too
 * low (<= 20). Otherwise returns a match object with a confidence (capped at
 * 99) and human-readable reasons. Pure scoring; no side effects.
 *
 * Scoring combines exact attribute matches (category/color/brand/location),
 * keyword overlap between descriptions, and date proximity.
 */
function scoreLostReportAgainstFoundItem(lostReport = {}, item = {}) {
  const itemId = getFoundItemId(item);
  // Skip items with no id, or that are actually lost records (not found items).
  if (!itemId || item.record_type === "lost" || item.itemType === "lost" || item.item_type === "lost") {
    return null;
  }

  // Skip items that are no longer available to be matched.
  if (["returned", "archived"].includes(item.status)) {
    return null;
  }

  let confidence = 0;
  const reasons = [];
  // Keyword set drawn from the lost report's descriptive fields.
  const lostTokens = getKeywordSet([
    lostReport.item_type,
    lostReport.description,
    lostReport.category,
    lostReport.brand,
    lostReport.color,
    lostReport.last_seen_location,
  ]);
  // Keyword set drawn from the found item's descriptive fields + tags.
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

  // Exact-attribute matches each contribute a fixed weight + a reason label.
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

  // Description keyword overlap: 6 points per shared keyword, capped at 28.
  const overlap = getOverlapScore(lostTokens, itemTokens);
  if (overlap > 0) {
    confidence += Math.min(28, overlap * 6);
    reasons.push("description overlap");
  }

  // Date proximity bonus: within 2 days = strong signal, within 5 = weaker.
  const dateGap = getDaysBetween(lostReport.date_lost, item.dateFound || item.date_found);
  if (dateGap != null && dateGap <= 2) {
    confidence += 12;
    reasons.push("date proximity");
  } else if (dateGap != null && dateGap <= 5) {
    confidence += 6;
    reasons.push("recent timing");
  }

  // Discard weak matches below the acceptance threshold.
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

/**
 * Score a lost report against a list of found items and return the strongest
 * matches (top 5, confidence descending). Items that don't qualify are
 * filtered out. Pure (no side effects).
 *
 * @param {Object} lostReport The lost report to match.
 * @param {Array}  foundItems Candidate found items.
 * @returns {Array} Up to 5 match suggestion objects.
 */
function generateMatchesForLostReport(lostReport = {}, foundItems = []) {
  return foundItems
    .map((item) => scoreLostReportAgainstFoundItem(lostReport, item))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

/**
 * Recompute and persist a lost report's matches against all current found
 * items. Merges freshly generated AI matches with any existing matches and
 * derives the report status ("matched" when matches exist and the report isn't
 * already resolved/closed). Persists only when something actually changed.
 *
 * @param {Object|null} report The lost report (falsy is returned unchanged).
 * @returns {Promise<Object>} The (possibly updated) report. Side effect: may
 *          save the report via the LostReport store.
 */
async function syncMatchesForLostReport(report) {
  if (!report) {
    return report;
  }

  const foundItems = await stores.FoundItem.list();
  const aiMatches = generateMatchesForLostReport(report, foundItems);
  const matchedItems = mergeMatchSuggestions(report.matched_items || [], aiMatches);
  // Promote to "matched" when there are matches, unless the report is already
  // resolved/closed; otherwise keep the current status (default "open").
  const nextStatus = matchedItems.length > 0 && !["resolved", "closed"].includes(report.status)
    ? "matched"
    : report.status || "open";

  // No-op short-circuit: skip the write if matches and status are unchanged.
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

/**
 * The inverse direction: when a found item changes, re-evaluate every open
 * lost report against it and persist any that gained/changed matches.
 *
 * A report explicitly linked to this found item (via linkedLostReportId) gets
 * a forced 100% "finder_response" match; otherwise the heuristic AI score is
 * used. Reports that are resolved/closed are skipped, as is an archived item.
 *
 * @param {Object|null} foundItem The found item (falsy/archived -> []).
 * @returns {Promise<Array>} The list of lost reports that were updated. Side
 *          effect: saves each changed report via the LostReport store.
 */
async function syncMatchesForFoundItem(foundItem) {
  // Nothing to do for missing items or items no longer matchable.
  if (!foundItem || REFERENCED_ITEM_ARCHIVE_STATUSES.has(foundItem.status)) {
    return [];
  }

  const foundItemId = getFoundItemId(foundItem);
  const lostReports = await stores.LostReport.list();
  const updatedReports = [];

  for (const report of lostReports) {
    // Don't touch reports that are already concluded.
    if (["resolved", "closed"].includes(report.status)) {
      continue;
    }

    // A direct finder->report link is a guaranteed (100%) match.
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

    // Skip reports whose match list is unchanged.
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

/**
 * Check whether a found item is referenced by any claim or lost-report match
 * (used as a guard before deletion). Handles both string and object match
 * shapes in matched_items.
 *
 * @param {string} foundItemId The found item id to check for references.
 * @returns {Promise<boolean>} True if any claim or lost report references it.
 */
async function hasFoundItemReferences(foundItemId) {
  const [claims, lostReports] = await Promise.all([
    stores.Claim.list(),
    stores.LostReport.list(),
  ]);

  return (
    // Any claim pointing at this found item counts as a reference...
    claims.some((claim) => claim.found_item_id === foundItemId) ||
    // ...as does any lost report listing it among matched_items.
    lostReports.some((report) =>
      Array.isArray(report.matched_items) &&
      report.matched_items.some((match) => {
        // Match entries may be plain id strings or objects with id fields.
        const matchFoundItemId = typeof match === "string" ? match : (match?.found_item_id || match?.foundItemId);
        return matchFoundItemId === foundItemId;
      })
    )
  );
}

// Construct a ValidationError-tagged Error carrying an HTTP statusCode
// (default 400) so route handlers can translate it into a response.
function validationError(message, statusCode = 400) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.statusCode = statusCode;
  return error;
}

/**
 * Validate a claim about to be saved, enforcing required fields and workflow
 * invariants. Throws a ValidationError (with appropriate statusCode) on any
 * violation; returns nothing on success.
 *
 * Rules enforced:
 *  - found_item_id, claimant_name, claimant_email, reason are required.
 *  - status, if present, must be a known claim status.
 *  - the referenced found item must exist (404 otherwise).
 *  - returned/archived items reject new claim activity unless completing.
 *  - only one approved/completed claim may exist per found item (409).
 *  - brand-new claims may not start already approved/completed.
 *
 * @param {Object}      nextClaim     The claim being saved.
 * @param {Object|null} previousClaim The prior claim state (null when new).
 */
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

  // The claim must point at a real found item.
  const foundItem = await stores.FoundItem.findById(nextClaim.found_item_id);
  if (!foundItem) {
    throw validationError("Claim must reference an existing Found Item", 404);
  }
  // A returned/archived item only accepts the terminal "completed" transition.
  if (["returned", "archived"].includes(foundItem.status) && nextClaim.status !== "completed") {
    throw validationError("This Found Item is no longer available for new claim activity", 409);
  }

  // Enforce single-winner: at most one approved/completed claim per item.
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

  // A first-time claim must enter through the normal submitted workflow.
  if (!previousClaim && ["approved", "completed"].includes(nextClaim.status)) {
    throw validationError("New claims must start in the submitted workflow", 400);
  }
}

/**
 * Apply found-item side effects driven by a claim's status transition. Only
 * runs when the status actually changed. No-op if the referenced item is
 * missing. Returns nothing. Side effect: updates the FoundItem store.
 *
 * Transitions:
 *  - approved  -> item status "claimed".
 *  - completed -> item status "returned" + claim-confirmed flags/timestamps.
 *  - rejected (from approved) -> revert item "claimed" back to "approved",
 *    but only if no other approved/completed claim still holds it.
 *
 * @param {Object}      nextClaim     The claim after the change.
 * @param {Object|null} previousClaim The claim before the change.
 */
async function applyClaimStatusSideEffects(nextClaim = {}, previousClaim = null) {
  // Bail out when status is unset or unchanged (no side effect needed).
  if (!nextClaim.status || nextClaim.status === previousClaim?.status) {
    return;
  }

  const foundItem = await stores.FoundItem.findById(nextClaim.found_item_id);
  if (!foundItem) {
    return;
  }

  // Approval moves the item into the "claimed" state.
  if (nextClaim.status === "approved") {
    await stores.FoundItem.save({
      ...foundItem,
      status: "claimed",
    });
    return;
  }

  // Completion marks the item returned and records confirmation metadata
  // (both camelCase and snake_case variants for compatibility).
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

  // Rejecting a previously approved claim may release the item back to
  // "approved" status, but only if no other claim still holds it.
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

// Public API: claim validation/side-effects and the matching/reference helpers.
module.exports = {
  applyClaimStatusSideEffects,
  generateMatchesForLostReport,
  hasFoundItemReferences,
  mergeMatchSuggestions,
  syncMatchesForFoundItem,
  syncMatchesForLostReport,
  validateClaimSave,
};
