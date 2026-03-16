/**
 * FindBack AI - Local AI-like helpers
 * These deterministic heuristics keep the app self-contained.
 */

import { CATEGORIES, COLORS, LOCATIONS } from "@/lib/constants";

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

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function getKeywordSet(values) {
  return new Set(
    values
      .flatMap((value) => tokenize(value))
      .filter((token) => token.length > 2)
      .filter((token) => !STOP_WORDS.has(token))
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

function sentenceCase(text) {
  const cleaned = normalizeText(text);
  if (!cleaned) {
    return "";
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

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

function pickColorFromQuery(query) {
  const lowered = query.toLowerCase();
  return COLORS.find((color) => lowered.includes(color.toLowerCase())) || "";
}

function pickLocationFromQuery(query) {
  const lowered = query.toLowerCase();
  return LOCATIONS.find((location) => lowered.includes(location.toLowerCase())) || "";
}

export async function findMatches(lostReport, foundItems) {
  if (!foundItems?.length) {
    return [];
  }

  const lostTokens = getKeywordSet([
    lostReport.item_type,
    lostReport.description,
    lostReport.category,
    lostReport.brand,
    lostReport.color,
    lostReport.last_seen_location,
  ]);

  return foundItems
    .filter((item) => ["approved", "pending_review"].includes(item.status))
    .map((item) => {
      let confidence = 0;
      const reasons = [];
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

      const overlap = getOverlapScore(lostTokens, itemTokens);
      if (overlap > 0) {
        confidence += Math.min(28, overlap * 6);
        reasons.push("description overlap");
      }

      const dateGap = getDaysBetween(lostReport.date_lost, item.date_found);
      if (dateGap != null && dateGap <= 2) {
        confidence += 12;
        reasons.push("date proximity");
      } else if (dateGap != null && dateGap <= 5) {
        confidence += 6;
        reasons.push("recent timing");
      }

      return {
        found_item_id: item.id,
        confidence: Math.min(99, Math.round(confidence)),
        reasons: unique(reasons),
      };
    })
    .filter((match) => match.confidence > 20)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

export async function generateTags(title, description, category) {
  const rawTokens = getKeywordSet([title, description]);
  const categoryLabel = CATEGORIES.find((item) => item.value === category)?.label;
  return unique([categoryLabel?.toLowerCase(), ...Array.from(rawTokens)].filter(Boolean)).slice(0, 6);
}

export async function cleanupDescription(rawDescription) {
  return sentenceCase(rawDescription);
}

export async function detectDuplicate(newItem, existingItems) {
  if (!existingItems?.length) {
    return { isDuplicate: false };
  }

  const sourceTokens = getKeywordSet([
    newItem.title,
    newItem.description,
    newItem.category,
    newItem.color,
    newItem.brand,
    newItem.location_found,
  ]);

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

  if (!ranked || ranked.confidence < 45) {
    return {
      isDuplicate: false,
      duplicate_of_id: "",
      confidence: ranked?.confidence || 0,
      reason: "No strong duplicate candidate found.",
    };
  }

  return {
    isDuplicate: true,
    duplicate_of_id: ranked.item.id,
    confidence: Math.min(95, ranked.confidence),
    reason: "High similarity across title, description, and item attributes.",
  };
}

export async function scoreClaimRisk(claim, foundItem) {
  let risk = 18;
  const riskFlags = [];

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
  if (riskFlags.length === 0) {
    riskFlags.push("strong ownership details");
  }

  return {
    risk_score: Math.min(92, Math.round(risk)),
    risk_flags: riskFlags,
    summary: "Ownership review completed.",
  };
}

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
