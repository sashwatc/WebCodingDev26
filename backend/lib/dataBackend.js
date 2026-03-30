function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isMongoConfigured() {
  return Boolean(process.env.MONGO_URI);
}

function getDataBackendMode() {
  if (isSupabaseConfigured()) {
    return "supabase";
  }

  if (isMongoConfigured()) {
    return "mongo";
  }

  return "local";
}

function isSupabaseMode() {
  return getDataBackendMode() === "supabase";
}

function isMongoMode() {
  return getDataBackendMode() === "mongo";
}

function isLocalMode() {
  return getDataBackendMode() === "local";
}

module.exports = {
  getDataBackendMode,
  isSupabaseConfigured,
  isSupabaseMode,
  isMongoConfigured,
  isMongoMode,
  isLocalMode,
};
