/**
 * backend/routes/items.js
 *
 * Express router mounted at `/api/items` that manages "found item" records — the
 * core inventory of items handed in to lost & found. Unlike the generic
 * `entities.js` router, found items get dedicated handling: payload normalization
 * (accepting both camelCase and snake_case field names), embedded rating/review
 * management, media enrichment of responses, and match-syncing against lost reports.
 *
 * Routes:
 *  - GET    /        -> list all found items (media-enriched)
 *  - POST   /        -> create a found item
 *  - PATCH  /:id     -> update a found item (incl. rating upsert/remove operations)
 *  - DELETE /:id     -> delete, or soft-archive if the item is referenced elsewhere
 *
 * Persistence goes through `itemStore`; `itemMedia` resolves image URLs for
 * responses; `workflows` provides match-syncing and reference checks.
 */
const express = require("express");
const router = express.Router();
const itemStore = require("../lib/itemStore");
const { enrichFoundItemMedia, enrichFoundItemsMedia } = require("../lib/itemMedia");
const { hasFoundItemReferences, syncMatchesForFoundItem } = require("../lib/workflows");

// Safely parse a value into a Date. Returns null for empty/invalid inputs (rather
// than an "Invalid Date"), so callers can store a clean Date or null.
function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  // Number.isNaN(getTime()) detects an unparseable date.
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Normalize a single rating/review object into the canonical camelCase shape.
// Accepts either camelCase or snake_case keys from clients. Returns null if the
// input isn't an object or the numeric rating is missing/out of the 1-5 range
// (so invalid ratings are silently dropped). `submittedAt` defaults to now when absent.
function normalizeRating(rating = {}) {
  if (typeof rating !== "object" || rating === null) {
    return null;
  }

  // Rating must be a finite number within 1..5 to be considered valid.
  const parsedRating = Number(rating.rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return null;
  }

  // Coalesce each field across its accepted alias keys, falling back to defaults.
  return {
    claimId: rating.claimId || rating.claim_id || "",
    rating: parsedRating,
    review: rating.review || rating.claimant_review || "",
    claimantName: rating.claimantName || rating.claimant_name || "",
    reviewerEmail: rating.reviewerEmail || rating.reviewer_email || "",
    status: rating.status || rating.review_status || "pending",
    submittedAt: parseDate(rating.submittedAt || rating.submitted_at || rating.review_submitted_at) || new Date(),
    reviewedAt: parseDate(rating.reviewedAt || rating.reviewed_at || rating.review_reviewed_at),
  };
}

// Normalize a raw found-item request body into the canonical camelCase field set
// the store expects. Accepts both camelCase and snake_case keys from clients and
// drops any field that resolves to `undefined` (so PATCH only touches provided fields).
// Input: arbitrary payload object. Returns: a cleaned partial item object.
function normalizeItemPayload(payload = {}) {
  // Resolve the photo list from (in priority order): an explicit photoUrls array,
  // a snake_case photo_urls array, or a single image URL wrapped in an array.
  // `.filter(Boolean)` strips empty/falsy entries; `undefined` means "not provided".
  const photoUrls = Array.isArray(payload.photoUrls)
    ? payload.photoUrls.filter(Boolean)
    : Array.isArray(payload.photo_urls)
      ? payload.photo_urls.filter(Boolean)
      : payload.imageUrl || payload.image_url
        ? [payload.imageUrl || payload.image_url]
        : undefined;

  // Normalize each rating and drop invalid ones; undefined when no ratings supplied.
  const ratings = Array.isArray(payload.ratings)
    ? payload.ratings.map(normalizeRating).filter(Boolean)
    : undefined;

  // Map every supported field, accepting camelCase first then snake_case alias.
  const normalized = {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    subcategory: payload.subcategory,
    color: payload.color,
    brand: payload.brand,
    locationFound: payload.locationFound ?? payload.location_found,
    dateFound: payload.dateFound ?? payload.date_found,
    timeFound: payload.timeFound ?? payload.time_found,
    imageUrl: payload.imageUrl ?? payload.image_url,
    photoUrls,
    storageLocation: payload.storageLocation ?? payload.storage_location,
    condition: payload.condition,
    distinguishingFeatures: payload.distinguishingFeatures ?? payload.distinguishing_features,
    finderName: payload.finderName ?? payload.finder_name,
    finderEmail: payload.finderEmail ?? payload.finder_email,
    finderRole: payload.finderRole ?? payload.finder_role,
    aiDescription: payload.aiDescription ?? payload.ai_description,
    tags: Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : undefined,
    status: payload.status,
    itemType: payload.itemType ?? payload.item_type,
    priority: payload.priority,
    itemCode: payload.itemCode ?? payload.item_code,
    assignedTo: payload.assignedTo ?? payload.assigned_to,
    isFlagged: payload.isFlagged ?? payload.is_flagged,
    linkedLostReportId: payload.linkedLostReportId ?? payload.linked_lost_report_id,
    claimConfirmed: payload.claimConfirmed ?? payload.claim_confirmed,
    claimConfirmedAt: parseDate(payload.claimConfirmedAt ?? payload.claim_confirmed_at),
    ratings,
  };

  // Strip out keys whose value is undefined so callers (esp. PATCH) only apply
  // fields that were actually present in the incoming payload.
  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
}

// Apply special rating mutation operations carried on a PATCH payload, mutating
// `item.ratings` in place. Supports:
//   - payload.upsertRating: insert or replace a rating matched by claimId.
//   - payload.removeRatingByClaimId: remove the rating with that claimId.
// Throws a 400 error if an upsertRating payload is invalid. `item.markModified`
// is called (when present, i.e. Mongoose docs) so the nested array change persists.
async function applyPatchOperations(item, payload = {}) {
  if (payload.upsertRating) {
    const nextRating = normalizeRating(payload.upsertRating);
    if (!nextRating) {
      const error = new Error("Invalid rating payload");
      error.statusCode = 400;
      throw error;
    }

    // Find an existing rating for the same claim so we replace rather than duplicate.
    const ratingIndex = item.ratings.findIndex(
      (rating) => nextRating.claimId && rating.claimId === nextRating.claimId
    );

    if (ratingIndex >= 0) {
      // Replace the existing rating in place.
      item.ratings.splice(ratingIndex, 1, nextRating);
    } else {
      // No match: append as a new rating.
      item.ratings.push(nextRating);
    }

    // Tell Mongoose the nested array changed (no-op for plain objects via ?.).
    item.markModified?.("ratings");
  }

  if (payload.removeRatingByClaimId) {
    // Drop the rating whose claimId matches the one requested for removal.
    item.ratings = item.ratings.filter((rating) => rating.claimId !== payload.removeRatingByClaimId);
    item.markModified?.("ratings");
  }
}

// GET /api/items
// List all found items, with media (image URLs) resolved for the response.
// No inputs. Returns 200 with an array of enriched items, or 500 on error.
router.get("/", async (req, res) => {
  console.log("GET /api/items hit");

  try {
    // Fetch all items, then enrich the whole list's media in one pass.
    const items = await enrichFoundItemsMedia(await itemStore.list());
    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch items",
      error: error.message,
    });
  }
});

// POST /api/items
// Create a new found item. Body: raw item fields (camelCase or snake_case).
// Normalizes the payload, persists it, then syncs matches against lost reports.
// Side effects: creates an item; may create/update match records.
// Returns 201 with the media-enriched item, 400 on validation error, or 500 otherwise.
router.post("/", async (req, res) => {
  console.log("POST /api/items body:", req.body);

  try {
    const savedItem = await itemStore.create(normalizeItemPayload(req.body));
    // Newly found item may match outstanding lost reports.
    await syncMatchesForFoundItem(savedItem);
    res.status(201).json(await enrichFoundItemMedia(savedItem));
  } catch (error) {
    // Mongoose-style validation failures map to 400; everything else is a 500.
    const statusCode = error.name === "ValidationError" ? 400 : 500;

    res.status(statusCode).json({
      message: statusCode === 400 ? "Invalid item data" : "Failed to create item",
      error: error.message,
    });
  }
});

// PATCH /api/items/:id
// Update an existing found item. Params: `id`. Body: fields to change plus optional
// rating operations (upsertRating / removeRatingByClaimId).
// Loads the item, merges normalized fields onto it, applies rating operations, saves,
// and re-syncs matches. Side effects: persists item changes; may update match records.
// Returns 200 with the media-enriched item, 404 if not found, 400 on invalid
// data, or 500 otherwise.
router.patch("/:id", async (req, res) => {
  console.log(`PATCH /api/items/${req.params.id} body:`, req.body);

  try {
    const item = await itemStore.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // Merge only the provided/normalized fields onto the existing item...
    Object.assign(item, normalizeItemPayload(req.body));
    // ...then apply any rating-specific upsert/remove operations.
    await applyPatchOperations(item, req.body);

    const updatedItem = await itemStore.save(item);
    // Re-evaluate matches since item details may have changed.
    await syncMatchesForFoundItem(updatedItem);
    res.json(await enrichFoundItemMedia(updatedItem));
  } catch (error) {
    // Explicit statusCode (e.g. invalid rating 400) > ValidationError(400) > 500.
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);

    res.status(statusCode).json({
      message: statusCode === 400 ? "Invalid item update" : "Failed to update item",
      error: error.message,
    });
  }
});

// DELETE /api/items/:id
// Remove a found item. Params: `id`.
// If the item is referenced elsewhere (e.g. by claims/lost reports), it is NOT
// hard-deleted; instead it is soft-archived (status set to "archived") to preserve
// referential integrity. Otherwise it is permanently removed.
// Side effect: deletes or archives the item.
// Returns 200 { success: true } (with archived:true + item when archived),
// 404 if the item is missing, or 500 on error.
router.delete("/:id", async (req, res) => {
  console.log(`DELETE /api/items/${req.params.id} hit`);

  try {
    // Referenced items are archived rather than deleted to avoid breaking links.
    if (await hasFoundItemReferences(req.params.id)) {
      const item = await itemStore.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          message: "Item not found",
        });
      }

      // Soft-delete: persist the item with status flipped to "archived".
      const archivedItem = await itemStore.save({
        ...item,
        status: "archived",
      });

      return res.json({
        success: true,
        archived: true,
        item: await enrichFoundItemMedia(archivedItem),
      });
    }

    // No references: safe to hard-delete.
    const deletedItem = await itemStore.remove(req.params.id);

    // remove() returns falsy when no record matched the id.
    if (!deletedItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete item",
      error: error.message,
    });
  }
});

module.exports = router;
