/**
 * AuditLog.js
 *
 * Mongoose model for audit-trail records that capture noteworthy actions taken
 * in the system (e.g. claims submitted, items approved, status changes).
 *
 * It is built via createFlexibleModel with NO explicitly declared fields beyond
 * the shared `id`, relying on the flexible (`strict: false`) schema so each log
 * entry can store whatever contextual fields it needs. In practice (see
 * data/seedAppData.js) entries carry fields such as: action, entity_type,
 * entity_id, performed_by, details, previous_value, new_value, plus the
 * auto-managed createdAt/updatedAt timestamps.
 *
 * Bound to the MongoDB collection "auditlogs".
 */
const createFlexibleModel = require("./createFlexibleModel");

// Model name "AuditLog", no extra declared fields, stored in the "auditlogs" collection.
module.exports = createFlexibleModel("AuditLog", {}, "auditlogs");
