const express = require("express");
const path = require("path");
const router = express.Router();

const {
  getSupabaseAdminClient,
  getSupabaseStorageBucket,
  isSupabaseConfigured,
  sanitizeStorageObjectName,
} = require("../lib/supabase");

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

router.post("/", async (req, res) => {
  const {
    file_name: fileName = "upload",
    content_type: contentType = "",
    data_url: dataUrl = "",
  } = req.body || {};

  if (!dataUrl) {
    return res.status(400).json({
      message: "data_url is required",
    });
  }

  if (!isSupabaseConfigured()) {
    return res.status(201).json({
      file_url: dataUrl,
      storage: "inline",
    });
  }

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return res.status(400).json({
      message: "Invalid data_url payload",
    });
  }

  try {
    const safeName = sanitizeStorageObjectName(fileName);
    const extension = path.extname(safeName);
    const objectPath = [
      "uploads",
      new Date().toISOString().slice(0, 10),
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension || ""}`,
    ].join("/");
    const supabase = getSupabaseAdminClient();
    const bucket = getSupabaseStorageBucket();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, parsed.buffer, {
        contentType: contentType || parsed.contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

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
