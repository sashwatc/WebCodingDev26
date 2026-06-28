/**
 * FindBack AI - Local AI-like helpers
 * -----------------------------------------------------------------------------
 * These deterministic heuristics keep the app self-contained.
 *
 * Instead of calling a real ML/LLM service, this module fakes "AI" features
 * (matching lost vs found items, tag generation, description cleanup, duplicate
 * detection, claim risk scoring, smart-search parsing) using simple,
 * explainable keyword/attribute scoring. Everything runs synchronously in the
 * browser; functions are `async` only to mirror a remote-API signature.
 */

import { CATEGORIES, COLORS, LOCATIONS } from "@/lib/constants";

// Common English words ignored during keyword extraction so they don't inflate
// overlap scores.
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "i",
  "in",
  "is",
  "it",
  "its",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "with",
]);

// Lowercase a string and split into alphanumeric word tokens (punctuation
// stripped, empties removed). Returns an array of tokens.
function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Deduplicate an array preserving first-seen order.
function unique(values) {
  return [...new Set(values)];
}

// Collapse internal whitespace and trim ends.
function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

// Build a Set of "meaningful" keywords from many field values: tokenize each,
// drop short tokens (<=2 chars) and stop words. Used for overlap comparison.
function getKeywordSet(values) {
  return new Set(
    values
      .flatMap((value) => tokenize(value))
      .filter((token) => token.length > 2)
      .filter((token) => !STOP_WORDS.has(token))
  );
}

// Count how many tokens from `sourceTokens` also appear in `targetTokens`.
function getOverlapScore(sourceTokens, targetTokens) {
  let overlap = 0;
  sourceTokens.forEach((token) => {
    if (targetTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
}

// Absolute number of days between two date-ish values, or null if either is
// missing/unparseable.
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

// Normalize whitespace and capitalize the first character.
function sentenceCase(text) {
  const cleaned = normalizeText(text);
  if (!cleaned) {
    return "";
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Infer a category `value` from a free-text query by matching either the
// category label or its (underscore->space) value. Returns "" if none match.
function pickCategoryFromQuery(query) {
  const lowered = query.toLowerCase();
  return (
    CATEGORIES.find(
      (category) =>
        lowered.includes(category.label.toLowerCase()) ||
        lowered.includes(category.value.replaceAll("_", " "))
    )?.value || ""
  );
}

// Find the first known color name mentioned in the query, or "".
function pickColorFromQuery(query) {
  const lowered = query.toLowerCase();
  return COLORS.find((color) => lowered.includes(color.toLowerCase())) || "";
}

// Find the first known location name mentioned in the query, or "".
function pickLocationFromQuery(query) {
  const lowered = query.toLowerCase();
  return LOCATIONS.find((location) => lowered.includes(location.toLowerCase())) || "";
}

/**
 * Rank found items as candidate matches for a lost-item report.
 * @param {object} lostReport  Lost report fields (item_type, description, category, brand, color, last_seen_location, date_lost).
 * @param {Array}  foundItems  Found-item records to score against.
 * @returns {Promise<Array>}   Top matches (<=5) sorted by confidence desc, each
 *   { found_item_id, confidence (0-99), reasons[] }. Only items with status
 *   "approved"/"pending_review" and confidence > 20 are returned.
 *
 * Scoring adds points for exact category/color/brand/location matches, keyword
 * overlap between descriptions, and how close the lost/found dates are.
 */
export async function findMatches(lostReport, foundItems) {
  if (!foundItems?.length) {
    return [];
  }

  // Keyword set describing the lost item, compared against each found item.
  const lostTokens = getKeywordSet([
    lostReport.item_type,
    lostReport.description,
    lostReport.category,
    lostReport.brand,
    lostReport.color,
    lostReport.last_seen_location,
  ]);

  return foundItems
    // Only items still in the active pool can be matched.
    .filter((item) => ["approved", "pending_review"].includes(item.status))
    .map((item) => {
      let confidence = 0;            // Accumulated match score.
      const reasons = [];           // Human-readable reasons contributing to the score.
      const itemTokens = getKeywordSet([
        item.title,
        item.description,
        item.ai_description,
        item.subcategory,
        item.category,
        item.brand,
        item.color,
        item.location_found,
        ...(item.tags || []),
      ]);

      // Exact-attribute boosts (each only applies when both sides are present).
      if (lostReport.category && item.category === lostReport.category) {
        confidence += 24;
        reasons.push("category match");
      }
      if (lostReport.color && item.color?.toLowerCase() === lostReport.color.toLowerCase()) {
        confidence += 15;
        reasons.push("color match");
      }
      if (lostReport.brand && item.brand?.toLowerCase() === lostReport.brand.toLowerCase()) {
        confidence += 18;
        reasons.push("brand match");
      }
      if (
        lostReport.last_seen_location &&
        item.location_found?.toLowerCase() === lostReport.last_seen_location.toLowerCase()
      ) {
        confidence += 16;
        reasons.push("location match");
      }

      // Free-text similarity: up to +28 based on shared keywords.
      const overlap = getOverlapScore(lostTokens, itemTokens);
      if (overlap > 0) {
        confidence += Math.min(28, overlap * 6);
        reasons.push("description overlap");
      }

      // Temporal proximity between when it was lost vs. found.
      const dateGap = getDaysBetween(lostReport.date_lost, item.date_found);
      if (dateGap != null && dateGap <= 2) {
        confidence += 12;
        reasons.push("date proximity");
      } else if (dateGap != null && dateGap <= 5) {
        confidence += 6;
        reasons.push("recent timing");
      }

      // Cap confidence at 99 and dedupe reasons.
      return {
        found_item_id: item.id,
        confidence: Math.min(99, Math.round(confidence)),
        reasons: unique(reasons),
      };
    })
    .filter((match) => match.confidence > 20) // Drop weak candidates.
    .sort((a, b) => b.confidence - a.confidence) // Best first.
    .slice(0, 5); // Return at most 5.
}

/**
 * Suggest up to 6 tags for a found item from its title/description, with the
 * category label prepended. Returns a deduped, lowercased string array.
 */
export async function generateTags(title, description, category) {
  const rawTokens = getKeywordSet([title, description]);
  const categoryLabel = CATEGORIES.find((item) => item.value === category)?.label;
  return unique([categoryLabel?.toLowerCase(), ...Array.from(rawTokens)].filter(Boolean)).slice(0, 6);
}

/**
 * "Clean up" a raw description: just normalize whitespace and sentence-case it.
 * Returns the tidied string.
 */
export async function cleanupDescription(rawDescription) {
  return sentenceCase(rawDescription);
}

/**
 * Heuristically decide whether `newItem` duplicates one of `existingItems`.
 * @returns {Promise<object>} { isDuplicate, duplicate_of_id, confidence, reason }.
 * Scores each existing item by keyword overlap (x10) plus category/color boosts,
 * takes the best, and flags a duplicate only when its confidence reaches 45.
 */
export async function detectDuplicate(newItem, existingItems) {
  if (!existingItems?.length) {
    return { isDuplicate: false };
  }

  // Keyword set for the candidate new item.
  const sourceTokens = getKeywordSet([
    newItem.title,
    newItem.description,
    newItem.category,
    newItem.color,
    newItem.brand,
    newItem.location_found,
  ]);

  // Score every existing item, then keep the single highest-scoring one.
  const ranked = existingItems
    .map((item) => {
      const targetTokens = getKeywordSet([
        item.title,
        item.description,
        item.category,
        item.color,
        item.brand,
        item.location_found,
      ]);

      let confidence = getOverlapScore(sourceTokens, targetTokens) * 10;
      if (newItem.category && item.category === newItem.category) {
        confidence += 20;
      }
      if (newItem.color && item.color?.toLowerCase() === newItem.color.toLowerCase()) {
        confidence += 10;
      }

      return { item, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence)[0];

  // Below the threshold -> not a duplicate (still report the best score/reason).
  if (!ranked || ranked.confidence < 45) {
    return {
      isDuplicate: false,
      duplicate_of_id: "",
      confidence: ranked?.confidence || 0,
      reason: "No strong duplicate candidate found.",
    };
  }

  // Above threshold -> duplicate, capped at 95% confidence.
  return {
    isDuplicate: true,
    duplicate_of_id: ranked.item.id,
    confidence: Math.min(95, ranked.confidence),
    reason: "High similarity across title, description, and item attributes.",
  };
}

/**
 * Estimate how risky/suspicious an ownership claim is for staff review.
 * @param {object} claim     The claim (reason, identifying_details, proof_photo_url).
 * @param {object} foundItem The item being claimed (used for brand cross-check).
 * @returns {Promise<object>} { risk_score (0-92), risk_flags[], summary }.
 * Starts at a baseline and adds risk for vague reasons, missing details/photo,
 * and not mentioning the item's brand. A clean claim gets a positive flag.
 */
export async function scoreClaimRisk(claim, foundItem) {
  let risk = 18;            // Baseline risk.
  const riskFlags = [];     // Reasons the claim looks weak.

  if (tokenize(claim.reason).length < 8) {
    risk += 24;
    riskFlags.push("vague reason");
  }
  if (!normalizeText(claim.identifying_details)) {
    risk += 20;
    riskFlags.push("missing identifying details");
  }
  if (!claim.proof_photo_url) {
    risk += 12;
    riskFlags.push("no proof photo");
  }
  if (foundItem?.brand && !claim.reason.toLowerCase().includes(foundItem.brand.toLowerCase())) {
    risk += 8;
    riskFlags.push("brand not mentioned");
  }
  // No weaknesses found -> note the claim as strong.
  if (riskFlags.length === 0) {
    riskFlags.push("strong ownership details");
  }

  return {
    risk_score: Math.min(92, Math.round(risk)),
    risk_flags: riskFlags,
    summary: "Ownership review completed.",
  };
}

/**
 * Parse a natural-language search query into structured filters.
 * @returns {Promise<object>} { keywords[], category, color, brand, location, date_hint }.
 * keywords are the deduped significant tokens (<=8); category/color/location are
 * inferred from known values; brand/date_hint are left blank for this stub.
 */
export async function parseSmartSearch(query) {
  return {
    keywords: unique(tokenize(query).filter((token) => token.length > 2)).slice(0, 8),
    category: pickCategoryFromQuery(query),
    color: pickColorFromQuery(query),
    brand: "",
    location: pickLocationFromQuery(query),
    date_hint: "",
  };
}
