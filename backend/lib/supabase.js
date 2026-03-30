const path = require("path");
const { createClient } = require("@supabase/supabase-js");

let supabaseAdminClient = null;

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClient;
}

function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "findback-media";
}

function sanitizeStorageObjectName(fileName = "upload") {
  const extension = path.extname(fileName) || "";
  const baseName = path.basename(fileName, extension);
  const cleanedBaseName = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const cleanedExtension = extension.replace(/[^a-zA-Z0-9.]+/g, "");
  return `${cleanedBaseName || "upload"}${cleanedExtension || ""}`;
}

async function ensureSupabaseStorageBucket() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const bucketName = getSupabaseStorageBucket();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
  }

  if ((buckets || []).some((bucket) => bucket.name === bucketName)) {
    return bucketName;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 10485760,
  });

  if (createError) {
    throw new Error(`Failed to create Supabase bucket "${bucketName}": ${createError.message}`);
  }

  return bucketName;
}

module.exports = {
  ensureSupabaseStorageBucket,
  getSupabaseAdminClient,
  getSupabaseStorageBucket,
  isSupabaseConfigured,
  sanitizeStorageObjectName,
};
