/**
 * LostReport.js
 *
 * Mongoose model for "lost item" reports filed by users describing something
 * they have lost, so the system can attempt to match it against found items.
 *
 * Built via createFlexibleModel with NO explicitly declared fields beyond the
 * shared `id`; the flexible (`strict: false`) schema stores the full report
 * shape. In practice (see data/seedAppData.js) a report carries fields such as:
 * item_type, category, description, color, brand, last_seen_location,
 * date_lost, photo_url, contact_name, contact_email, student_id, urgency,
 * extra_notes, status (e.g. open / matched), and matched_items (an array of
 * candidate found-item matches with found_item_id, confidence, and reasons),
 * plus the auto-managed createdAt/updatedAt timestamps.
 *
 * Bound to the MongoDB collection "lostreports".
 */
const createFlexibleModel = require("./createFlexibleModel");

// Model name "LostReport", no extra declared fields, stored in the "lostreports" collection.
module.exports = createFlexibleModel("LostReport", {}, "lostreports");
