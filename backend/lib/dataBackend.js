/**
 * dataBackend.js
 *
 * Central decision point for which storage backend the data-access layer uses.
 * The application can persist data in one of three backends, selected purely
 * from environment variables (no runtime configuration / no DB connection is
 * opened here):
 *   - "supabase": Supabase Postgres (preferred when fully configured)
 *   - "mongo":    MongoDB via Mongoose
 *   - "local":    JSON files on disk (default fallback for local dev / no env)
 *
 * Every store module (itemStore, entityStore, supabaseStore consumers, etc.)
 * imports the predicate helpers below to branch its read/write logic to the
 * currently active backend. These functions are pure and re-evaluate the
 * environment on each call, so changing env vars changes the selected backend.
 */

// Returns true only when BOTH Supabase env vars are present, meaning the
// Supabase backend can be used as the active storage engine.
function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Returns true when a MongoDB connection string is provided, indicating Mongo
// is available as a storage engine.
function isMongoConfigured() {
  return Boolean(process.env.MONGO_URI);
}

// Resolves the single active backend mode using a fixed precedence:
// Supabase wins over Mongo, Mongo wins over the local JSON fallback.
// Returns one of the string literals: "supabase" | "mongo" | "local".
function getDataBackendMode() {
  // Supabase takes top priority whenever it is fully configured.
  if (isSupabaseConfigured()) {
    return "supabase";
  }

  // Otherwise fall back to Mongo if a connection string is configured.
  if (isMongoConfigured()) {
    return "mongo";
  }

  // With no cloud backend configured, default to on-disk JSON storage.
  return "local";
}

// Convenience predicate: true when the active backend is Supabase.
function isSupabaseMode() {
  return getDataBackendMode() === "supabase";
}

// Convenience predicate: true when the active backend is MongoDB.
function isMongoMode() {
  return getDataBackendMode() === "mongo";
}

// Convenience predicate: true when the active backend is local JSON files.
function isLocalMode() {
  return getDataBackendMode() === "local";
}

// Export the mode resolver plus all configuration/mode predicates so other
// store modules can branch their persistence logic by active backend.
module.exports = {
  getDataBackendMode,
  isSupabaseConfigured,
  isSupabaseMode,
  isMongoConfigured,
  isMongoMode,
  isLocalMode,
};
