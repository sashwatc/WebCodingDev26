/**
 * FindBack AI - AI Service Layer
 * All AI-powered features are centralized here for clean architecture.
 * Uses the InvokeLLM integration for intelligent processing.
 */

import { base44 } from "@/api/base44Client";

/**
 * AI Match Engine: Compare a lost item report against found items
 * Returns top matches with confidence scores and reasoning
 */
export async function findMatches(lostReport, foundItems) {
  if (!foundItems || foundItems.length === 0) return [];

  // Build a concise summary of found items for the LLM
  const foundSummaries = foundItems
    .filter(item => item.status === "approved" || item.status === "pending_review")
    .slice(0, 30) // Limit to prevent token overflow
    .map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      color: item.color,
      brand: item.brand,
      description: item.description,
      location: item.location_found,
      date: item.date_found,
      tags: item.tags,
    }));

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AI matching engine for a school lost-and-found system called FindBack AI.

A student reported a lost item. Compare it against the found items database and return the top matches.

LOST ITEM REPORT:
- Type: ${lostReport.item_type}
- Category: ${lostReport.category}
- Description: ${lostReport.description}
- Color: ${lostReport.color || "not specified"}
- Brand: ${lostReport.brand || "not specified"}
- Last seen location: ${lostReport.last_seen_location || "not specified"}
- Date lost: ${lostReport.date_lost}

FOUND ITEMS DATABASE:
${JSON.stringify(foundSummaries, null, 2)}

Return the top 5 most likely matches. For each match, provide:
- The found item ID
- A confidence score from 0 to 100
- A list of reasons explaining the match (category match, color match, location proximity, date proximity, keyword similarity, brand match)

Only include items with confidence > 20.`,
    response_json_schema: {
      type: "object",
      properties: {
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              found_item_id: { type: "string" },
              confidence: { type: "number" },
              reasons: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  });

  return result.matches || [];
}

/**
 * AI Tag Generation: Auto-generate tags from item details
 */
export async function generateTags(title, description, category) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Generate 3-6 descriptive search tags for this found item in a school lost-and-found system.
Title: ${title}
Description: ${description}
Category: ${category}
Return short, lowercase tags that would help someone find this item via search.`,
    response_json_schema: {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
    },
  });
  return result.tags || [];
}

/**
 * AI Description Cleanup: Rewrite messy descriptions into clean summaries
 */
export async function cleanupDescription(rawDescription) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a helpful assistant for a school lost-and-found system.
Rewrite this user-submitted item description into a clear, structured, grammatically correct summary.
Keep it concise (1-3 sentences). Preserve all factual details.

Original description: "${rawDescription}"`,
    response_json_schema: {
      type: "object",
      properties: {
        cleaned_description: { type: "string" },
      },
    },
  });
  return result.cleaned_description || rawDescription;
}

/**
 * AI Duplicate Detection: Check if a new found item might be a duplicate
 */
export async function detectDuplicate(newItem, existingItems) {
  if (!existingItems || existingItems.length === 0) return { isDuplicate: false };

  const recent = existingItems.slice(0, 20).map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    color: item.color,
    description: item.description,
    location: item.location_found,
    date: item.date_found,
  }));

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Check if this new found item submission might be a duplicate of an existing entry.

NEW ITEM:
- Title: ${newItem.title}
- Category: ${newItem.category}
- Color: ${newItem.color}
- Description: ${newItem.description}
- Location: ${newItem.location_found}
- Date: ${newItem.date_found}

EXISTING ITEMS:
${JSON.stringify(recent, null, 2)}

Determine if any existing item is likely the same physical item.`,
    response_json_schema: {
      type: "object",
      properties: {
        is_duplicate: { type: "boolean" },
        duplicate_of_id: { type: "string" },
        confidence: { type: "number" },
        reason: { type: "string" },
      },
    },
  });
  return result;
}

/**
 * AI Claim Risk Scoring: Evaluate if a claim seems suspicious
 */
export async function scoreClaimRisk(claim, foundItem) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Evaluate the risk level of this lost-and-found claim.

CLAIMED ITEM:
- Title: ${foundItem.title}
- Description: ${foundItem.description}
- Category: ${foundItem.category}
- Color: ${foundItem.color}
- Brand: ${foundItem.brand || "unknown"}

CLAIM DETAILS:
- Claimant: ${claim.claimant_name}
- Reason: ${claim.reason}
- Identifying details: ${claim.identifying_details || "none provided"}
- Has proof photo: ${claim.proof_photo_url ? "yes" : "no"}

Score the risk from 0-100 (0 = very trustworthy, 100 = very suspicious).
Flag specific concerns like vague details, missing specifics, or inconsistencies.`,
    response_json_schema: {
      type: "object",
      properties: {
        risk_score: { type: "number" },
        risk_flags: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
    },
  });
  return result;
}

/**
 * AI Smart Search: Parse natural language search queries
 */
export async function parseSmartSearch(query) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Parse this natural language search query for a school lost-and-found system.
Extract structured search filters from the query.

Query: "${query}"

Extract any mentioned: category, color, brand, location, date references, item type keywords.`,
    response_json_schema: {
      type: "object",
      properties: {
        keywords: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        color: { type: "string" },
        brand: { type: "string" },
        location: { type: "string" },
        date_hint: { type: "string" },
      },
    },
  });
  return result;
}