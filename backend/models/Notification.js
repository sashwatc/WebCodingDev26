/**
 * Notification.js
 *
 * Mongoose model for user-facing notifications (e.g. "a potential match was
 * found", "your claim is under review", system messages).
 *
 * Built via createFlexibleModel with NO explicitly declared fields beyond the
 * shared `id`; the flexible (`strict: false`) schema stores the full
 * notification shape. In practice (see data/seedAppData.js) a notification
 * carries fields such as: user_email (recipient), title, message, type (e.g.
 * match_found / claim_update / system), is_read (boolean read/unread flag),
 * link (in-app route to open), related_item_id, plus the auto-managed
 * createdAt/updatedAt timestamps.
 *
 * Bound to the MongoDB collection "notifications".
 */
const createFlexibleModel = require("./createFlexibleModel");

// Model name "Notification", no extra declared fields, stored in the "notifications" collection.
module.exports = createFlexibleModel("Notification", {}, "notifications");
