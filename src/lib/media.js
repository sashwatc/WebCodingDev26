/**
 * media.js
 * -----------------------------------------------------------------------------
 * Helpers for extracting photo URLs from a record, tolerant of the various
 * field names the backend may use (snake_case vs camelCase, single vs array).
 * Optionally includes proof photos, and can fall back to a secondary record.
 */

/**
 * Collect all photo URLs from a record, in priority order:
 * photo_urls[], photoUrls[], photo_url, photoUrl, then (optionally) the proof
 * photo fields. Falsy values are dropped and results de-duplicated.
 * @param {object}  record            Primary record to read photos from.
 * @param {object?} fallbackRecord    Used only when `record` yields no URLs.
 * @param {object}  options           { includeProofPhotos?: boolean }
 * @returns {string[]} Unique photo URLs (possibly empty).
 */
export function getRecordPhotoUrls(record = {}, fallbackRecord = null, { includeProofPhotos = false } = {}) {
  const directUrls = [
    ...(Array.isArray(record.photo_urls) ? record.photo_urls : []),
    ...(Array.isArray(record.photoUrls) ? record.photoUrls : []),
    record.photo_url,
    record.photoUrl,
    ...(includeProofPhotos ? [record.proof_photo_url, record.proofPhotoUrl] : []),
  ].filter(Boolean);

  // Prefer the record's own photos when present (deduped).
  if (directUrls.length > 0) {
    return [...new Set(directUrls)];
  }

  if (!fallbackRecord) {
    return [];
  }

  // Otherwise recurse once into the fallback record.
  return getRecordPhotoUrls(fallbackRecord, null, { includeProofPhotos });
}

// Convenience: the first/primary photo URL for a record, or "" if none.
export function getPrimaryRecordPhoto(record = {}, fallbackRecord = null, options = {}) {
  return getRecordPhotoUrls(record, fallbackRecord, options)[0] || "";
}
