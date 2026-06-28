/**
 * supabase.js
 *
 * Low-level Supabase integration helpers shared by the Supabase data and media
 * layers. Responsible for:
 *   - Lazily creating and caching a singleton service-role admin client.
 *   - Reporting whether Supabase is configured via environment variables.
 *   - Resolving and provisioning the storage bucket used for uploaded media.
 *   - Sanitizing user-supplied filenames into safe storage object names.
 *
 * The service-role key bypasses row-level security, so this client is intended
 * for trusted server-side use only.
 */

const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Cached singleton admin client (created on first use, reused thereafter).
let supabaseAdminClient = null;

// True only when both required Supabase env vars are present.
function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Return the cached service-role Supabase client, creating it on first call.
// Throws if Supabase is not configured. The client disables token refresh and
// session persistence since it is a stateless server-side admin client.
function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  // Build once and memoize for the process lifetime.
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

// Name of the storage bucket for uploaded media; overridable via env, defaults
// to "findback-media".
function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "findback-media";
}

// Turn an arbitrary upload filename into a safe storage object name:
// strips/normalizes disallowed characters in the base name and extension,
// collapses repeated dashes, and trims leading/trailing dashes. Falls back to
// "upload" when the cleaned base name is empty.
function sanitizeStorageObjectName(fileName = "upload") {
  const extension = path.extname(fileName) || "";
  const baseName = path.basename(fileName, extension);
  const cleanedBaseName = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const cleanedExtension = extension.replace(/[^a-zA-Z0-9.]+/g, "");
  return `${cleanedBaseName || "upload"}${cleanedExtension || ""}`;
}

/**
 * Ensure the configured storage bucket exists, creating it if necessary.
 *
 * @returns {Promise<string|null>} The bucket name when Supabase is configured
 *          (whether the bucket already existed or was just created), or null
 *          when Supabase is not configured. Throws on Supabase API errors.
 *          Side effect: may create a public bucket (10 MiB file size limit).
 */
async function ensureSupabaseStorageBucket() {
  // No-op when Supabase isn't in use.
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const bucketName = getSupabaseStorageBucket();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list Supabase buckets: ${listError.message}`);
  }

  // Bucket already present -> nothing to create.
  if ((buckets || []).some((bucket) => bucket.name === bucketName)) {
    return bucketName;
  }

  // Create a public bucket capped at 10 MiB (10485760 bytes) per file.
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 10485760,
  });

  if (createError) {
    throw new Error(`Failed to create Supabase bucket "${bucketName}": ${createError.message}`);
  }

  return bucketName;
}

// Public API: client accessor, bucket helpers, config check, name sanitizer.
module.exports = {
  ensureSupabaseStorageBucket,
  getSupabaseAdminClient,
  getSupabaseStorageBucket,
  isSupabaseConfigured,
  sanitizeStorageObjectName,
};
