import { BRAND_NAME } from "@/lib/constants";

const STORAGE_KEY = "findback-app-db";
const AUTH_STORAGE_KEY = "findback-auth-user";
const API_BASE_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const FOUND_ITEMS_API_URL = `${API_BASE_URL}/api/items`;
const ENTITY_API_BASE_URL = `${API_BASE_URL}/api/entities`;
const AUTH_API_BASE_URL = `${API_BASE_URL}/api/auth`;
const authListeners = new Set();

const CATEGORY_LABELS = {
  electronics: "electronics",
  clothing: "clothing",
  accessories: "accessories",
  school_supplies: "school supplies",
  sports_equipment: "sports equipment",
  food_containers: "food containers",
  keys_ids: "keys and ids",
  bags_cases: "bags and cases",
  personal_items: "personal items",
  other: "other",
};

function createPlaceholderImage(label, colorA, colorB) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" rx="36" fill="url(#g)" />
      <circle cx="540" cy="110" r="64" fill="rgba(255,255,255,0.12)" />
      <circle cx="130" cy="360" r="88" fill="rgba(255,255,255,0.1)" />
      <text x="50%" y="48%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="34" font-weight="700">
        ${label}
      </text>
      <text x="50%" y="58%" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif" font-size="18">
        Lost Then Found demo item
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createSeedData() {
  const now = Date.now();
  const daysAgo = (days, hours = 10) => new Date(now - days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000).toISOString();

  return {
    FoundItem: [
      {
        id: "found_001",
        title: "Black Hydro Flask Water Bottle",
        category: "food_containers",
        subcategory: "Water Bottle",
        description: "Matte black Hydro Flask with Pleasant Valley sticker and blue silicone boot.",
        ai_description: "A matte black Hydro Flask water bottle with a Pleasant Valley sticker and a blue silicone boot.",
        color: "Black",
        brand: "Hydro Flask",
        date_found: "2026-03-11",
        time_found: "12:15",
        location_found: "Gymnasium",
        storage_location: "Main Office shelf B2",
        condition: "good",
        photo_urls: [createPlaceholderImage("Hydro Flask", "#0f172a", "#0f766e")],
        distinguishing_features: "Pleasant Valley athletics sticker and blue rubber base",
        finder_name: "Coach Miller",
        finder_email: "coach.miller@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["water bottle", "hydro flask", "black", "gym"],
        status: "approved",
        priority: "medium",
        item_code: "FB-2026-HF82",
        is_flagged: false,
        assigned_to: "front-office",
        created_date: daysAgo(5),
        updated_date: daysAgo(5),
      },
      {
        id: "found_002",
        title: "Apple AirPods Pro Case",
        category: "electronics",
        subcategory: "Earbuds",
        description: "White AirPods Pro charging case with slight scratch on the lid.",
        ai_description: "White Apple AirPods Pro charging case with a small scratch on the lid.",
        color: "White",
        brand: "Apple",
        date_found: "2026-03-13",
        time_found: "09:40",
        location_found: "Library",
        storage_location: "Main Office drawer E1",
        condition: "good",
        photo_urls: [createPlaceholderImage("AirPods Pro", "#e2e8f0", "#94a3b8")],
        distinguishing_features: "Small scratch near hinge",
        finder_name: "Library Desk",
        finder_email: "library@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["airpods", "apple", "earbuds", "white"],
        status: "approved",
        priority: "high",
        item_code: "FB-2026-AP91",
        is_flagged: false,
        assigned_to: "front-office",
        created_date: daysAgo(3),
        updated_date: daysAgo(3),
      },
      {
        id: "found_003",
        title: "Blue JanSport Backpack",
        category: "bags_cases",
        subcategory: "Backpack",
        description: "Royal blue JanSport backpack with math notebook and tennis keychain inside front pocket.",
        ai_description: "Royal blue JanSport backpack with a math notebook and tennis keychain in the front pocket.",
        color: "Blue",
        brand: "JanSport",
        date_found: "2026-03-09",
        time_found: "15:05",
        location_found: "Student Lounge",
        storage_location: "Counselor office storage closet",
        condition: "fair",
        photo_urls: [createPlaceholderImage("JanSport Bag", "#1d4ed8", "#0f172a")],
        distinguishing_features: "Green tennis racket keychain",
        finder_name: "Jamie Lopez",
        finder_email: "jamie.lopez@pleasantvalley.edu",
        finder_role: "student",
        tags: ["backpack", "jansport", "blue", "student lounge"],
        status: "claimed",
        priority: "medium",
        item_code: "FB-2026-JS27",
        is_flagged: false,
        assigned_to: "counseling-office",
        created_date: daysAgo(7),
        updated_date: daysAgo(2),
      },
      {
        id: "found_004",
        title: "Silver Graphing Calculator",
        category: "school_supplies",
        subcategory: "Calculator",
        description: "Texas Instruments graphing calculator with initials M.R. on back.",
        ai_description: "Silver Texas Instruments graphing calculator with the initials M.R. written on the back.",
        color: "Silver",
        brand: "Texas Instruments",
        date_found: "2026-03-08",
        time_found: "11:00",
        location_found: "Science Hall",
        storage_location: "Science department office",
        condition: "good",
        photo_urls: [createPlaceholderImage("TI Calculator", "#64748b", "#334155")],
        distinguishing_features: "Initials M.R. in black marker",
        finder_name: "Mrs. Reynolds",
        finder_email: "reynolds@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["calculator", "ti", "silver", "science hall"],
        status: "pending_review",
        priority: "medium",
        item_code: "FB-2026-TI44",
        is_flagged: false,
        assigned_to: "science-office",
        created_date: daysAgo(8),
        updated_date: daysAgo(8),
      },
      {
        id: "found_005",
        title: "Black Nike Hoodie",
        category: "clothing",
        subcategory: "Hoodie",
        description: "Black Nike hoodie, medium size, with white swoosh on chest.",
        ai_description: "Black Nike hoodie in medium size with a white swoosh logo on the chest.",
        color: "Black",
        brand: "Nike",
        date_found: "2026-03-05",
        time_found: "16:20",
        location_found: "Football Field",
        storage_location: "Athletics office rack 3",
        condition: "good",
        photo_urls: [createPlaceholderImage("Nike Hoodie", "#111827", "#52525b")],
        distinguishing_features: "Name tag stitched inside collar",
        finder_name: "Athletics Office",
        finder_email: "athletics@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["hoodie", "nike", "black", "football field"],
        status: "returned",
        priority: "low",
        item_code: "FB-2026-NK58",
        is_flagged: false,
        assigned_to: "athletics-office",
        created_date: daysAgo(11),
        updated_date: daysAgo(1),
      },
      {
        id: "found_006",
        title: "Blue PVHS Lanyard with Student ID",
        category: "keys_ids",
        subcategory: "Student ID",
        description: "Blue PVHS lanyard with a clear badge holder and student ID card for Eli Thompson.",
        ai_description: "Blue PVHS lanyard with a clear badge holder containing a student ID card for Eli Thompson.",
        color: "Blue",
        brand: "PVHS",
        date_found: "2026-03-14",
        time_found: "13:05",
        location_found: "Auditorium",
        storage_location: "Main Office drawer A4",
        condition: "excellent",
        photo_urls: [createPlaceholderImage("PVHS ID", "#183459", "#2563eb")],
        distinguishing_features: "Blue woven lanyard with silver key clip and clear sleeve",
        finder_name: "Mr. Sutton",
        finder_email: "sutton@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["student id", "lanyard", "pvhs", "blue", "auditorium"],
        status: "approved",
        priority: "high",
        item_code: "FB-2026-ID34",
        is_flagged: false,
        assigned_to: "front-office",
        created_date: daysAgo(2),
        updated_date: daysAgo(2),
      },
      {
        id: "found_007",
        title: "Gray MacBook USB-C Charger",
        category: "electronics",
        subcategory: "Laptop Charger",
        description: "Apple USB-C charging brick with a gray braided cable wrapped neatly around it.",
        ai_description: "Gray Apple USB-C charger with a braided cable, likely for a MacBook or iPad.",
        color: "Gray",
        brand: "Apple",
        date_found: "2026-03-12",
        time_found: "14:25",
        location_found: "Computer Lab",
        storage_location: "Tech office cabinet 2",
        condition: "good",
        photo_urls: [createPlaceholderImage("USB-C Charger", "#475569", "#1e293b")],
        distinguishing_features: "Small silver label on cable tie",
        finder_name: "Technology Office",
        finder_email: "tech.office@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["charger", "usb-c", "apple", "gray", "computer lab"],
        status: "approved",
        priority: "medium",
        item_code: "FB-2026-MC63",
        is_flagged: false,
        assigned_to: "tech-office",
        created_date: daysAgo(4),
        updated_date: daysAgo(4),
      },
      {
        id: "found_008",
        title: "White Volleyball Knee Pads",
        category: "sports_equipment",
        subcategory: "Knee Pads",
        description: "Pair of white volleyball knee pads with navy trim and a small number 8 written inside.",
        ai_description: "White volleyball knee pads with navy trim and the number 8 written on the inner tag.",
        color: "White",
        brand: "Mizuno",
        date_found: "2026-03-10",
        time_found: "17:35",
        location_found: "Gymnasium",
        storage_location: "Athletics office bin 1",
        condition: "good",
        photo_urls: [createPlaceholderImage("Knee Pads", "#f8fafc", "#1e3a8a")],
        distinguishing_features: "Number 8 handwritten on the inner tag",
        finder_name: "Volleyball Coach",
        finder_email: "volleyball@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["volleyball", "knee pads", "white", "gymnasium"],
        status: "approved",
        priority: "medium",
        item_code: "FB-2026-VB08",
        is_flagged: false,
        assigned_to: "athletics-office",
        created_date: daysAgo(6),
        updated_date: daysAgo(6),
      },
    ],
    LostReport: [
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
    ],
    Claim: [
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
        risk_flags: ["description too general", "no proof photo"],
        created_date: daysAgo(1, 12),
        updated_date: daysAgo(1, 13),
      },
    ],
    Notification: [
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
      {
        id: "notif_002",
        user_email: "jordan.kim@pleasantvalley.edu",
        title: "Demo mode enabled",
        message: "This standalone version uses in-browser sample data instead of a hosted backend.",
        type: "system",
        is_read: false,
        link: "/Home",
        related_item_id: "",
        created_date: daysAgo(1),
        updated_date: daysAgo(1),
      },
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
    ],
    AuditLog: [
      {
        id: "audit_001",
        action: "Seeded local demo workspace",
        entity_type: "system",
        entity_id: "local-demo",
        performed_by: "system",
        details: "Initialized sample records for standalone development.",
        previous_value: "",
        new_value: "",
        created_date: daysAgo(10),
        updated_date: daysAgo(10),
      },
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
    ],
  };
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readDb() {
  const storage = getStorage();
  if (!storage) {
    return createSeedData();
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = createSeedData();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return clone(seeded);
  }

  try {
    return JSON.parse(raw);
  } catch {
    const seeded = createSeedData();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return clone(seeded);
  }
}

function writeDb(db) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function readAuthUser() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeAuthUser(user) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (!user) {
    storage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function sortRecords(records, sort) {
  if (!sort) {
    return records;
  }

  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;

  return [...records].sort((a, b) => {
    const aValue = a[field] ?? "";
    const bValue = b[field] ?? "";

    if (aValue < bValue) {
      return desc ? 1 : -1;
    }
    if (aValue > bValue) {
      return desc ? -1 : 1;
    }
    return 0;
  });
}

function matchRecord(record, filters = {}) {
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const recordValue = record[key];
    if (Array.isArray(recordValue)) {
      return recordValue.includes(value);
    }

    return recordValue === value;
  });
}

function limitRecords(records, limit) {
  if (!limit) {
    return records;
  }

  return records.slice(0, limit);
}

function replaceCachedCollection(entityName, records) {
  const db = readDb();
  db[entityName] = clone(records);
  writeDb(db);
}

function upsertCachedRecord(entityName, record) {
  const db = readDb();
  const records = db[entityName] || [];
  const recordId = record?.id || record?._id;
  const index = records.findIndex((entry) => (entry?.id || entry?._id) === recordId);

  if (index >= 0) {
    records[index] = clone(record);
  } else {
    records.unshift(clone(record));
  }

  db[entityName] = records;
  writeDb(db);
}

function removeCachedRecord(entityName, id) {
  const db = readDb();
  db[entityName] = (db[entityName] || []).filter((entry) => (entry?.id || entry?._id) !== id);
  writeDb(db);
}

async function addNotification(notification) {
  return appClient.entities.Notification.create({
    type: "system",
    is_read: false,
    link: "",
    related_item_id: "",
    ...notification,
  });
}

async function addAuditLog(log) {
  return appClient.entities.AuditLog.create({
    previous_value: "",
    new_value: "",
    ...log,
  });
}

async function applyEntitySideEffects(entityName, operation, record, previousRecord) {
  if (entityName === "Claim" && operation === "create") {
    await addNotification({
      user_email: record.claimant_email,
      title: "Claim submitted",
      message: `Your claim for ${record.found_item_title} has been submitted.`,
      type: "claim_update",
      link: "/UserDashboard",
      related_item_id: record.found_item_id,
    });

    await addAuditLog({
      action: "Claim submitted",
      entity_type: "claim",
      entity_id: record.id,
      performed_by: record.claimant_email || "demo-user",
      details: `Claim submitted for ${record.found_item_title}.`,
    });
  }

  if (entityName === "Claim" && operation === "update" && record.status !== previousRecord?.status) {
    await addNotification({
      user_email: record.claimant_email,
      title: "Claim updated",
      message: `Your claim for ${record.found_item_title} is now ${record.status.replaceAll("_", " ")}.`,
      type: "claim_update",
      link: "/UserDashboard",
      related_item_id: record.found_item_id,
    });
  }

  if (
    entityName === "LostReport" &&
    operation === "update" &&
    record.matched_items?.length &&
    JSON.stringify(record.matched_items || []) !== JSON.stringify(previousRecord?.matched_items || [])
  ) {
    await addNotification({
      user_email: record.contact_email,
      title: "Potential match found",
      message: `We found ${record.matched_items.length} possible match${record.matched_items.length > 1 ? "es" : ""} for your lost item report.`,
      type: "match_found",
      link: "/UserDashboard",
    });
  }

  if (entityName === "FoundItem" && operation === "update" && record.status !== previousRecord?.status && record.finder_email) {
    await addNotification({
      user_email: record.finder_email,
      title: "Found item updated",
      message: `${record.title} is now marked as ${record.status.replaceAll("_", " ")}.`,
      type: "item_approved",
      link: `/ItemDetails?id=${record.id}`,
      related_item_id: record.id,
    });
  }
}

function createEntityApi(entityName) {
  const api = {
    async list(sort, limit) {
      try {
        const records = await requestEntityApi(entityName);
        replaceCachedCollection(entityName, records);
        return clone(limitRecords(sortRecords(records, sort), limit));
      } catch {
        const db = readDb();
        const records = db[entityName] || [];
        return clone(limitRecords(sortRecords(records, sort), limit));
      }
    },

    async filter(filters = {}, sort, limit) {
      try {
        const records = await requestEntityApi(entityName);
        replaceCachedCollection(entityName, records);
        const filtered = records.filter((record) => matchRecord(record, filters));
        return clone(limitRecords(sortRecords(filtered, sort), limit));
      } catch {
        const db = readDb();
        const records = (db[entityName] || []).filter((record) => matchRecord(record, filters));
        return clone(limitRecords(sortRecords(records, sort), limit));
      }
    },

    async create(data) {
      const record = await requestEntityApi(entityName, "", {
        method: "POST",
        body: JSON.stringify(data),
      });

      upsertCachedRecord(entityName, record);
      await applyEntitySideEffects(entityName, "create", record, null);
      return clone(record);
    },

    async update(id, updates) {
      const records = await api.list();
      const previousRecord =
        records.find((record) => (record?.id || record?._id) === id) ||
        (readDb()[entityName] || []).find((record) => (record?.id || record?._id) === id) ||
        null;

      const nextRecord = await requestEntityApi(entityName, `/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      upsertCachedRecord(entityName, nextRecord);
      await applyEntitySideEffects(entityName, "update", nextRecord, previousRecord);
      return clone(nextRecord);
    },

    async delete(id) {
      try {
        const response = await requestEntityApi(entityName, `/${id}`, {
          method: "DELETE",
        });

        removeCachedRecord(entityName, id);
        return Boolean(response?.success);
      } catch {
        const db = readDb();
        const records = db[entityName] || [];
        const index = records.findIndex((record) => (record?.id || record?._id) === id);

        if (index === -1) {
          return false;
        }

        records.splice(index, 1);
        writeDb(db);
        return true;
      }
    },
  };

  return api;
}

async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const responseText = await response.text();
  let payload = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || "Failed to fetch items.");
  }

  return payload;
}

async function requestFoundItemsApi(path = "", options = {}) {
  return requestApi(`${FOUND_ITEMS_API_URL}${path}`, options);
}

async function requestEntityApi(entityName, path = "", options = {}) {
  return requestApi(`${ENTITY_API_BASE_URL}/${encodeURIComponent(entityName)}${path}`, options);
}

async function requestAuthApi(path = "", options = {}) {
  return requestApi(`${AUTH_API_BASE_URL}${path}`, options);
}

function normalizeRating(record = {}) {
  return {
    claim_id: record.claim_id || record.claimId || "",
    rating: Number(record.rating || 0),
    review: record.review || record.claimant_review || "",
    claimant_name: record.claimant_name || record.claimantName || "",
    reviewer_email: record.reviewer_email || record.reviewerEmail || "",
    review_status: record.review_status || record.status || "pending",
    review_submitted_at: record.review_submitted_at || record.submittedAt || "",
    review_reviewed_at: record.review_reviewed_at || record.reviewedAt || "",
  };
}

function normalizeFoundItem(record = {}) {
  const imageUrl = record.imageUrl || record.image_url || "";
  const photoUrls = Array.isArray(record.photo_urls)
    ? clone(record.photo_urls)
    : Array.isArray(record.photoUrls)
      ? clone(record.photoUrls)
      : imageUrl
        ? [imageUrl]
        : [];

  return {
    ...record,
    id: record.id || record._id || "",
    title: record.title || "",
    description: record.description || "",
    category: record.category || "",
    subcategory: record.subcategory || "",
    color: record.color || "",
    brand: record.brand || "",
    location_found: record.location_found || record.locationFound || "",
    date_found: record.date_found || record.dateFound || "",
    time_found: record.time_found || record.timeFound || "",
    photo_urls: photoUrls,
    imageUrl,
    photoUrls,
    status: record.status || "pending_review",
    record_type: record.record_type || record.item_type || record.itemType || "found",
    created_date: record.created_date || record.createdAt || "",
    updated_date: record.updated_date || record.updatedAt || "",
    ai_description: record.ai_description || record.aiDescription || "",
    distinguishing_features: record.distinguishing_features || record.distinguishingFeatures || "",
    tags: Array.isArray(record.tags) ? clone(record.tags) : [],
    finder_name: record.finder_name || record.finderName || "",
    finder_email: record.finder_email || record.finderEmail || "",
    finder_role: record.finder_role || record.finderRole || "",
    storage_location: record.storage_location || record.storageLocation || "",
    condition: record.condition || "",
    priority: record.priority || "",
    item_code: record.item_code || record.itemCode || "",
    assigned_to: record.assigned_to || record.assignedTo || "",
    is_flagged: Boolean(record.is_flagged ?? record.isFlagged),
    claim_confirmed: Boolean(record.claim_confirmed ?? record.claimConfirmed),
    claim_confirmed_at: record.claim_confirmed_at || record.claimConfirmedAt || "",
    ratings: Array.isArray(record.ratings) ? record.ratings.map((rating) => normalizeRating(rating)) : [],
  };
}

function hasAnyKey(record, keys) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(record, key));
}

function serializeFoundItem(record = {}, { partial = false } = {}) {
  const values = {
    title: record.title,
    description: record.description,
    category: record.category,
    subcategory: record.subcategory,
    color: record.color,
    brand: record.brand,
    locationFound: record.location_found,
    dateFound: record.date_found,
    timeFound: record.time_found,
    imageUrl: Array.isArray(record.photo_urls) ? record.photo_urls[0] || "" : record.imageUrl,
    photoUrls: Array.isArray(record.photo_urls) ? clone(record.photo_urls) : undefined,
    storageLocation: record.storage_location,
    condition: record.condition,
    distinguishingFeatures: record.distinguishing_features,
    finderName: record.finder_name,
    finderEmail: record.finder_email,
    finderRole: record.finder_role,
    aiDescription: record.ai_description,
    tags: Array.isArray(record.tags) ? clone(record.tags) : undefined,
    status: record.status,
    itemType: record.record_type || record.item_type,
    priority: record.priority,
    itemCode: record.item_code,
    assignedTo: record.assigned_to,
    isFlagged: record.is_flagged,
    claimConfirmed: record.claim_confirmed,
    claimConfirmedAt: record.claim_confirmed_at,
    ratings: Array.isArray(record.ratings)
      ? record.ratings.map((rating) => ({
          claimId: rating.claim_id || rating.claimId || "",
          rating: rating.rating,
          review: rating.review || "",
          claimantName: rating.claimant_name || rating.claimantName || "",
          reviewerEmail: rating.reviewer_email || rating.reviewerEmail || "",
          status: rating.review_status || rating.status || "pending",
          submittedAt: rating.review_submitted_at || rating.submittedAt || "",
          reviewedAt: rating.review_reviewed_at || rating.reviewedAt || "",
        }))
      : undefined,
  };

  if (!partial) {
    return {
      title: values.title || "",
      description: values.description || "",
      category: values.category || "",
      subcategory: values.subcategory || "",
      color: values.color || "",
      brand: values.brand || "",
      locationFound: values.locationFound || "",
      dateFound: values.dateFound || "",
      timeFound: values.timeFound || "",
      imageUrl: values.imageUrl || "",
      photoUrls: values.photoUrls || [],
      storageLocation: values.storageLocation || "",
      condition: values.condition || "",
      distinguishingFeatures: values.distinguishingFeatures || "",
      finderName: values.finderName || "",
      finderEmail: values.finderEmail || "",
      finderRole: values.finderRole || "",
      aiDescription: values.aiDescription || "",
      tags: values.tags || [],
      status: values.status || "pending_review",
      itemType: values.itemType || "found",
      priority: values.priority || "",
      itemCode: values.itemCode || "",
      assignedTo: values.assignedTo || "",
      isFlagged: Boolean(values.isFlagged),
      claimConfirmed: Boolean(values.claimConfirmed),
      claimConfirmedAt: values.claimConfirmedAt || "",
      ratings: values.ratings || [],
    };
  }

  return Object.fromEntries(
    Object.entries({
      title: hasAnyKey(record, ["title"]) ? values.title : undefined,
      description: hasAnyKey(record, ["description"]) ? values.description : undefined,
      category: hasAnyKey(record, ["category"]) ? values.category : undefined,
      subcategory: hasAnyKey(record, ["subcategory"]) ? values.subcategory : undefined,
      color: hasAnyKey(record, ["color"]) ? values.color : undefined,
      brand: hasAnyKey(record, ["brand"]) ? values.brand : undefined,
      locationFound: hasAnyKey(record, ["location_found", "locationFound"]) ? values.locationFound : undefined,
      dateFound: hasAnyKey(record, ["date_found", "dateFound"]) ? values.dateFound : undefined,
      timeFound: hasAnyKey(record, ["time_found", "timeFound"]) ? values.timeFound : undefined,
      imageUrl: hasAnyKey(record, ["imageUrl", "image_url", "photo_urls", "photoUrls"]) ? values.imageUrl : undefined,
      photoUrls: hasAnyKey(record, ["photo_urls", "photoUrls"]) ? values.photoUrls || [] : undefined,
      storageLocation: hasAnyKey(record, ["storage_location", "storageLocation"]) ? values.storageLocation : undefined,
      condition: hasAnyKey(record, ["condition"]) ? values.condition : undefined,
      distinguishingFeatures: hasAnyKey(record, ["distinguishing_features", "distinguishingFeatures"]) ? values.distinguishingFeatures : undefined,
      finderName: hasAnyKey(record, ["finder_name", "finderName"]) ? values.finderName : undefined,
      finderEmail: hasAnyKey(record, ["finder_email", "finderEmail"]) ? values.finderEmail : undefined,
      finderRole: hasAnyKey(record, ["finder_role", "finderRole"]) ? values.finderRole : undefined,
      aiDescription: hasAnyKey(record, ["ai_description", "aiDescription"]) ? values.aiDescription : undefined,
      tags: hasAnyKey(record, ["tags"]) ? values.tags || [] : undefined,
      status: hasAnyKey(record, ["status"]) ? values.status : undefined,
      itemType: hasAnyKey(record, ["record_type", "item_type", "itemType"]) ? values.itemType : undefined,
      priority: hasAnyKey(record, ["priority"]) ? values.priority : undefined,
      itemCode: hasAnyKey(record, ["item_code", "itemCode"]) ? values.itemCode : undefined,
      assignedTo: hasAnyKey(record, ["assigned_to", "assignedTo"]) ? values.assignedTo : undefined,
      isFlagged: hasAnyKey(record, ["is_flagged", "isFlagged"]) ? Boolean(values.isFlagged) : undefined,
      claimConfirmed: hasAnyKey(record, ["claim_confirmed", "claimConfirmed"]) ? Boolean(values.claimConfirmed) : undefined,
      claimConfirmedAt: hasAnyKey(record, ["claim_confirmed_at", "claimConfirmedAt"]) ? values.claimConfirmedAt : undefined,
      ratings: hasAnyKey(record, ["ratings"]) ? values.ratings || [] : undefined,
    }).filter(([, value]) => value !== undefined)
  );
}

function createFoundItemApi() {
  return {
    async list(sort, limit) {
      const records = await requestFoundItemsApi();
      const normalizedRecords = records.map((record) => normalizeFoundItem(record));
      return clone(limitRecords(sortRecords(normalizedRecords, sort), limit));
    },

    async filter(filters = {}, sort, limit) {
      const records = await requestFoundItemsApi();
      const filteredRecords = records
        .map((record) => normalizeFoundItem(record))
        .filter((record) => matchRecord(record, filters));

      return clone(limitRecords(sortRecords(filteredRecords, sort), limit));
    },

    async create(data) {
      const createdRecord = await requestFoundItemsApi("", {
        method: "POST",
        body: JSON.stringify(serializeFoundItem(data)),
      });

      return clone(normalizeFoundItem({ ...data, ...createdRecord }));
    },

    async update(id, updates) {
      const updatedRecord = await requestFoundItemsApi(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify(serializeFoundItem(updates, { partial: true })),
      });

      return clone(normalizeFoundItem(updatedRecord));
    },

    async delete(id) {
      const response = await requestFoundItemsApi(`/${id}`, {
        method: "DELETE",
      });

      return Boolean(response?.success);
    },

    async upsertRating(id, rating) {
      const updatedRecord = await requestFoundItemsApi(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          upsertRating: {
            claimId: rating.claim_id || rating.claimId || "",
            rating: rating.rating,
            review: rating.review || "",
            claimantName: rating.claimant_name || rating.claimantName || "",
            reviewerEmail: rating.reviewer_email || rating.reviewerEmail || "",
            status: rating.review_status || rating.status || "pending",
            submittedAt: rating.review_submitted_at || rating.submittedAt || "",
            reviewedAt: rating.review_reviewed_at || rating.reviewedAt || "",
          },
        }),
      });

      return clone(normalizeFoundItem(updatedRecord));
    },

    async removeRating(id, claimId) {
      const updatedRecord = await requestFoundItemsApi(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          removeRatingByClaimId: claimId,
        }),
      });

      return clone(normalizeFoundItem(updatedRecord));
    },
  };
}

async function uploadFileLocally({ file }) {
  if (typeof FileReader === "undefined") {
    return { file_url: "" };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ file_url: reader.result });
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function simpleTagResponse(prompt) {
  const tokens = tokenize(prompt)
    .filter((token) => token.length > 2)
    .filter((token) => !["generate", "descriptive", "search", "tags", "found", "item", "school", "system", "return", "short", "lowercase", "title", "description", "category"].includes(token));

  return {
    tags: [...new Set(tokens)].slice(0, 6),
  };
}

function simpleCleanupResponse(prompt) {
  const match = prompt.match(/Original description: "([\s\S]*)"/);
  const raw = match?.[1] || "";
  const cleaned = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

  return {
    cleaned_description: cleaned,
  };
}

function simpleSearchParse(prompt) {
  const queryMatch = prompt.match(/Query: "([\s\S]*)"/);
  const query = queryMatch?.[1] || "";
  const keywords = tokenize(query);
  const category = Object.entries(CATEGORY_LABELS).find(([, label]) => query.toLowerCase().includes(label))?.[0] || "";
  const color = ["black", "white", "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "gray", "silver", "gold"]
    .find((value) => query.toLowerCase().includes(value)) || "";

  return {
    keywords: [...new Set(keywords)].slice(0, 8),
    category,
    color,
    brand: "",
    location: "",
    date_hint: "",
  };
}

function simpleDuplicateResponse() {
  return {
    is_duplicate: false,
    duplicate_of_id: "",
    confidence: 12,
    reason: "Local mode uses lightweight duplicate detection heuristics.",
  };
}

function simpleClaimRiskResponse(prompt) {
  const detailPenalty = prompt.toLowerCase().includes("none provided") ? 22 : 0;
  const proofPenalty = prompt.toLowerCase().includes("has proof photo: no") ? 14 : 0;
  const risk = Math.min(85, 18 + detailPenalty + proofPenalty);
  const flags = [];

  if (detailPenalty) {
    flags.push("missing identifying details");
  }
  if (proofPenalty) {
    flags.push("no proof photo");
  }
  if (flags.length === 0) {
    flags.push("sufficient detail provided");
  }

  return {
    risk_score: risk,
    risk_flags: flags,
    summary: "Local demo risk analysis completed.",
  };
}

function simpleMatchResponse() {
  return { matches: [] };
}

function createInvokeLlmResponse(prompt) {
  if (prompt.includes("Generate 3-6 descriptive search tags")) {
    return simpleTagResponse(prompt);
  }
  if (prompt.includes("Rewrite this user-submitted item description")) {
    return simpleCleanupResponse(prompt);
  }
  if (prompt.includes("Parse this natural language search query")) {
    return simpleSearchParse(prompt);
  }
  if (prompt.includes("Check if this new found item submission might be a duplicate")) {
    return simpleDuplicateResponse();
  }
  if (prompt.includes("Evaluate the risk level of this lost-and-found claim")) {
    return simpleClaimRiskResponse(prompt);
  }
  if (prompt.includes("You are an AI matching engine")) {
    return simpleMatchResponse();
  }

  return {};
}

function emitAuthChange(event, user) {
  authListeners.forEach((listener) => {
    listener(event, { user });
  });
}

async function ensureLocalUserNotification(user) {
  if (!user?.email) {
    return;
  }

  const notifications = await appClient.entities.Notification.filter({ user_email: user.email }, "-created_date", 100);
  const alreadyExists = notifications.some(
    (notification) =>
      notification.user_email === user.email && notification.title === `Welcome to ${BRAND_NAME}`
  );

  if (alreadyExists) {
    return;
  }

  await addNotification({
    user_email: user.email,
    title: `Welcome to ${BRAND_NAME}`,
    message: "Your browser-only account is ready. Reports, claims, and notifications now follow this email on this device.",
    type: "system",
    link: "/UserDashboard",
  });

  await addAuditLog({
    action: "User signed in",
    entity_type: "user",
    entity_id: user.id,
    performed_by: user.email,
    details: "Local browser session started.",
  });
}

function normalizeAuthUser({ full_name, email }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(full_name || "").trim();

  if (!normalizedName) {
    throw new Error("Full name is required.");
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  return {
    full_name: normalizedName,
    email: normalizedEmail,
  };
}

async function getCurrentAuthUser() {
  const currentUser = readAuthUser();

  if (!currentUser?.email) {
    return null;
  }

  try {
    const canonicalUser = await requestAuthApi(`/user?email=${encodeURIComponent(currentUser.email)}`);
    if (canonicalUser) {
      writeAuthUser(canonicalUser);
      return clone(canonicalUser);
    }
  } catch {
    // Fall back to the local session cache if the backend lookup fails.
  }

  return clone(currentUser);
}

export function resetAppData() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
}

function createAppClient() {
  return {
    auth: {
      async me() {
        return getCurrentAuthUser();
      },
      async signIn(credentials) {
        const user = await requestAuthApi("/signin", {
          method: "POST",
          body: JSON.stringify(normalizeAuthUser(credentials)),
        });
        writeAuthUser(user);
        await ensureLocalUserNotification(user);
        emitAuthChange("SIGNED_IN", user);
        return clone(user);
      },
      async logout() {
        writeAuthUser(null);
        emitAuthChange("SIGNED_OUT", null);
        return null;
      },
      async redirectToLogin() {
        return null;
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
    },
    entities: {
      FoundItem: createFoundItemApi(),
      LostReport: createEntityApi("LostReport"),
      Claim: createEntityApi("Claim"),
      Notification: createEntityApi("Notification"),
      AuditLog: createEntityApi("AuditLog"),
    },
    integrations: {
      Core: {
        UploadFile: uploadFileLocally,
        async InvokeLLM({ prompt }) {
          return createInvokeLlmResponse(prompt);
        },
      },
    },
  };
}

export const appClient = createAppClient();
