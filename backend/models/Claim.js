/**
 * Claim.js
 *
 * Mongoose model for ownership claims submitted by users who believe a found
 * item belongs to them. A claim links a claimant to a specific found item and
 * carries the review/approval workflow state.
 *
 * Built via createFlexibleModel with NO explicitly declared fields beyond the
 * shared `id`; the flexible (`strict: false`) schema stores the full claim
 * shape. In practice (see data/seedAppData.js) a claim carries fields such as:
 * found_item_id, found_item_title, claimant_name, claimant_email, student_id,
 * reason, identifying_details, proof_photo_url, pickup_availability, status
 * (e.g. under_review / need_more_info / approved / completed), admin_notes,
 * risk_score, risk_flags, optional claimant_rating/claimant_review fields, and
 * the auto-managed createdAt/updatedAt timestamps.
 *
 * Bound to the MongoDB collection "claims".
 */
const createFlexibleModel = require("./createFlexibleModel");

// Model name "Claim", no extra declared fields, stored in the "claims" collection.
module.exports = createFlexibleModel("Claim", {}, "claims");
