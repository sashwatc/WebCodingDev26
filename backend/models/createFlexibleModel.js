/**
 * createFlexibleModel.js
 *
 * Factory helper that builds (or reuses) a Mongoose model with a deliberately
 * "loose" schema. It is used by the lightweight collections in this app
 * (AuditLog, Claim, LostReport, Notification, User) where the exact set of
 * stored fields can vary between records and may evolve over time.
 *
 * Key behaviors:
 *  - Every model always gets a string `id` field (an external/application-level
 *    identifier, separate from Mongo's own `_id`) which is indexed for fast
 *    lookups.
 *  - `strict: false` lets documents persist arbitrary extra fields that are NOT
 *    declared in the schema, so callers can store flexible/ad-hoc data.
 *  - `timestamps: true` automatically maintains `createdAt` / `updatedAt` dates.
 *  - The model is registered against an explicit MongoDB collection name.
 *
 * @param {string} name           Mongoose model name (e.g. "User").
 * @param {object} fields         Optional extra schema field definitions merged in.
 * @param {string} collectionName Underlying MongoDB collection to bind to.
 * @returns {mongoose.Model}       Existing model if already compiled, else a new one.
 */
const mongoose = require("mongoose");

module.exports = function createFlexibleModel(name, fields = {}, collectionName) {
  // Build the schema: a shared `id` field plus any caller-supplied fields.
  const schema = new mongoose.Schema(
    {
      // Application-level string identifier (distinct from Mongo's `_id`); indexed
      // for quick lookups and trimmed of surrounding whitespace.
      id: {
        type: String,
        index: true,
        trim: true,
      },
      // Spread in any additional field definitions provided by the caller.
      ...fields,
    },
    {
      // Allow documents to contain fields not declared above (flexible storage).
      strict: false,
      // Auto-manage createdAt / updatedAt timestamp fields on every document.
      timestamps: true,
    }
  );

  // Reuse an already-compiled model if present (avoids OverwriteModelError on
  // hot reloads / repeated requires); otherwise compile and bind to collectionName.
  return mongoose.models[name] || mongoose.model(name, schema, collectionName);
};
