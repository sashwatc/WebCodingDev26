const express = require("express");
const router = express.Router();
const itemStore = require("../lib/itemStore");
const { enrichFoundItemMedia, enrichFoundItemsMedia } = require("../lib/itemMedia");
const { hasFoundItemReferences, syncMatchesForFoundItem } = require("../lib/workflows");

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeRating(rating = {}) {
  if (typeof rating !== "object" || rating === null) {
    return null;
  }

  const parsedRating = Number(rating.rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return null;
  }

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

function normalizeItemPayload(payload = {}) {
  const photoUrls = Array.isArray(payload.photoUrls)
    ? payload.photoUrls.filter(Boolean)
    : Array.isArray(payload.photo_urls)
      ? payload.photo_urls.filter(Boolean)
      : payload.imageUrl || payload.image_url
        ? [payload.imageUrl || payload.image_url]
        : undefined;

  const ratings = Array.isArray(payload.ratings)
    ? payload.ratings.map(normalizeRating).filter(Boolean)
    : undefined;

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

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
}

async function applyPatchOperations(item, payload = {}) {
  if (payload.upsertRating) {
    const nextRating = normalizeRating(payload.upsertRating);
    if (!nextRating) {
      const error = new Error("Invalid rating payload");
      error.statusCode = 400;
      throw error;
    }

    const ratingIndex = item.ratings.findIndex(
      (rating) => nextRating.claimId && rating.claimId === nextRating.claimId
    );

    if (ratingIndex >= 0) {
      item.ratings.splice(ratingIndex, 1, nextRating);
    } else {
      item.ratings.push(nextRating);
    }

    item.markModified?.("ratings");
  }

  if (payload.removeRatingByClaimId) {
    item.ratings = item.ratings.filter((rating) => rating.claimId !== payload.removeRatingByClaimId);
    item.markModified?.("ratings");
  }
}

router.get("/", async (req, res) => {
  console.log("GET /api/items hit");

  try {
    const items = await enrichFoundItemsMedia(await itemStore.list());
    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch items",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  console.log("POST /api/items body:", req.body);

  try {
    const savedItem = await itemStore.create(normalizeItemPayload(req.body));
    await syncMatchesForFoundItem(savedItem);
    res.status(201).json(await enrichFoundItemMedia(savedItem));
  } catch (error) {
    const statusCode = error.name === "ValidationError" ? 400 : 500;

    res.status(statusCode).json({
      message: statusCode === 400 ? "Invalid item data" : "Failed to create item",
      error: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  console.log(`PATCH /api/items/${req.params.id} body:`, req.body);

  try {
    const item = await itemStore.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    Object.assign(item, normalizeItemPayload(req.body));
    await applyPatchOperations(item, req.body);

    const updatedItem = await itemStore.save(item);
    await syncMatchesForFoundItem(updatedItem);
    res.json(await enrichFoundItemMedia(updatedItem));
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);

    res.status(statusCode).json({
      message: statusCode === 400 ? "Invalid item update" : "Failed to update item",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  console.log(`DELETE /api/items/${req.params.id} hit`);

  try {
    if (await hasFoundItemReferences(req.params.id)) {
      const item = await itemStore.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          message: "Item not found",
        });
      }

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

    const deletedItem = await itemStore.remove(req.params.id);

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
