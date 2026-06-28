/**
 * itemMedia.js
 *
 * Pure helpers for normalizing the image/media fields of "found item" records
 * before they are returned to API clients. Found items may carry photo URLs
 * across several legacy/alternate field names (photoUrls, photo_urls,
 * imageUrl, image_url) and may include generated SVG placeholder data URIs.
 *
 * This module consolidates all of those into a single de-duplicated
 * `photoUrls` array (preferring real images over placeholders) and picks a
 * primary `imageUrl`. It is storage-backend agnostic: it operates on plain
 * objects regardless of where they came from (local/mongo/supabase).
 */

// De-duplicate an array while dropping falsy entries, preserving first-seen
// order via a Set.
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

// Detect placeholder images: inline SVG data URIs are treated as non-real
// (generated) imagery rather than actual uploaded/found photos.
function isPlaceholderImage(url = "") {
  const value = String(url || "");
  return value.startsWith("data:image/svg+xml");
}

// Gather every candidate photo URL from an item across all supported field
// names (both array fields and the two single-image fields), de-duplicated.
function collectItemPhotoUrls(item = {}) {
  return unique([
    ...(Array.isArray(item.photoUrls) ? item.photoUrls : []),
    ...(Array.isArray(item.photo_urls) ? item.photo_urls : []),
    item.imageUrl,
    item.image_url,
  ]);
}

// Decide the effective image set for an item: prefer real (non-placeholder)
// images, but fall back to the full set (including placeholders) when no real
// image exists, so the UI always has something to show.
function buildFoundItemImageSet(item = {}) {
  const currentImages = collectItemPhotoUrls(item);
  const realImages = currentImages.filter((url) => !isPlaceholderImage(url));
  return realImages.length > 0 ? realImages : currentImages;
}

/**
 * Normalize the media fields of a single found item.
 *
 * @param {Object|null|undefined} item A found-item record (or falsy).
 * @returns {Object|null|undefined} Falsy input is returned unchanged;
 *          otherwise a shallow copy with a consolidated `photoUrls` array and
 *          a primary `imageUrl` (first photo, falling back to existing
 *          imageUrl, then ""). No side effects.
 */
async function enrichFoundItemMedia(item) {
  // Pass through null/undefined unchanged so callers can map optionally.
  if (!item) {
    return item;
  }

  const photoUrls = buildFoundItemImageSet(item);
  return {
    ...item,
    // Primary image: first consolidated photo, else any pre-existing imageUrl.
    imageUrl: photoUrls[0] || item.imageUrl || "",
    photoUrls,
  };
}

/**
 * Batch version of enrichFoundItemMedia for a list of items.
 *
 * @param {Object[]} items Array of found-item records (defaults to []).
 * @returns {Object[]} New array of enriched copies (same normalization rules).
 *          No side effects.
 */
async function enrichFoundItemsMedia(items = []) {
  return items.map((item) => {
    const photoUrls = buildFoundItemImageSet(item);
    return {
      ...item,
      imageUrl: photoUrls[0] || item.imageUrl || "",
      photoUrls,
    };
  });
}

// Public API: single- and multi-item media normalizers.
module.exports = {
  enrichFoundItemMedia,
  enrichFoundItemsMedia,
};
