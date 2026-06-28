/**
 * User.js
 *
 * Mongoose model representing an application user (students and admins/staff).
 *
 * Built via createFlexibleModel, so in addition to the explicitly declared
 * fields below it also includes the shared string `id`, allows extra ad-hoc
 * fields (`strict: false`), and auto-manages createdAt/updatedAt timestamps.
 *
 * Bound to the MongoDB collection "users".
 */
const createFlexibleModel = require("./createFlexibleModel");

module.exports = createFlexibleModel(
  "User",
  {
    // User's email address; indexed for lookups, normalized to lowercase, and
    // trimmed. Acts as the primary human-facing identity / login key.
    email: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    // Display name of the user. Defaults to an empty string; whitespace trimmed.
    full_name: {
      type: String,
      default: "",
      trim: true,
    },
    // Authorization role (e.g. "student" or "admin"). Defaults to "student".
    role: {
      type: String,
      default: "student",
      trim: true,
    },
    // URL to the user's avatar image. Optional; defaults to an empty string.
    avatar_url: {
      type: String,
      default: "",
      trim: true,
    },
  },
  // Underlying MongoDB collection name for this model.
  "users"
);
