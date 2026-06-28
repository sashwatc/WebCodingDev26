/**
 * seedAppData.js
 *
 * Central seed dataset for the lost-and-found demo backend. It aggregates all
 * sample records the app needs to run in seeded/demo mode (local fallback when
 * no live database is provided) into a single exported object keyed by entity
 * name.
 *
 * Exported shape (each key maps to an array of records matching the
 * correspondingly named Mongoose model):
 *  - FoundItem:    found items (imported wholesale from ./seedItems).
 *  - LostReport:   lost-item reports filed by users, some pre-matched to found items.
 *  - Claim:        ownership claims against found items, in various review states.
 *  - Notification: user-facing notifications tied to matches/claims/system events.
 *  - AuditLog:     audit-trail entries recording system/admin actions.
 *  - User:         demo user accounts (students + one admin).
 *
 * The datasets are intentionally cross-linked by id (e.g. a LostReport's
 * matched_items.found_item_id and a Claim's found_item_id reference ids from
 * seedItems; notifications/claims reference the same student emails as User)
 * so the demo presents a coherent end-to-end scenario.
 */
const seedItems = require("./seedItems");

// Helper that returns an ISO timestamp `days` ago (offset by `hours` within the
// day) so seed records carry realistic, relative created/updated dates that
// remain recent whenever the seed is loaded.
function daysAgo(days, hours = 10) {
  const now = Date.now();
  return new Date(now - days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000).toISOString();
}

module.exports = {
  // Found items — reuse the dedicated seed list as-is.
  FoundItem: seedItems,
  // Lost-item reports (lost_001..lost_008). Each describes something a user lost
  // and may include matched_items linking it to candidate found items by id,
  // with a confidence score and human-readable match reasons. status is
  // "matched" when a candidate was found, otherwise "open".
  LostReport: [
    // lost_001 — Mia Rodriguez's AirPods Pro case; matched to found_002 (96% confidence).
    {
      id: "lost_001",
      item_type: "AirPods Pro case",
      category: "electronics",
      description: "White AirPods Pro case with a small scratch near the hinge.",
      color: "White",
      brand: "Apple",
      last_seen_location: "Library",
      date_lost: "2026-03-13",
      photo_url: "",
      contact_name: "Mia Rodriguez",
      contact_email: "mia.rodriguez@pleasantvalley.edu",
      student_id: "PV10294",
      urgency: "high",
      extra_notes: "Lost sometime before second period.",
      status: "matched",
      matched_items: [
        {
          found_item_id: "found_002",
          confidence: 96,
          reasons: ["brand match", "color match", "location match", "description overlap"],
        },
      ],
      created_date: daysAgo(3, 8),
      updated_date: daysAgo(3, 8),
    },
    // lost_002 — Jordan Kim's blue JanSport backpack; matched to found_003 (91% confidence).
    {
      id: "lost_002",
      item_type: "Blue backpack",
      category: "bags_cases",
      description: "Royal blue backpack with tennis charm and school notebooks.",
      color: "Blue",
      brand: "JanSport",
      last_seen_location: "Student Lounge",
      date_lost: "2026-03-09",
      photo_url: "",
      contact_name: "Jordan Kim",
      contact_email: "jordan.kim@pleasantvalley.edu",
      student_id: "PV10811",
      urgency: "medium",
      extra_notes: "",
      status: "matched",
      matched_items: [
        {
          found_item_id: "found_003",
          confidence: 91,
          reasons: ["brand match", "color match", "location match", "unique feature match"],
        },
      ],
      created_date: daysAgo(7, 7),
      updated_date: daysAgo(6, 9),
    },
    // lost_003 — Eli Thompson's PVHS student ID lanyard; matched to found_006 (98% confidence); urgency critical.
    {
      id: "lost_003",
      item_type: "Student ID lanyard",
      category: "keys_ids",
      description: "Blue PVHS lanyard with my student ID and clear holder.",
      color: "Blue",
      brand: "PVHS",
      last_seen_location: "Auditorium",
      date_lost: "2026-03-14",
      photo_url: "",
      contact_name: "Eli Thompson",
      contact_email: "eli.thompson@pleasantvalley.edu",
      student_id: "PV10988",
      urgency: "critical",
      extra_notes: "I need it for lunch checkout and after-school practice.",
      status: "matched",
      matched_items: [
        {
          found_item_id: "found_006",
          confidence: 98,
          reasons: ["exact item type match", "school branding match", "location match", "owner name on ID"],
        },
      ],
      created_date: daysAgo(2, 9),
      updated_date: daysAgo(2, 10),
    },
    // lost_004 — Noah Patel's MacBook USB-C charger; status open (no matches yet).
    {
      id: "lost_004",
      item_type: "Laptop charger",
      category: "electronics",
      description: "Gray USB-C charger used for my MacBook with a braided cable.",
      color: "Gray",
      brand: "Apple",
      last_seen_location: "Computer Lab",
      date_lost: "2026-03-12",
      photo_url: "",
      contact_name: "Noah Patel",
      contact_email: "noah.patel@pleasantvalley.edu",
      student_id: "PV11014",
      urgency: "medium",
      extra_notes: "Could also have been left near the printers.",
      status: "open",
      matched_items: [],
      created_date: daysAgo(4, 11),
      updated_date: daysAgo(4, 11),
    },
    // lost_005 — Ava Martinez's Ray-Ban sunglasses; matched to found_010 (93% confidence).
    {
      id: "lost_005",
      item_type: "Sunglasses",
      category: "accessories",
      description: "Black Ray-Ban Wayfarer sunglasses, might have a small chip on one lens.",
      color: "Black",
      brand: "Ray-Ban",
      last_seen_location: "Cafeteria",
      date_lost: "2026-03-14",
      photo_url: "",
      contact_name: "Ava Martinez",
      contact_email: "ava.martinez@pleasantvalley.edu",
      student_id: "PV11205",
      urgency: "high",
      extra_notes: "They were a birthday gift. I think I left them on the table during lunch.",
      status: "matched",
      matched_items: [
        {
          found_item_id: "found_010",
          confidence: 93,
          reasons: ["brand match", "color match", "location match", "description overlap"],
        },
      ],
      created_date: daysAgo(2, 14),
      updated_date: daysAgo(2, 15),
    },
    // lost_006 — Derek Williams's Toyota car keys; matched to found_011 (97% confidence); urgency critical.
    {
      id: "lost_006",
      item_type: "Car keys",
      category: "keys_ids",
      description: "Toyota car key fob with two house keys and a red carabiner clip.",
      color: "Silver",
      brand: "Toyota",
      last_seen_location: "Parking Lot B",
      date_lost: "2026-03-13",
      photo_url: "",
      contact_name: "Derek Williams",
      contact_email: "derek.williams@pleasantvalley.edu",
      student_id: "PV10550",
      urgency: "critical",
      extra_notes: "I need these to drive home. Please contact me ASAP.",
      status: "matched",
      matched_items: [
        {
          found_item_id: "found_011",
          confidence: 97,
          reasons: ["exact item match", "location match", "unique feature match", "color match"],
        },
      ],
      created_date: daysAgo(3, 16),
      updated_date: daysAgo(3, 17),
    },
    // lost_007 — Sophie Nguyen's pink floral pencil case; matched to found_013 (89% confidence).
    {
      id: "lost_007",
      item_type: "Pencil case",
      category: "school_supplies",
      description: "Pink pencil case with flowers on it, has my colored pencils inside.",
      color: "Pink",
      brand: "Unknown",
      last_seen_location: "Room 204",
      date_lost: "2026-03-12",
      photo_url: "",
      contact_name: "Sophie Nguyen",
      contact_email: "sophie.nguyen@pleasantvalley.edu",
      student_id: "PV11089",
      urgency: "low",
      extra_notes: "Left it in Ms. Carter's class after 4th period.",
      status: "matched",
      matched_items: [
        {
          found_item_id: "found_013",
          confidence: 89,
          reasons: ["color match", "location match", "description overlap"],
        },
      ],
      created_date: daysAgo(4, 15),
      updated_date: daysAgo(3, 10),
    },
    // lost_008 — Marcus Johnson's silver Casio watch; status open (found_014 exists but not yet matched).
    {
      id: "lost_008",
      item_type: "Digital watch",
      category: "accessories",
      description: "Silver Casio watch, classic retro style with metal band.",
      color: "Silver",
      brand: "Casio",
      last_seen_location: "Gymnasium",
      date_lost: "2026-03-15",
      photo_url: "",
      contact_name: "Marcus Johnson",
      contact_email: "marcus.johnson@pleasantvalley.edu",
      student_id: "PV10743",
      urgency: "medium",
      extra_notes: "Took it off before PE and forgot to grab it after.",
      status: "open",
      matched_items: [],
      created_date: daysAgo(1, 15),
      updated_date: daysAgo(1, 15),
    },
  ],
  // Ownership claims (claim_001..claim_007). Each ties a claimant to a found
  // item (found_item_id) and carries the review workflow: a reason, identifying
  // details, pickup availability, status (under_review / need_more_info /
  // approved / completed), admin_notes, a risk_score with risk_flags, and—for
  // completed returns—rating/review fields.
  Claim: [
    // claim_001 — Jordan Kim claims found_003 (backpack); status under_review; low risk.
    {
      id: "claim_001",
      found_item_id: "found_003",
      found_item_title: "Blue JanSport Backpack",
      claimant_name: "Jordan Kim",
      claimant_email: "jordan.kim@pleasantvalley.edu",
      student_id: "PV10811",
      reason: "I lost my backpack in the student lounge after lunch and it has my notebooks in it.",
      identifying_details: "There is a green tennis racket keychain clipped to the zipper.",
      proof_photo_url: "",
      pickup_availability: "After 3 PM",
      status: "under_review",
      admin_notes: "Strong match with submitted lost report.",
      risk_score: 18,
      risk_flags: ["strong identifying detail provided"],
      created_date: daysAgo(2),
      updated_date: daysAgo(1),
    },
    // claim_002 — Sarah Chen claims found_005 (Nike hoodie); status completed; includes a 5-star approved review.
    {
      id: "claim_002",
      found_item_id: "found_005",
      found_item_title: "Black Nike Hoodie",
      claimant_name: "Sarah Chen",
      claimant_email: "sarah.chen@pleasantvalley.edu",
      student_id: "PV10422",
      reason: "I left my hoodie by the football field after practice and it has my name tag inside the collar.",
      identifying_details: "There is a stitched name tag inside the collar and a white swoosh on the front.",
      proof_photo_url: "",
      pickup_availability: "Lunch or after practice",
      received_confirmed_at: daysAgo(1, 13),
      status: "completed",
      admin_notes: "Returned at athletics office and confirmed by claimant.",
      risk_score: 12,
      risk_flags: ["strong identifying detail provided"],
      claimant_rating: 5,
      claimant_review: "Pickup was quick and the staff made the return process really easy.",
      review_status: "approved",
      review_submitted_at: daysAgo(1, 14),
      review_reviewed_at: daysAgo(1, 16),
      created_date: daysAgo(9),
      updated_date: daysAgo(1),
    },
    // claim_003 — Eli Thompson claims found_006 (ID lanyard); status approved; identity verified.
    {
      id: "claim_003",
      found_item_id: "found_006",
      found_item_title: "Blue PVHS Lanyard with Student ID",
      claimant_name: "Eli Thompson",
      claimant_email: "eli.thompson@pleasantvalley.edu",
      student_id: "PV10988",
      reason: "My ID lanyard was missing after auditorium rehearsal and I need it for school check-ins.",
      identifying_details: "The badge sleeve has a blue crack near the bottom corner and my ID is inside it.",
      proof_photo_url: "",
      pickup_availability: "Before first period or after rehearsal",
      status: "approved",
      admin_notes: "Identity verified against the visible student card details.",
      risk_score: 9,
      risk_flags: ["identity details verified"],
      created_date: daysAgo(1, 9),
      updated_date: daysAgo(1, 10),
    },
    // claim_004 — Luca Morales claims found_002 (AirPods); status need_more_info; high risk (vague description).
    {
      id: "claim_004",
      found_item_id: "found_002",
      found_item_title: "Apple AirPods Pro Case",
      claimant_name: "Luca Morales",
      claimant_email: "luca.morales@pleasantvalley.edu",
      student_id: "PV11103",
      reason: "I think the AirPods case might be mine because I lost one recently.",
      identifying_details: "It might have a scratch, but I am not completely sure where.",
      proof_photo_url: "",
      pickup_availability: "Lunch period",
      status: "need_more_info",
      admin_notes: "Need a more precise description before approval.",
      risk_score: 48,
      risk_flags: ["description too general"],
      created_date: daysAgo(1, 12),
      updated_date: daysAgo(1, 13),
    },
    // claim_005 — Ava Martinez claims found_010 (Ray-Bans); status under_review; chip detail matches.
    {
      id: "claim_005",
      found_item_id: "found_010",
      found_item_title: "Black Ray-Ban Wayfarer Sunglasses",
      claimant_name: "Ava Martinez",
      claimant_email: "ava.martinez@pleasantvalley.edu",
      student_id: "PV11205",
      reason: "Those are my Ray-Bans. I left them at the cafeteria table during lunch on the 14th.",
      identifying_details: "There is a small chip on the bottom right corner of the right lens from when I dropped them last month.",
      proof_photo_url: "",
      pickup_availability: "After school any day",
      status: "under_review",
      admin_notes: "Chip description matches the found item exactly.",
      risk_score: 15,
      risk_flags: ["strong identifying detail provided"],
      created_date: daysAgo(2, 15),
      updated_date: daysAgo(1, 11),
    },
    // claim_006 — Derek Williams claims found_011 (car keys); status approved; verified via car registration.
    {
      id: "claim_006",
      found_item_id: "found_011",
      found_item_title: "Car Keys with Toyota Fob",
      claimant_name: "Derek Williams",
      claimant_email: "derek.williams@pleasantvalley.edu",
      student_id: "PV10550",
      reason: "I lost my car keys in parking lot B after school. I drive a silver Toyota Corolla.",
      identifying_details: "The red carabiner has 'SCHOOL' engraved on it, and there are exactly two brass house keys.",
      proof_photo_url: "",
      pickup_availability: "Immediately — I need to drive home",
      status: "approved",
      admin_notes: "Verified — student showed matching car registration for the Toyota fob.",
      risk_score: 8,
      risk_flags: ["identity details verified", "car registration confirmed"],
      created_date: daysAgo(3, 17),
      updated_date: daysAgo(3, 18),
    },
    // claim_007 — Sophie Nguyen claims found_013 (pencil case); status approved; teacher-confirmed.
    {
      id: "claim_007",
      found_item_id: "found_013",
      found_item_title: "Pink Floral Pencil Case",
      claimant_name: "Sophie Nguyen",
      claimant_email: "sophie.nguyen@pleasantvalley.edu",
      student_id: "PV11089",
      reason: "I left my pencil case in Ms. Carter's room after history. It has all my art pencils.",
      identifying_details: "It has a gold zipper pull and about 15 Prismacolor colored pencils inside, plus a pink eraser.",
      proof_photo_url: "",
      pickup_availability: "During lunch",
      status: "approved",
      admin_notes: "Teacher confirmed it was left after 4th period history class.",
      risk_score: 10,
      risk_flags: ["teacher confirmation provided"],
      created_date: daysAgo(3, 12),
      updated_date: daysAgo(2, 10),
    },
  ],
  // User notifications (notif_001..notif_008). Each is addressed to a user_email
  // and has a title, message, type (match_found / claim_update / system), an
  // is_read flag, an in-app link to open, and an optional related_item_id.
  Notification: [
    // notif_001 — to Mia Rodriguez: AirPods match found (links to found_002); unread.
    {
      id: "notif_001",
      user_email: "mia.rodriguez@pleasantvalley.edu",
      title: "Potential match found",
      message: "We found an AirPods case that closely matches your report.",
      type: "match_found",
      is_read: false,
      link: "/ItemDetails?id=found_002",
      related_item_id: "found_002",
      created_date: daysAgo(2),
      updated_date: daysAgo(2),
    },
    // notif_002 — to Jordan Kim: system message about demo mode; unread.
    {
      id: "notif_002",
      user_email: "jordan.kim@pleasantvalley.edu",
      title: "Demo mode enabled",
      message: "This build can run with a hosted backend or local seeded data depending on deployment setup.",
      type: "system",
      is_read: false,
      link: "/Home",
      related_item_id: "",
      created_date: daysAgo(1),
      updated_date: daysAgo(1),
    },
    // notif_003 — to Jordan Kim: backpack claim under review (related found_003); already read.
    {
      id: "notif_003",
      user_email: "jordan.kim@pleasantvalley.edu",
      title: "Claim is under review",
      message: "Your backpack claim is waiting for admin approval.",
      type: "claim_update",
      is_read: true,
      link: "/UserDashboard",
      related_item_id: "found_003",
      created_date: daysAgo(1),
      updated_date: daysAgo(1),
    },
    // notif_004 — to Eli Thompson: ID lanyard match ready (links to found_006); unread.
    {
      id: "notif_004",
      user_email: "eli.thompson@pleasantvalley.edu",
      title: "ID card match ready",
      message: "Your PVHS ID lanyard appears to be available for pickup after approval review.",
      type: "match_found",
      is_read: false,
      link: "/ItemDetails?id=found_006",
      related_item_id: "found_006",
      created_date: daysAgo(1, 9),
      updated_date: daysAgo(1, 9),
    },
    // notif_005 — to Luca Morales: claim needs more info (related found_002); unread.
    {
      id: "notif_005",
      user_email: "luca.morales@pleasantvalley.edu",
      title: "Claim needs more information",
      message: "Add more identifying details before the AirPods case claim can be approved.",
      type: "claim_update",
      is_read: false,
      link: "/UserDashboard",
      related_item_id: "found_002",
      created_date: daysAgo(1, 13),
      updated_date: daysAgo(1, 13),
    },
    // notif_006 — to Ava Martinez: sunglasses match found (links to found_010); unread.
    {
      id: "notif_006",
      user_email: "ava.martinez@pleasantvalley.edu",
      title: "Sunglasses match found",
      message: "A pair of Ray-Ban sunglasses matching your description was found in the cafeteria.",
      type: "match_found",
      is_read: false,
      link: "/ItemDetails?id=found_010",
      related_item_id: "found_010",
      created_date: daysAgo(2, 15),
      updated_date: daysAgo(2, 15),
    },
    // notif_007 — to Derek Williams: car keys claim approved (related found_011); already read.
    {
      id: "notif_007",
      user_email: "derek.williams@pleasantvalley.edu",
      title: "Car keys claim approved",
      message: "Your car keys claim has been approved! Please pick them up at the main office.",
      type: "claim_update",
      is_read: true,
      link: "/UserDashboard",
      related_item_id: "found_011",
      created_date: daysAgo(3, 18),
      updated_date: daysAgo(3, 18),
    },
    // notif_008 — to Sophie Nguyen: pencil case claim approved (related found_013); unread.
    {
      id: "notif_008",
      user_email: "sophie.nguyen@pleasantvalley.edu",
      title: "Pencil case claim approved",
      message: "Your pencil case has been confirmed by your teacher. Pick it up from Room 204.",
      type: "claim_update",
      is_read: false,
      link: "/UserDashboard",
      related_item_id: "found_013",
      created_date: daysAgo(2, 10),
      updated_date: daysAgo(2, 10),
    },
  ],
  // Audit-trail entries (audit_001..audit_007). Each records an action against
  // an entity (entity_type + entity_id), who performed it (performed_by), a
  // human-readable details string, and optional previous_value/new_value
  // capturing a status transition.
  AuditLog: [
    // audit_001 — system: initial seeding of the local demo workspace.
    {
      id: "audit_001",
      action: "Seeded local demo workspace",
      entity_type: "system",
      entity_id: "local-demo",
      performed_by: "system",
      details: "Initialized sample records for local fallback mode.",
      previous_value: "",
      new_value: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    // audit_002 — claim claim_001 submitted by Jordan Kim (backpack).
    {
      id: "audit_002",
      action: "Claim submitted",
      entity_type: "claim",
      entity_id: "claim_001",
      performed_by: "jordan.kim@pleasantvalley.edu",
      details: "Claim submitted for Blue JanSport Backpack.",
      previous_value: "",
      new_value: "",
      created_date: daysAgo(2),
      updated_date: daysAgo(2),
    },
    // audit_003 — found_item found_006 approved by front-office (pending_review -> approved).
    {
      id: "audit_003",
      action: "Found item approved",
      entity_type: "found_item",
      entity_id: "found_006",
      performed_by: "front-office",
      details: "Blue PVHS lanyard with student ID approved for public search.",
      previous_value: "pending_review",
      new_value: "approved",
      created_date: daysAgo(2, 11),
      updated_date: daysAgo(2, 11),
    },
    // audit_004 — claim claim_004 moved by front-office (submitted -> need_more_info).
    {
      id: "audit_004",
      action: "Claim moved to need more info",
      entity_type: "claim",
      entity_id: "claim_004",
      performed_by: "front-office",
      details: "Requested stronger identifying details for the AirPods claim.",
      previous_value: "submitted",
      new_value: "need_more_info",
      created_date: daysAgo(1, 13),
      updated_date: daysAgo(1, 13),
    },
    // audit_005 — claim claim_006 approved by front-office (under_review -> approved).
    {
      id: "audit_005",
      action: "Car keys claim approved",
      entity_type: "claim",
      entity_id: "claim_006",
      performed_by: "front-office",
      details: "Car keys claim verified with car registration documentation.",
      previous_value: "under_review",
      new_value: "approved",
      created_date: daysAgo(3, 18),
      updated_date: daysAgo(3, 18),
    },
    // audit_006 — claim claim_005 submitted by Ava Martinez (sunglasses).
    {
      id: "audit_006",
      action: "Sunglasses claim submitted",
      entity_type: "claim",
      entity_id: "claim_005",
      performed_by: "ava.martinez@pleasantvalley.edu",
      details: "Claim submitted for Black Ray-Ban Wayfarer Sunglasses.",
      previous_value: "",
      new_value: "",
      created_date: daysAgo(2, 15),
      updated_date: daysAgo(2, 15),
    },
    // audit_007 — new found_item found_014 (Casio watch) reported by custodial ("" -> pending_review).
    {
      id: "audit_007",
      action: "New found item reported",
      entity_type: "found_item",
      entity_id: "found_014",
      performed_by: "custodial@pleasantvalley.edu",
      details: "Silver Casio Digital Watch reported found in boys restroom.",
      previous_value: "",
      new_value: "pending_review",
      created_date: daysAgo(1, 12),
      updated_date: daysAgo(1, 12),
    },
  ],
  // Demo user accounts. Each has id, full_name, email, role ("student" or
  // "admin"), and avatar_url. Emails here correspond to the claimants/finders
  // referenced throughout the LostReport/Claim/Notification datasets above.
  User: [
    // Primary demo student account (Jordan Kim).
    {
      id: "user_demo_student",
      full_name: "Jordan Kim",
      email: "jordan.kim@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    // Primary demo admin account (Avery Patel) — the only role "admin" user.
    {
      id: "user_demo_admin",
      full_name: "Avery Patel",
      email: "avery.patel@pleasantvalley.edu",
      role: "admin",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    // Additional student accounts below — each corresponds to a claimant/reporter
    // referenced in the seed LostReports, Claims, and Notifications.
    {
      id: "user_mia_rodriguez",
      full_name: "Mia Rodriguez",
      email: "mia.rodriguez@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_eli_thompson",
      full_name: "Eli Thompson",
      email: "eli.thompson@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_sarah_chen",
      full_name: "Sarah Chen",
      email: "sarah.chen@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_luca_morales",
      full_name: "Luca Morales",
      email: "luca.morales@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_noah_patel",
      full_name: "Noah Patel",
      email: "noah.patel@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_ava_martinez",
      full_name: "Ava Martinez",
      email: "ava.martinez@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_derek_williams",
      full_name: "Derek Williams",
      email: "derek.williams@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_sophie_nguyen",
      full_name: "Sophie Nguyen",
      email: "sophie.nguyen@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
    {
      id: "user_marcus_johnson",
      full_name: "Marcus Johnson",
      email: "marcus.johnson@pleasantvalley.edu",
      role: "student",
      avatar_url: "",
      created_date: daysAgo(10),
      updated_date: daysAgo(10),
    },
  ],
};
