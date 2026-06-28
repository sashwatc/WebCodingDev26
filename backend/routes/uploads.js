/**
 * backend/routes/uploads.js
 *
 * Express router mounted at `/api/uploads` that accepts file uploads encoded as
 * base64 data URLs (e.g. images captured/selected in the browser) and stores them.
 *
 * Two modes depending on configuration:
 *  - Supabase configured: decode the data URL, upload the bytes to the Supabase
 *    storage bucket under a dated, randomized object path, and return the public URL.
 *  - Supabase NOT configured: fall back to "inline" storage by simply echoing the
 *    original data URL back as the file_url (useful for local/demo without storage).
 *
 * Storage helpers come from `../lib/supabase`.
 */
const express = require("express");
const path = require("path");
const router = express.Router();

const {
  getSupabaseAdminClient,
  getSupabaseStorageBucket,
  isSupabaseConfigured,
  sanitizeStorageObjectName,
} = require("../lib/supabase");

// Parse a base64 data URL of the form "data:<contentType>;base64,<data>".
// Returns { contentType, buffer } with the decoded bytes, or null if the string
// doesn't match the expected data-URL shape.
// Regex groups: 1 = MIME type (anything up to the ";"), 2 = the base64 payload.
function parseDataUrl(dataUrl = "") {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

// POST /api/uploads
// Upload a file supplied as a base64 data URL.
// Body: { file_name?, content_type?, data_url } (snake_case keys, defaults applied).
// Behavior:
//   - 400 if `data_url` is missing or not a valid data URL.
//   - If Supabase is not configured, returns the data URL unchanged ("inline" storage).
//   - Otherwise uploads the decoded bytes to the Supabase bucket and returns its public URL.
// Side effect: writes an object to Supabase storage (in Supabase mode).
// Returns 201 with { file_url, storage, [path] }, or 500 on upload failure.
router.post("/", async (req, res) => {
  // Pull fields with snake_case names from the client, applying sensible defaults.
  const {
    file_name: fileName = "upload",
    content_type: contentType = "",
    data_url: dataUrl = "",
  } = req.body || {};

  // A data URL is the actual file payload; without it there is nothing to store.
  if (!dataUrl) {
    return res.status(400).json({
      message: "data_url is required",
    });
  }

  // No storage backend configured: echo the data URL back so the client can still
  // reference the image inline (local/demo fallback).
  if (!isSupabaseConfigured()) {
    return res.status(201).json({
      file_url: dataUrl,
      storage: "inline",
    });
  }

  // Decode the data URL into raw bytes + content type; reject malformed input.
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return res.status(400).json({
      message: "Invalid data_url payload",
    });
  }

  try {
    // Sanitize the client-supplied filename to a safe storage object name (prevents
    // path traversal / unsafe characters) and derive its extension.
    const safeName = sanitizeStorageObjectName(fileName);
    const extension = path.extname(safeName);
    // Build a collision-resistant object path: uploads/<YYYY-MM-DD>/<timestamp>-<random><ext>.
    // The date prefix buckets files by day; timestamp + random suffix avoid clashes.
    const objectPath = [
      "uploads",
      new Date().toISOString().slice(0, 10),
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension || ""}`,
    ].join("/");
    const supabase = getSupabaseAdminClient();
    const bucket = getSupabaseStorageBucket();
    // Upload the bytes. Prefer the explicit content_type, falling back to the one
    // parsed from the data URL. upsert:false so we never overwrite an existing object.
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, parsed.buffer, {
        contentType: contentType || parsed.contentType,
        upsert: false,
      });

    // Supabase reports failures via the returned error object, not a throw.
    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Resolve the publicly accessible URL for the freshly uploaded object.
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

    res.status(201).json({
      file_url: data.publicUrl,
      path: objectPath,
      storage: "supabase",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
});

module.exports = router;
