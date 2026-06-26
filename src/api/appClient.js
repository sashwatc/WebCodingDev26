import { BRAND_NAME } from "@/lib/constants";
import { findMatches } from "@/lib/ai-services";
import { canonicalFoundItemStatus, isPublicFoundItemStatus } from "@/lib/found-items";
import {
  OAUTH_RETURN_PARAM,
  clearStoredAppwriteJwt,
  deleteCurrentSession as appwriteDeleteSession,
  getStoredAppwriteJwt,
  isAppwriteConfigured,
  loginWithEmailPassword as appwriteLoginEmailPassword,
  refreshJwtFromSession,
  registerWithEmailPassword as appwriteRegisterEmailPassword,
  startGoogleOAuth,
} from "@/lib/appwriteAuth";
import {
  AUTH_STORAGE_KEY,
  clearClientAuthStorage,
  isAdminRole,
  isStaffRole,
  shouldAttachDemoUserHeader,
} from "@/lib/auth-session";

const STORAGE_KEY = "findback-app-db-v2";
const API_BASE_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const FOUND_ITEMS_API_URL = `${API_BASE_URL}/api/items`;
const ADMIN_FOUND_ITEMS_API_URL = `${API_BASE_URL}/api/admin/items`;
const ENTITY_API_BASE_URL = `${API_BASE_URL}/api/entities`;
const AUTH_API_BASE_URL = `${API_BASE_URL}/api/auth`;
const UPLOAD_API_URL = `${API_BASE_URL}/api/uploads`;
const API_ROOT_URL = `${API_BASE_URL}/api`;
const BLACK_HYDRO_FLASK_PHOTO = "/items/black-hydro-flask.jpg";
const BLUE_BACKPACK_PHOTO = "/images/blue-backpack.png";
const AIRPODS_PRO_PHOTO = "/items/airpods-pro-case.png";
const TI_CALCULATOR_PHOTO = "/items/ti-calculator.png";
const NIKE_HOODIE_PHOTO = "/items/nike-hoodie.png";
const PVHS_LANYARD_PHOTO = "/items/pvhs-lanyard.png";
const USBC_CHARGER_PHOTO = "/items/usbc-charger.png";
const VOLLEYBALL_KNEEPADS_PHOTO = "/items/volleyball-kneepads.png";
const authListeners = new Set();
let recoveryMeshUsesLocalData = false;
const CORE_WORKFLOW_ENTITIES = new Set(["FoundItem", "LostReport", "Claim"]);

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
        description: "Matte black Hydro Flask bottle with a top carry handle and screw cap.",
        ai_description: "A matte black Hydro Flask water bottle with a top handle, screw cap, and white Hydro Flask logo.",
        color: "Black",
        brand: "Hydro Flask",
        date_found: "2026-03-11",
        time_found: "12:15",
        location_found: "Gymnasium",
        storage_location: "Main Office shelf B2",
        condition: "good",
        photo_urls: [BLACK_HYDRO_FLASK_PHOTO],
        distinguishing_features: "Large black bottle with white Hydro Flask logo, top handle, and black lid",
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
        photo_urls: [AIRPODS_PRO_PHOTO],
        distinguishing_features: "Small scratch near hinge",
        finder_name: "Library Desk",
        finder_email: "library@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["airpods", "apple", "earbuds", "white"],
        status: "approved",
        priority: "high",
        item_code: "FB-2026-AP91",
        event_hub_id: "hub_basketball_game",
        campus_zone_id: "zone_gym_bleachers",
        private_verification_clues: ["small scratch near the hinge", "silver initials inside the lid"],
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
        photo_urls: [BLUE_BACKPACK_PHOTO],
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
        photo_urls: [TI_CALCULATOR_PHOTO],
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
        photo_urls: [NIKE_HOODIE_PHOTO],
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
        photo_urls: [PVHS_LANYARD_PHOTO],
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
        photo_urls: [USBC_CHARGER_PHOTO],
        distinguishing_features: "Small silver label on cable tie",
        finder_name: "Technology Office",
        finder_email: "tech.office@pleasantvalley.edu",
        finder_role: "staff",
        tags: ["charger", "usb-c", "apple", "gray", "computer lab"],
        status: "approved",
        priority: "medium",
        item_code: "FB-2026-MC63",
        asset_tag: "PVHS-CB-1042",
        asset_record_id: "asset_cb_1042",
        department_destination: "Technology Office",
        restricted_visibility: true,
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
        photo_urls: [VOLLEYBALL_KNEEPADS_PHOTO],
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
        message: "This build can run with a hosted backend or local seeded data depending on deployment setup.",
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
        details: "Initialized sample records for browser fallback cache.",
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
    CampusZone: [
      { id: "zone_library", label: "Library Study Area", description: "Library tables and study shelves." },
      { id: "zone_gym_entrance", label: "Gym Entrance", description: "Gym lobby and ticket area." },
      { id: "zone_gym_bleachers", label: "Gym Bleachers", description: "Home and visitor bleacher rows." },
      { id: "zone_cafeteria", label: "Cafeteria", description: "Dining tables and tray return area." },
      { id: "zone_main_office", label: "Main Office", description: "Front desk intake and pickup." },
      { id: "zone_bus_loop", label: "Bus Loop", description: "After-school pickup curb." },
      { id: "zone_auditorium", label: "Auditorium", description: "Stage, seating, and rehearsal area." },
      { id: "zone_athletics", label: "Athletics Office", description: "Athletics office and equipment desk." },
    ],
    EventRecoveryHub: [
      {
        id: "hub_basketball_game",
        tenant_id: "pvhs",
        name: "PVHS vs. Bettendorf Basketball Game",
        description: "Demo integration-ready recovery hub for a high-traffic campus event.",
        event_type: "athletics",
        start_time: "2026-03-14T18:00:00Z",
        end_time: "2026-03-14T21:00:00Z",
        status: "active",
        campus_zone_ids: ["zone_gym_entrance", "zone_gym_bleachers", "zone_athletics"],
        public_enabled: true,
        display_enabled: true,
      },
    ],
    RecoveryCase: [
      {
        id: "case_airpods_game",
        case_code: "PVHS-RM-20260314-AIRP",
        tenant_id: "pvhs",
        lost_report_id: "lost_001",
        selected_found_item_id: "found_002",
        linked_claim_id: "claim_004",
        event_hub_id: "hub_basketball_game",
        campus_zone_id: "zone_gym_bleachers",
        status: "claim_in_review",
        priority: "high",
        assigned_to: "avery.patel@pleasantvalley.edu",
        summary: "Lost AirPods-style case during the basketball game.",
        recovery_plan: "Likely Recovery Zones\n1. Gym Bleachers - 86%\n2. Gym Entrance - 61%\n3. Main Office - 35%\n\nWhy:\n- Last seen near gym\n- Similar electronics were found nearby\n- Event workflow is active",
        likely_zone_summaries: ["Gym Bleachers - 86%", "Gym Entrance - 61%", "Main Office - 35%"],
        created_date: daysAgo(2),
        updated_date: daysAgo(1),
      },
    ],
    RecoveryMission: [
      {
        id: "mission_bleachers",
        recovery_case_id: "case_airpods_game",
        event_hub_id: "hub_basketball_game",
        campus_zone_id: "zone_gym_bleachers",
        zone_label: "Gym Bleachers",
        title: "Check Gym Bleachers",
        recommended_action: "Staff should check this zone and compare any found item with the lost report.",
        reasons: ["Last seen near gym", "Event workflow is active"],
        score: 86,
        priority: "high",
        status: "open",
      },
      {
        id: "mission_entrance",
        recovery_case_id: "case_airpods_game",
        event_hub_id: "hub_basketball_game",
        campus_zone_id: "zone_gym_entrance",
        zone_label: "Gym Entrance",
        title: "Check Gym Entrance",
        recommended_action: "Review items turned in near the gym entrance.",
        reasons: ["Similar electronics were found nearby"],
        score: 61,
        priority: "medium",
        status: "checked",
      },
    ],
    CustodyEvent: [
      { id: "custody_001", found_item_id: "found_002", sequence_number: 1, event_type: "intake_created", location: "Main Office drawer E1", notes: "Event item intake created.", created_date: daysAgo(3), event_hash: "demo-verified-1" },
      { id: "custody_002", found_item_id: "found_002", sequence_number: 2, event_type: "reviewed", location: "Main Office drawer E1", notes: "Proof Vault clues sealed.", created_date: daysAgo(3), event_hash: "demo-verified-2" },
      { id: "custody_003", found_item_id: "found_002", sequence_number: 3, event_type: "matched", location: "", notes: "Advisory match linked to lost report.", created_date: daysAgo(2), event_hash: "demo-verified-3" },
    ],
    ReturnPass: [
      {
        id: "pass_lanyard_active",
        claim_id: "claim_003",
        found_item_id: "found_006",
        claimant_email: "eli.thompson@pleasantvalley.edu",
        pickup_window: "Next school day during office hours",
        pickup_location: "PVHS Main Office pickup station",
        status: "active",
        one_time_code: "314159",
        expires_at: "2026-12-31T23:59:00Z",
      },
    ],
    PreventionAlert: [
      {
        id: "alert_gym_electronics",
        title: "Unusual increase detected",
        alert_type: "volume_spike",
        severity: "high",
        campus_zone_id: "zone_gym_bleachers",
        category: "electronics",
        baseline_count: 2,
        observed_count: 6,
        reasons: ["6 electronics reports near the gym within 90 minutes after Friday practice.", "Observed volume is at least 2x the recent baseline."],
        suggested_actions: ["Check bleachers and benches", "Create recovery mission", "Post reminder at gym exit"],
        status: "open",
      },
    ],
    AssetRegistryRecord: [
      { id: "asset_cb_1042", asset_tag: "PVHS-CB-1042", asset_type: "Chromebook", department_destination: "Technology Office", status: "active" },
      { id: "asset_book_8821", asset_tag: "LIB-BOOK-8821", asset_type: "Library Book", department_destination: "Library Return Desk", status: "active" },
      { id: "asset_cam_027", asset_tag: "ATH-CAM-027", asset_type: "Camera", department_destination: "Athletics Office", status: "active" },
      { id: "asset_band_008", asset_tag: "BAND-INST-008", asset_type: "Instrument", department_destination: "Fine Arts Office", status: "active" },
    ],
    RecoveryNode: [
      { id: "node_main_office", name: "PVHS Main Office", node_type: "demo_partner", status: "active" },
      { id: "node_athletics", name: "PVHS Athletics", node_type: "demo_partner", status: "active" },
      { id: "node_transportation", name: "PVHS Transportation", node_type: "demo_partner", status: "active" },
      { id: "node_fine_arts", name: "PVHS Fine Arts", node_type: "demo_partner", status: "active" },
    ],
    PartnerRelay: [
      {
        id: "relay_airpods_athletics",
        source_node_id: "node_main_office",
        target_node_id: "node_athletics",
        recovery_case_id: "case_airpods_game",
        status: "awaiting_verification",
        public_summary: "A possible match may be available at a partner location. Submit ownership evidence to continue.",
        redacted_match_reasons: ["Category and color overlap", "Event zone context overlaps"],
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

function mergeSeedCollection(existingRecords, seedRecords) {
  const records = Array.isArray(existingRecords) ? existingRecords : [];
  const seeds = Array.isArray(seedRecords) ? seedRecords : [];
  const existingIds = new Set(
    records
      .map((record) => record?.id || record?._id)
      .filter(Boolean)
      .map(String)
  );
  const missingSeeds = seeds.filter((record) => {
    const id = record?.id || record?._id;
    return id && !existingIds.has(String(id));
  });

  return {
    records: [...clone(records), ...clone(missingSeeds)],
    changed: !Array.isArray(existingRecords) || missingSeeds.length > 0,
  };
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
    const parsed = JSON.parse(raw);
    const seeded = createSeedData();
    const parsedDb = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    const merged = { ...parsedDb };
    let changed = parsedDb !== parsed;

    Object.entries(seeded).forEach(([key, seedRecords]) => {
      const result = mergeSeedCollection(parsedDb[key], seedRecords);
      merged[key] = result.records;
      changed = changed || result.changed;
    });

    if (changed) {
      storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
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

  const nextValue = JSON.stringify(db);
  if (storage.getItem(STORAGE_KEY) === nextValue) {
    return;
  }

  storage.setItem(STORAGE_KEY, nextValue);
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
    if (storage.getItem(AUTH_STORAGE_KEY) !== null) {
      storage.removeItem(AUTH_STORAGE_KEY);
    }
    return;
  }

  const nextValue = JSON.stringify(user);
  if (storage.getItem(AUTH_STORAGE_KEY) === nextValue) {
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, nextValue);
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

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const ENTITY_ID_PREFIXES = {
  LostReport: "lost",
  Claim: "claim",
  Notification: "notif",
  AuditLog: "audit",
  User: "user",
  FoundItem: "found",
};

function getRecordId(record = {}) {
  return record.id || record._id || "";
}

function shouldUseLocalFallback(error, { entityName } = {}) {
  // Non-HTTP errors (TypeError, network failure, unexpected API format) always fall back to local seed data
  if (!error?.status) {
    return true;
  }
  if (entityName && CORE_WORKFLOW_ENTITIES.has(entityName)) {
    return false;
  }
  return error.status === 404 || error.status >= 500;
}

function saveCachedRecord(entityName, id, updates) {
  const db = readDb();
  const records = db[entityName] || [];
  const index = records.findIndex((record) => getRecordId(record) === id);

  if (index === -1) {
    throw new Error(`${entityName} ${id} was not found.`);
  }

  const nextRecord = {
    ...records[index],
    ...clone(updates),
    updated_date: new Date().toISOString(),
  };

  records[index] = nextRecord;
  db[entityName] = records;
  writeDb(db);
  return clone(nextRecord);
}

function createCachedRecord(entityName, data) {
  const db = readDb();
  const now = new Date().toISOString();
  const prefix = ENTITY_ID_PREFIXES[entityName] || entityName.toLowerCase();
  const record = {
    id: data.id || createId(prefix),
    created_date: data.created_date || now,
    updated_date: data.updated_date || now,
    ...clone(data),
  };

  db[entityName] = [record, ...(db[entityName] || [])];
  writeDb(db);
  return clone(record);
}

function normalizeMatchSuggestion(match = {}) {
  if (typeof match === "string") {
    return {
      found_item_id: match,
      confidence: 0,
      reasons: [],
      source: "legacy_match",
      created_date: new Date().toISOString(),
    };
  }

  const foundItemId = match.found_item_id || match.foundItemId || "";
  if (!foundItemId) {
    return null;
  }

  return {
    found_item_id: foundItemId,
    confidence: Math.max(0, Math.min(100, Math.round(Number(match.confidence) || 0))),
    reasons: Array.isArray(match.reasons) ? [...new Set(match.reasons.filter(Boolean))] : [],
    source: match.source || "ai_suggestion",
    created_date: match.created_date || new Date().toISOString(),
  };
}

function mergeMatchSuggestions(currentMatches = [], nextMatches = []) {
  const byFoundItemId = new Map();

  for (const match of [...currentMatches, ...nextMatches]) {
    const normalized = normalizeMatchSuggestion(match);
    if (!normalized) {
      continue;
    }

    const existing = byFoundItemId.get(normalized.found_item_id);
    if (!existing || normalized.confidence >= existing.confidence) {
      byFoundItemId.set(normalized.found_item_id, {
        ...existing,
        ...normalized,
        reasons: [...new Set([...(existing?.reasons || []), ...(normalized.reasons || [])])],
      });
    }
  }

  return [...byFoundItemId.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

function normalizeLostReport(record = {}) {
  const photoUrls = Array.isArray(record.photo_urls)
    ? clone(record.photo_urls)
    : record.photo_url
      ? [record.photo_url]
      : [];

  return {
    ...record,
    id: record.id || record._id || "",
    title: record.title || record.item_type || "",
    item_type: record.item_type || record.title || "",
    description: record.description || "",
    category: record.category || "",
    color: record.color || "",
    brand: record.brand || "",
    last_seen_location: record.last_seen_location || record.location_lost || "",
    location_lost: record.location_lost || record.last_seen_location || "",
    date_lost: record.date_lost || record.dateLost || "",
    time_lost: record.time_lost || record.timeLost || "",
    contact_name: record.contact_name || record.contactName || "",
    contact_email: record.contact_email || record.contactEmail || "",
    contact_phone: record.contact_phone || record.contactPhone || "",
    student_id: record.student_id || record.studentId || "",
    urgency: record.urgency || "medium",
    status: record.status || "open",
    extra_notes: record.extra_notes || record.extraNotes || "",
    photo_url: record.photo_url || photoUrls[0] || "",
    photo_urls: photoUrls,
    event_hub_id: record.event_hub_id || record.eventHubId || "",
    campus_zone_id: record.campus_zone_id || record.campusZoneId || "",
    matched_items: Array.isArray(record.matched_items)
      ? record.matched_items.map((match) => normalizeMatchSuggestion(match)).filter(Boolean)
      : [],
    created_date: record.created_date || record.createdAt || "",
    updated_date: record.updated_date || record.updatedAt || "",
  };
}

function normalizeClaim(record = {}) {
  return {
    ...record,
    id: record.id || record._id || "",
    found_item_id: record.found_item_id || record.foundItemId || "",
    found_item_title: record.found_item_title || record.foundItemTitle || "",
    claimant_name: record.claimant_name || record.claimantName || "",
    claimant_email: record.claimant_email || record.claimantEmail || "",
    student_id: record.student_id || record.studentId || "",
    reason: record.reason || record.claim_reason || "",
    claim_reason: record.claim_reason || record.reason || "",
    identifying_details: record.identifying_details || record.identifyingDetails || "",
    proof_photo_url: record.proof_photo_url || record.proofPhotoUrl || "",
    pickup_availability: record.pickup_availability || record.pickupAvailability || "",
    status: record.status || "submitted",
    risk_score: record.risk_score ?? record.riskScore ?? null,
    risk_flags: Array.isArray(record.risk_flags) ? clone(record.risk_flags) : Array.isArray(record.riskFlags) ? clone(record.riskFlags) : [],
    admin_notes: record.admin_notes || record.adminNotes || "",
    reviewed_by: record.reviewed_by || record.reviewedBy || "",
    received_confirmed_at: record.received_confirmed_at || record.receivedConfirmedAt || "",
    review_status: record.review_status || record.reviewStatus || "",
    review_reviewed_at: record.review_reviewed_at || record.reviewReviewedAt || "",
    claimant_rating: record.claimant_rating ?? record.claimantRating ?? null,
    claimant_review: record.claimant_review || record.claimantReview || "",
    created_date: record.created_date || record.createdAt || "",
    updated_date: record.updated_date || record.updatedAt || "",
  };
}

function normalizeEntityRecords(entityName, records = []) {
  if (!Array.isArray(records)) {
    return [];
  }

  if (entityName === "LostReport") {
    return records.map((record) => normalizeLostReport(record));
  }

  if (entityName === "Claim") {
    return records.map((record) => normalizeClaim(record));
  }

  return clone(records);
}

function serializeLostReport(record = {}) {
  return Object.fromEntries(
    Object.entries({
      title: record.title || record.item_type,
      item_type: record.item_type || record.title,
      category: record.category,
      description: record.description,
      color: record.color,
      brand: record.brand,
      last_seen_location: record.last_seen_location || record.location_lost,
      location_lost: record.location_lost || record.last_seen_location,
      date_lost: record.date_lost,
      time_lost: record.time_lost,
      contact_name: record.contact_name,
      contact_email: record.contact_email,
      contact_phone: record.contact_phone,
      student_id: record.student_id,
      urgency: record.urgency,
      status: record.status,
      extra_notes: record.extra_notes,
      photo_url: record.photo_url,
      photo_urls: record.photo_urls,
      event_hub_id: record.event_hub_id,
      campus_zone_id: record.campus_zone_id,
      matched_items: record.matched_items,
    }).filter(([, value]) => value !== undefined)
  );
}

function serializeClaim(record = {}) {
  return Object.fromEntries(
    Object.entries({
      found_item_id: record.found_item_id,
      found_item_title: record.found_item_title,
      claimant_name: record.claimant_name,
      claimant_email: record.claimant_email,
      student_id: record.student_id,
      reason: record.reason,
      claim_reason: record.claim_reason || record.reason,
      identifying_details: record.identifying_details,
      proof_photo_url: record.proof_photo_url,
      pickup_availability: record.pickup_availability,
      status: record.status,
      risk_score: record.risk_score,
      risk_flags: record.risk_flags,
      admin_notes: record.admin_notes,
      review_status: record.review_status,
      review_reviewed_at: record.review_reviewed_at,
      claimant_rating: record.claimant_rating,
      claimant_review: record.claimant_review,
      received_confirmed_at: record.received_confirmed_at,
      private_evidence_responses: record.private_evidence_responses,
      evidence_checklist: record.evidence_checklist,
    }).filter(([, value]) => value !== undefined)
  );
}

async function fetchEntityRecords(entityName) {
  if (entityName === "LostReport" && isAdminUser()) {
    try {
      return await requestFeatureApi("/admin/lost-reports");
    } catch (error) {
      if (error?.status !== 401 && error?.status !== 403) {
        throw error;
      }
    }
  }

  if (entityName === "Claim" && isAdminUser()) {
    return requestFeatureApi("/admin/claims");
  }

  return requestEntityApi(entityName);
}

async function validateClaimRecord(claim, previousClaim = null) {
  if (!claim?.found_item_id) {
    throw new Error("Select a Found Item before submitting a claim.");
  }
  if (!String(claim.claimant_name || "").trim()) {
    throw new Error("Claimant name is required.");
  }
  if (!String(claim.claimant_email || "").trim()) {
    throw new Error("Claimant email is required.");
  }
  if (!String(claim.reason || "").trim()) {
    throw new Error("Ownership reason is required.");
  }

  const foundItems = await appClient.entities.FoundItem.filter({ id: claim.found_item_id });
  const foundItem = foundItems[0];
  if (!foundItem) {
    throw new Error("This claim must reference an existing Found Item.");
  }
  if (["returned", "archived"].includes(foundItem.status) && claim.status !== "completed") {
    throw new Error("This Found Item is no longer available for claim activity.");
  }

  if (!previousClaim && ["approved", "completed"].includes(claim.status)) {
    throw new Error("New claims must start in review.");
  }

  if (claim.status === "approved") {
    const existingClaims = await appClient.entities.Claim.filter({ found_item_id: claim.found_item_id });
    const alreadyApproved = existingClaims.find(
      (existingClaim) =>
        getRecordId(existingClaim) !== getRecordId(claim) &&
        ["approved", "completed"].includes(existingClaim.status)
    );

    if (alreadyApproved) {
      throw new Error("Another claim is already approved for this Found Item.");
    }
  }
}

async function applyClaimStatusSideEffects(claim, previousClaim = null) {
  if (!claim?.status || claim.status === previousClaim?.status || !claim.found_item_id) {
    return;
  }

  if (claim.status === "approved") {
    await appClient.entities.FoundItem.update(claim.found_item_id, { status: "claimed" });
    return;
  }

  if (claim.status === "completed") {
    const confirmedAt = claim.received_confirmed_at || new Date().toISOString();
    await appClient.entities.FoundItem.update(claim.found_item_id, {
      status: "returned",
      claim_confirmed: true,
      claim_confirmed_at: confirmedAt,
    });
    return;
  }

  if (claim.status === "rejected" && previousClaim?.status === "approved") {
    const siblingClaims = await appClient.entities.Claim.filter({ found_item_id: claim.found_item_id });
    const stillApproved = siblingClaims.some(
      (sibling) =>
        getRecordId(sibling) !== getRecordId(claim) &&
        ["approved", "completed"].includes(sibling.status)
    );

    if (!stillApproved) {
      await appClient.entities.FoundItem.update(claim.found_item_id, { status: "approved" });
    }
  }
}

async function syncMatchesForLostReport(report) {
  if (!report) {
    return report;
  }

  const reportId = getRecordId(report);
  try {
    const records = normalizeEntityRecords("LostReport", await fetchEntityRecords("LostReport"));
    const refreshed = records.find((entry) => entry.id === reportId);
    if (refreshed) {
      upsertCachedRecord("LostReport", refreshed);
      return clone(refreshed);
    }
  } catch {
    // Fall through to the create response.
  }

  return normalizeLostReport(report);
}

async function syncMatchesForFoundItem(foundItem) {
  if (!foundItem || ["returned", "archived"].includes(foundItem.status)) {
    return [];
  }

  const foundItemId = getRecordId(foundItem);
  const lostReports = await appClient.entities.LostReport.list("-created_date", 500);
  const updatedReports = [];

  for (const report of lostReports) {
    if (["resolved", "closed"].includes(report.status)) {
      continue;
    }

    const explicitMatch =
      report.id && report.id === foundItem.linked_lost_report_id
        ? {
            found_item_id: foundItemId,
            confidence: 100,
            reasons: ["finder response"],
            source: "finder_response",
          }
        : null;
    const aiMatches = await findMatches(report, [foundItem]);
    const matched_items = mergeMatchSuggestions(report.matched_items || [], [
      explicitMatch,
      ...aiMatches,
    ].filter(Boolean));

    if (JSON.stringify(matched_items) === JSON.stringify(report.matched_items || [])) {
      continue;
    }

    updatedReports.push(
      await appClient.entities.LostReport.update(report.id, {
        matched_items,
        status: "matched",
      })
    );
  }

  return updatedReports;
}

async function hasFoundItemReferences(foundItemId) {
  const [claims, lostReports] = await Promise.all([
    appClient.entities.Claim.filter({ found_item_id: foundItemId }),
    appClient.entities.LostReport.list("-created_date", 500),
  ]);

  return (
    claims.length > 0 ||
    lostReports.some((report) =>
      Array.isArray(report.matched_items) &&
      report.matched_items.some((match) => {
        const matchFoundItemId = typeof match === "string" ? match : (match?.found_item_id || match?.foundItemId);
        return matchFoundItemId === foundItemId;
      })
    )
  );
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
    (operation === "create" || operation === "update") &&
    record.matched_items?.length &&
    JSON.stringify(record.matched_items || []) !== JSON.stringify(previousRecord?.matched_items || [])
  ) {
    const newMatches = record.matched_items.filter(m => {
      const mid = typeof m === "string" ? m : (m?.found_item_id || m?.foundItemId);
      return !(previousRecord?.matched_items || []).some(pm => {
        const pmid = typeof pm === "string" ? pm : (pm?.found_item_id || pm?.foundItemId);
        return pmid === mid;
      });
    });
    const count = newMatches.length || record.matched_items.length;
    const bestMatch = record.matched_items[0];
    const bestMatchId = typeof bestMatch === "string" ? bestMatch : (bestMatch?.found_item_id || bestMatch?.foundItemId);
    await addNotification({
      user_email: record.contact_email,
      title: "Potential match found",
      message: `We found ${count} possible match${count > 1 ? "es" : ""} for your lost ${record.item_type || "item"}. Check your dashboard to review and claim.`,
      type: "match_found",
      link: "/UserDashboard?tab=reports",
      related_item_id: bestMatchId || null,
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
        const records = normalizeEntityRecords(entityName, await fetchEntityRecords(entityName));
        replaceCachedCollection(entityName, records);
        return clone(limitRecords(sortRecords(records, sort), limit));
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName })) {
          throw error;
        }

        const db = readDb();
        const records = db[entityName] || [];
        return clone(limitRecords(sortRecords(records, sort), limit));
      }
    },

    async filter(filters = {}, sort, limit) {
      try {
        const records = normalizeEntityRecords(entityName, await fetchEntityRecords(entityName));
        replaceCachedCollection(entityName, records);
        const filtered = records.filter((record) => matchRecord(record, filters));
        return clone(limitRecords(sortRecords(filtered, sort), limit));
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName })) {
          throw error;
        }

        const db = readDb();
        const records = (db[entityName] || []).filter((record) => matchRecord(record, filters));
        return clone(limitRecords(sortRecords(records, sort), limit));
      }
    },

    async create(data) {
      let nextData = clone(data);

      if (entityName === "Claim") {
        nextData = {
          status: "submitted",
          ...nextData,
        };
        await validateClaimRecord(nextData, null);
      }

      if (entityName === "LostReport") {
        nextData = {
          matched_items: [],
          status: "open",
          ...nextData,
        };
      }

      let record;
      let usedLocalFallback = false;
      const payload =
        entityName === "LostReport"
          ? serializeLostReport(nextData)
          : entityName === "Claim"
            ? serializeClaim(nextData)
            : nextData;

      try {
        record = await requestEntityApi(entityName, "", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName })) {
          throw error;
        }

        record = createCachedRecord(entityName, payload);
        usedLocalFallback = true;
      }

      const normalizedRecord =
        entityName === "LostReport"
          ? normalizeLostReport(record)
          : entityName === "Claim"
            ? normalizeClaim(record)
            : record;
      upsertCachedRecord(entityName, normalizedRecord);

      if (entityName === "LostReport") {
        const refreshed = await syncMatchesForLostReport(normalizedRecord);
        return clone(refreshed || normalizedRecord);
      }

      if (usedLocalFallback && entityName !== "LostReport") {
        await applyEntitySideEffects(entityName, "create", normalizedRecord, null);
      }

      if (usedLocalFallback && entityName === "Claim") {
        await applyClaimStatusSideEffects(normalizedRecord, null);
      }

      return clone(normalizedRecord);
    },

    async update(id, updates) {
      const records = await api.list();
      const previousRecord =
        records.find((record) => (record?.id || record?._id) === id) ||
        (readDb()[entityName] || []).find((record) => (record?.id || record?._id) === id) ||
        null;

      if (!previousRecord) {
        throw new Error(`${entityName} ${id} was not found.`);
      }

      const candidateRecord = {
        ...previousRecord,
        ...clone(updates),
        updated_date: new Date().toISOString(),
      };

      if (entityName === "Claim") {
        await validateClaimRecord(candidateRecord, previousRecord);
      }

      let nextRecord;
      let usedLocalFallback = false;
      const payload =
        entityName === "LostReport"
          ? serializeLostReport(updates)
          : entityName === "Claim"
            ? serializeClaim(updates)
            : updates;

      try {
        nextRecord = await requestEntityApi(entityName, `/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName })) {
          throw error;
        }

        nextRecord = saveCachedRecord(entityName, id, payload);
        usedLocalFallback = true;
      }

      const normalizedRecord =
        entityName === "LostReport"
          ? normalizeLostReport(nextRecord)
          : entityName === "Claim"
            ? normalizeClaim(nextRecord)
            : nextRecord;
      upsertCachedRecord(entityName, normalizedRecord);

      if (usedLocalFallback) {
        await applyEntitySideEffects(entityName, "update", normalizedRecord, previousRecord);
      }

      if (usedLocalFallback && entityName === "Claim") {
        await applyClaimStatusSideEffects(normalizedRecord, previousRecord);
      }

      return clone(normalizedRecord);
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
  const { headers = {}, body, ...fetchOptions } = options;
  const requestHeaders = {
    Accept: "application/json",
    ...appwriteAuthHeaders(),
    ...demoUserHeaders(),
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...fetchOptions,
    body,
    headers: requestHeaders,
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
    const error = new Error(payload?.error || payload?.message || "Failed to fetch items.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function requestFoundItemsApi(path = "", options = {}) {
  return requestApi(`${FOUND_ITEMS_API_URL}${path}`, options);
}

async function requestAdminFoundItemsApi(path = "", options = {}) {
  return requestApi(`${ADMIN_FOUND_ITEMS_API_URL}${path}`, options);
}

async function requestEntityApi(entityName, path = "", options = {}) {
  return requestApi(`${ENTITY_API_BASE_URL}/${encodeURIComponent(entityName)}${path}`, options);
}

async function requestAuthApi(path = "", options = {}) {
  return requestApi(`${AUTH_API_BASE_URL}${path}`, options);
}

function demoUserHeaders() {
  if (!shouldAttachDemoUserHeader()) {
    return {};
  }

  const user = readAuthUser();
  return user?.email ? { "X-Demo-User-Email": user.email } : {};
}

function appwriteAuthHeaders() {
  const jwt = getStoredAppwriteJwt();
  return jwt ? { "X-Appwrite-JWT": jwt } : {};
}

function isAdminUser(user = readAuthUser()) {
  return isAdminRole(user);
}

function isStaffOrAdminUser(user = readAuthUser()) {
  return isAdminRole(user) || isStaffRole(user);
}

async function requestRecoveryMeshApi(path = "", options = {}) {
  return requestFeatureApi(path, options);
}

async function requestFeatureApi(path = "", options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return requestApi(`${API_ROOT_URL}${normalizedPath}`, options);
}

function backendOwnedArrayFallback(error) {
  if (!shouldUseLocalFallback(error)) {
    throw error;
  }

  return [];
}

function backendOwnedNullFallback(error) {
  if (!shouldUseLocalFallback(error)) {
    throw error;
  }

  return null;
}

function backendOwnedObjectFallback(error, fallback = {}) {
  if (!shouldUseLocalFallback(error)) {
    throw error;
  }

  return fallback;
}

function localCollection(name) {
  return clone(readDb()[name] || []);
}

function shouldUseLocalRecoveryMesh() {
  return recoveryMeshUsesLocalData;
}

function useLocalRecoveryMesh() {
  recoveryMeshUsesLocalData = true;
}

function localCollectionWhenEmpty(records, name) {
  if (Array.isArray(records) && records.length > 0) {
    return clone(records);
  }

  const localRecords = localCollection(name);
  if (localRecords.length > 0) {
    useLocalRecoveryMesh();
    return localRecords;
  }

  return Array.isArray(records) ? clone(records) : localRecords;
}

function localRecordWhenMissing(record, name, predicate) {
  if (record) {
    return record;
  }

  const localRecord = localCollection(name).find(predicate) || null;
  if (localRecord) {
    useLocalRecoveryMesh();
  }

  return localRecord;
}

function localValueWhenMissing(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (Array.isArray(value) && value.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
    return fallback;
  }

  return value;
}

function saveLocalRecord(name, record) {
  upsertCachedRecord(name, record);
  return clone(record);
}

function createRecoveryMeshApi(featureClients = {}) {
  if (featureClients.recoveryCases) {
    return {
      campusZones: () => featureClients.campusZones.list(),
      eventHubs: () => featureClients.eventHubs.list(),
      eventHub: (id) => featureClients.eventHubs.get(id),
      displayFeed: (id) => featureClients.eventHubs.displayFeed(id),
      recoveryCases: () => featureClients.recoveryCases.list(),
      recoveryCaseByLostReport: (lostReportId) => featureClients.recoveryCases.byLostReport(lostReportId),
      refreshRecoveryCase: (lostReportId) => featureClients.recoveryCases.refreshByLostReport(lostReportId),
      missions: (recoveryCaseId) => featureClients.recoveryCases.missions(recoveryCaseId),
      updateMission: (id, updates) => featureClients.recoveryMissions.update(id, updates),
      proofVault: (itemId) => featureClients.proofVault.item(itemId),
      evidenceReview: (claimId) => featureClients.proofVault.evidenceReview(claimId),
      submitEvidenceReview: (claimId, review) => featureClients.proofVault.submitEvidenceReview(claimId, review),
      custodyEvents: (itemId) => featureClients.custody.events(itemId),
      verifyCustody: (itemId) => featureClients.custody.verify(itemId),
      moveItem: (itemId, move) => featureClients.custody.move(itemId, move),
      assetLookup: (tag) => featureClients.assets.lookup(tag),
      createReturnPass: (claimId, data) => featureClients.returnPasses.create(claimId, data),
      returnPass: (id) => featureClients.returnPasses.get(id),
      verifyReturnPass: (oneTimeCode) => featureClients.returnPasses.verify(oneTimeCode),
      redeemReturnPass: (id, oneTimeCode) => featureClients.returnPasses.redeem(id, oneTimeCode),
      sendReturnPassReminder: (id) => featureClients.returnPasses.reminder(id),
      sentinelAlerts: () => featureClients.sentinel.alerts(),
      recomputeSentinel: () => featureClients.sentinel.recompute(),
      updateSentinelAlert: (id, updates) => featureClients.sentinel.update(id, updates),
      recoveryNodes: () => featureClients.partnerRelay.nodes(),
      partnerRelays: () => featureClients.partnerRelay.relays(),
    };
  }

  return {
    async campusZones() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("CampusZone");
      }

      try {
        const records = await requestRecoveryMeshApi("/campus-zones");
        return localCollectionWhenEmpty(records, "CampusZone");
      } catch {
        return localCollection("CampusZone");
      }
    },
    async eventHubs() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("EventRecoveryHub").filter((hub) => hub.public_enabled);
      }

      try {
        const records = await requestRecoveryMeshApi("/event-hubs");
        return localCollectionWhenEmpty(records, "EventRecoveryHub").filter((hub) => hub.public_enabled);
      } catch {
        return localCollection("EventRecoveryHub").filter((hub) => hub.public_enabled);
      }
    },
    async eventHub(id) {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("EventRecoveryHub").find((hub) => hub.id === id) || null;
      }

      try {
        const record = await requestRecoveryMeshApi(`/event-hubs/${encodeURIComponent(id)}`);
        return localRecordWhenMissing(record, "EventRecoveryHub", (hub) => hub.id === id);
      } catch {
        return localCollection("EventRecoveryHub").find((hub) => hub.id === id) || null;
      }
    },
    async displayFeed(id) {
      const createLocalDisplayFeed = () => {
        const db = readDb();
        const eventHub = (db.EventRecoveryHub || []).find((hub) => hub.id === id);
        const zones = (db.CampusZone || []).filter((zone) => eventHub?.campus_zone_ids?.includes(zone.id));
        const foundItems = (db.FoundItem || [])
          .map((record) => normalizeFoundItem(record))
          .filter((item) => item.event_hub_id === id && isPublicFoundItem(item));
        return { event_hub: eventHub, zones, found_items: foundItems, notice: "Demo integration-ready event workflow. This does not claim connection to a live PVHS calendar or school display system." };
      };

      if (shouldUseLocalRecoveryMesh()) {
        return createLocalDisplayFeed();
      }

      try {
        const feed = await requestRecoveryMeshApi(`/event-hubs/${encodeURIComponent(id)}/display-feed`);
        const localFeed = createLocalDisplayFeed();
        return {
          ...localFeed,
          ...feed,
          event_hub: localValueWhenMissing(feed?.event_hub, localFeed.event_hub),
          zones: localValueWhenMissing(feed?.zones, localFeed.zones),
          found_items: localValueWhenMissing(feed?.found_items, localFeed.found_items),
        };
      } catch {
        return createLocalDisplayFeed();
      }
    },
    async recoveryCases() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("RecoveryCase");
      }

      try {
        const records = await requestRecoveryMeshApi("/recovery-cases");
        return localCollectionWhenEmpty(records, "RecoveryCase");
      } catch {
        return localCollection("RecoveryCase");
      }
    },
    async recoveryCaseByLostReport(lostReportId) {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("RecoveryCase").find((entry) => entry.lost_report_id === lostReportId) || null;
      }

      try {
        const record = await requestRecoveryMeshApi(`/recovery-cases/lost-reports/${encodeURIComponent(lostReportId)}`);
        return localRecordWhenMissing(record, "RecoveryCase", (entry) => entry.lost_report_id === lostReportId);
      } catch {
        return localCollection("RecoveryCase").find((entry) => entry.lost_report_id === lostReportId) || null;
      }
    },
    async refreshRecoveryCase(lostReportId) {
      try {
        return await requestRecoveryMeshApi(`/recovery-cases/lost-reports/${encodeURIComponent(lostReportId)}/refresh`, { method: "POST" });
      } catch {
        return this.recoveryCaseByLostReport(lostReportId);
      }
    },
    async missions(recoveryCaseId) {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("RecoveryMission").filter((mission) => mission.recovery_case_id === recoveryCaseId);
      }

      try {
        const records = await requestRecoveryMeshApi(`/recovery-cases/${encodeURIComponent(recoveryCaseId)}/missions`);
        const localMissions = localCollection("RecoveryMission").filter((mission) => mission.recovery_case_id === recoveryCaseId);
        return Array.isArray(records) && records.length > 0 ? clone(records) : localMissions;
      } catch {
        return localCollection("RecoveryMission").filter((mission) => mission.recovery_case_id === recoveryCaseId);
      }
    },
    async updateMission(id, updates) {
      try {
        return await requestRecoveryMeshApi(`/recovery-missions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(updates) });
      } catch {
        const current = localCollection("RecoveryMission").find((mission) => mission.id === id) || {};
        return saveLocalRecord("RecoveryMission", { ...current, ...updates, id });
      }
    },
    async proofVault(itemId) {
      const createLocalProofVault = () => {
        const item = localCollection("FoundItem")
          .map((record) => normalizeFoundItem(record))
          .find((record) => record.id === itemId);

        return item
          ? {
              found_item_id: item.id,
              private_verification_clues: item.private_verification_clues || [],
              asset_tag: item.asset_tag || "",
              department_destination: item.department_destination || "",
            }
          : null;
      };

      if (shouldUseLocalRecoveryMesh()) {
        return createLocalProofVault();
      }

      try {
        const record = await requestRecoveryMeshApi(`/items/${encodeURIComponent(itemId)}/proof-vault`);
        if (record) {
          return record;
        }
      } catch {
        // Fall through to the seeded/local proof vault.
      }

      useLocalRecoveryMesh();
      return createLocalProofVault();
    },
    async evidenceReview(claimId) {
      if (shouldUseLocalRecoveryMesh()) {
        return { claim_id: claimId, risk_score: 0, risk_flags: [], summary: "Evidence review is not available in local demo mode." };
      }

      try {
        return await requestRecoveryMeshApi(`/claims/${encodeURIComponent(claimId)}/evidence-review`);
      } catch {
        useLocalRecoveryMesh();
        return { claim_id: claimId, risk_score: 0, risk_flags: [], summary: "Evidence review is not available in local demo mode." };
      }
    },
    async submitEvidenceReview(claimId, review) {
      if (shouldUseLocalRecoveryMesh()) {
        return { claim_id: claimId, ...review };
      }

      try {
        return await requestRecoveryMeshApi(`/claims/${encodeURIComponent(claimId)}/evidence-review`, { method: "POST", body: JSON.stringify(review) });
      } catch {
        useLocalRecoveryMesh();
        return { claim_id: claimId, ...review };
      }
    },
    async custodyEvents(itemId) {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("CustodyEvent").filter((event) => event.found_item_id === itemId);
      }

      try {
        return await requestRecoveryMeshApi(`/custody/items/${encodeURIComponent(itemId)}`);
      } catch {
        useLocalRecoveryMesh();
        return localCollection("CustodyEvent").filter((event) => event.found_item_id === itemId);
      }
    },
    async verifyCustody(itemId) {
      if (shouldUseLocalRecoveryMesh()) {
        const events = localCollection("CustodyEvent").filter((event) => event.found_item_id === itemId);
        return { found_item_id: itemId, verified: true, event_count: events.length, issues: [] };
      }

      try {
        return await requestRecoveryMeshApi(`/custody/items/${encodeURIComponent(itemId)}/verify`);
      } catch {
        useLocalRecoveryMesh();
        const events = localCollection("CustodyEvent").filter((event) => event.found_item_id === itemId);
        return { found_item_id: itemId, verified: true, event_count: events.length, issues: [] };
      }
    },
    async moveItem(itemId, move) {
      if (shouldUseLocalRecoveryMesh()) {
        return saveLocalRecord("CustodyEvent", {
          id: createId("custody"),
          found_item_id: itemId,
          sequence_number: localCollection("CustodyEvent").filter((event) => event.found_item_id === itemId).length + 1,
          event_type: move?.event_type || "moved",
          location: move?.location || "",
          notes: move?.notes || "",
          created_date: new Date().toISOString(),
          event_hash: "demo-local-move",
        });
      }

      try {
        return await requestRecoveryMeshApi(`/custody/items/${encodeURIComponent(itemId)}/move`, { method: "POST", body: JSON.stringify(move) });
      } catch {
        useLocalRecoveryMesh();
        return saveLocalRecord("CustodyEvent", {
          id: createId("custody"),
          found_item_id: itemId,
          sequence_number: localCollection("CustodyEvent").filter((event) => event.found_item_id === itemId).length + 1,
          event_type: move?.event_type || "moved",
          location: move?.location || "",
          notes: move?.notes || "",
          created_date: new Date().toISOString(),
          event_hash: "demo-local-move",
        });
      }
    },
    async assetLookup(tag) {
      if (shouldUseLocalRecoveryMesh()) {
        const record = localCollection("AssetRegistryRecord").find((asset) => asset.asset_tag?.toLowerCase() === String(tag).toLowerCase());
        return record
          ? { recognized: true, asset_tag: record.asset_tag, asset_type: record.asset_type, message: "Recognized school-owned property. It will be routed to the appropriate department." }
          : { recognized: false, asset_tag: tag, asset_type: "", message: "Asset tag was not found in the seeded demo adapter." };
      }

      try {
        const result = await requestRecoveryMeshApi(`/assets/lookup?tag=${encodeURIComponent(tag)}`);
        if (result?.recognized) {
          return result;
        }
      } catch {
        useLocalRecoveryMesh();
      }

      const record = localCollection("AssetRegistryRecord").find((asset) => asset.asset_tag?.toLowerCase() === String(tag).toLowerCase());
      return record
        ? { recognized: true, asset_tag: record.asset_tag, asset_type: record.asset_type, message: "Recognized school-owned property. It will be routed to the appropriate department." }
        : { recognized: false, asset_tag: tag, asset_type: "", message: "Asset tag was not found in the seeded demo adapter." };
    },
    async createReturnPass(claimId, data) {
      if (shouldUseLocalRecoveryMesh()) {
        return saveLocalRecord("ReturnPass", {
          id: createId("pass"),
          claim_id: claimId,
          status: "active",
          one_time_code: String(Math.floor(100000 + Math.random() * 900000)),
          pickup_window: data?.pickup_window || "Next school day during office hours",
          pickup_location: data?.pickup_location || "PVHS Main Office pickup station",
          expires_at: data?.expires_at || "2026-12-31T23:59:00Z",
          ...data,
        });
      }

      try {
        return await requestRecoveryMeshApi(`/claims/${encodeURIComponent(claimId)}/return-pass`, { method: "POST", body: JSON.stringify(data) });
      } catch {
        useLocalRecoveryMesh();
        return saveLocalRecord("ReturnPass", {
          id: createId("pass"),
          claim_id: claimId,
          status: "active",
          one_time_code: String(Math.floor(100000 + Math.random() * 900000)),
          pickup_window: data?.pickup_window || "Next school day during office hours",
          pickup_location: data?.pickup_location || "PVHS Main Office pickup station",
          expires_at: data?.expires_at || "2026-12-31T23:59:00Z",
          ...data,
        });
      }
    },
    async returnPass(id) {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("ReturnPass").find((pass) => pass.id === id) || null;
      }

      try {
        return await requestRecoveryMeshApi(`/return-passes/${encodeURIComponent(id)}`);
      } catch {
        useLocalRecoveryMesh();
        return localCollection("ReturnPass").find((pass) => pass.id === id) || null;
      }
    },
    async verifyReturnPass(oneTimeCode) {
      if (shouldUseLocalRecoveryMesh()) {
        const pass = localCollection("ReturnPass").find((entry) => entry.one_time_code === oneTimeCode);
        return pass
          ? { valid: pass.status === "active", return_pass_id: pass.id, status: pass.status, found_item_id: pass.found_item_id, claim_id: pass.claim_id, message: pass.status === "active" ? "Return Pass is valid." : "Return Pass is not active." }
          : { valid: false, message: "Return Pass not found." };
      }

      try {
        return await requestRecoveryMeshApi("/return-passes/verify", { method: "POST", body: JSON.stringify({ one_time_code: oneTimeCode }) });
      } catch {
        useLocalRecoveryMesh();
        const pass = localCollection("ReturnPass").find((entry) => entry.one_time_code === oneTimeCode);
        return pass
          ? { valid: pass.status === "active", return_pass_id: pass.id, status: pass.status, found_item_id: pass.found_item_id, claim_id: pass.claim_id, message: pass.status === "active" ? "Return Pass is valid." : "Return Pass is not active." }
          : { valid: false, message: "Return Pass not found." };
      }
    },
    async redeemReturnPass(id, oneTimeCode) {
      if (shouldUseLocalRecoveryMesh()) {
        const current = localCollection("ReturnPass").find((pass) => pass.id === id) || {};
        return saveLocalRecord("ReturnPass", { ...current, status: "redeemed", redeemed_at: new Date().toISOString() });
      }

      try {
        return await requestRecoveryMeshApi(`/return-passes/${encodeURIComponent(id)}/redeem`, { method: "POST", body: JSON.stringify({ one_time_code: oneTimeCode }) });
      } catch {
        useLocalRecoveryMesh();
        const current = localCollection("ReturnPass").find((pass) => pass.id === id) || {};
        return saveLocalRecord("ReturnPass", { ...current, status: "redeemed", redeemed_at: new Date().toISOString() });
      }
    },
    async sentinelAlerts() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("PreventionAlert");
      }

      try {
        const records = await requestRecoveryMeshApi("/sentinel/alerts");
        return localCollectionWhenEmpty(records, "PreventionAlert");
      } catch {
        return localCollection("PreventionAlert");
      }
    },
    async recomputeSentinel() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("PreventionAlert");
      }

      try {
        const records = await requestRecoveryMeshApi("/sentinel/recompute", { method: "POST" });
        return localCollectionWhenEmpty(records, "PreventionAlert");
      } catch {
        return localCollection("PreventionAlert");
      }
    },
    async updateSentinelAlert(id, updates) {
      try {
        return await requestRecoveryMeshApi(`/sentinel/alerts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(updates) });
      } catch {
        const current = localCollection("PreventionAlert").find((alert) => alert.id === id) || {};
        return saveLocalRecord("PreventionAlert", { ...current, ...updates, id });
      }
    },
    async recoveryNodes() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("RecoveryNode");
      }

      try {
        const records = await requestRecoveryMeshApi("/recovery-nodes");
        return localCollectionWhenEmpty(records, "RecoveryNode");
      } catch {
        return localCollection("RecoveryNode");
      }
    },
    async partnerRelays() {
      if (shouldUseLocalRecoveryMesh()) {
        return localCollection("PartnerRelay");
      }

      try {
        const records = await requestRecoveryMeshApi("/partner-relays");
        return localCollectionWhenEmpty(records, "PartnerRelay");
      } catch {
        return localCollection("PartnerRelay");
      }
    },
  };
}

function createHealthApi() {
  return {
    async check() {
      try {
        return await requestFeatureApi("/health");
      } catch (error) {
        return backendOwnedObjectFallback(error, {
          status: "unavailable",
          backend_required: true,
        });
      }
    },
  };
}

function createClaimApi(baseApi) {
  const updateClaim = async (claimOrId, updates) => {
    const id = typeof claimOrId === "string" ? claimOrId : getRecordId(claimOrId);
    if (!id) {
      throw new Error("Claim ID is required.");
    }

    return baseApi.update(id, updates);
  };

  const requireAdmin = () => {
    // Claim moderation (approve/deny/request-more-info) is authorized for staff
    // OR admin on the backend (requireStaffOrAdmin); mirror that here so the
    // client guard doesn't block staff reviewers before the request is sent.
    if (!isStaffOrAdminUser()) {
      const error = new Error("Staff or admin access is required.");
      error.status = 403;
      throw error;
    }
  };

  return {
    ...baseApi,
    mine() {
      return requestFeatureApi("/claims/mine").then((records) =>
        Array.isArray(records) ? records.map(normalizeClaim) : []
      );
    },
    // Claimant withdraws their own pending claim (dedicated endpoint, not the
    // admin-only entity update path).
    cancel(claimOrId) {
      const id = typeof claimOrId === "string" ? claimOrId : getRecordId(claimOrId);
      if (!id) {
        throw new Error("Claim ID is required.");
      }
      return requestFeatureApi(`/claims/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
      }).then((record) => normalizeClaim(record));
    },
    // Claimant-authorized rating submission. Uses the dedicated endpoint so a
    // normal user does not hit the admin-only entity list (which 403s) via the
    // generic update path. The backend also records the rating on the FoundItem.
    submitRating(claimOrId, { rating, review } = {}) {
      const id = typeof claimOrId === "string" ? claimOrId : getRecordId(claimOrId);
      if (!id) {
        throw new Error("Claim ID is required.");
      }
      return requestFeatureApi(`/claims/${encodeURIComponent(id)}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating, review: String(review || "").trim() }),
      }).then((record) => normalizeClaim(record));
    },
    approve(claimOrId, data = {}) {
      const id = typeof claimOrId === "string" ? claimOrId : getRecordId(claimOrId);
      requireAdmin();
      return requestFeatureApi(`/admin/claims/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then((record) => normalizeClaim(record));
    },
    reject(claimOrId, data = {}) {
      const id = typeof claimOrId === "string" ? claimOrId : getRecordId(claimOrId);
      requireAdmin();
      return requestFeatureApi(`/admin/claims/${encodeURIComponent(id)}/deny`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then((record) => normalizeClaim(record));
    },
    async requestMoreInfo(claimOrId, data = {}) {
      const id = typeof claimOrId === "string" ? claimOrId : getRecordId(claimOrId);
      const message = String(data.message || data.body || data.admin_notes || "").trim();

      if (message) {
        try {
          await requestFeatureApi(`/admin/claims/${encodeURIComponent(id)}/request-more-info`, {
            method: "POST",
            body: JSON.stringify({
              message,
              admin_notes: data.admin_notes || message,
            }),
          });
        } catch (error) {
          if (!shouldUseLocalFallback(error, { entityName: "Claim" })) {
            throw error;
          }
        }
      }

      return updateClaim(claimOrId, {
        ...data,
        admin_notes: data.admin_notes || message || data.admin_notes,
        status: "need_more_info",
      });
    },
    markUnderReview(claimOrId, data = {}) {
      return updateClaim(claimOrId, { ...data, status: "under_review" });
    },
    complete(claimOrId, data = {}) {
      return updateClaim(claimOrId, {
        received_confirmed_at: data.received_confirmed_at || new Date().toISOString(),
        ...data,
        status: "completed",
      });
    },
    approveRating(claimOrId, data = {}) {
      return updateClaim(claimOrId, {
        review_reviewed_at: data.review_reviewed_at || new Date().toISOString(),
        ...data,
        review_status: "approved",
      });
    },
    rejectRating(claimOrId, data = {}) {
      return updateClaim(claimOrId, {
        review_reviewed_at: data.review_reviewed_at || new Date().toISOString(),
        ...data,
        review_status: "rejected",
      });
    },
    updateWorkflow(claimOrId, data = {}) {
      return updateClaim(claimOrId, data);
    },
  };
}

function createMatchApi() {
  const normalizeMatches = (records = []) =>
    Array.isArray(records) ? records.map((match) => normalizeMatchSuggestion(match)).filter(Boolean) : [];

  return {
    async forLostReport(id) {
      const records = await requestFeatureApi(`/matches/lost-reports/${encodeURIComponent(id)}`);
      return normalizeMatches(records);
    },
    async refreshLostReport(id) {
      const records = await requestFeatureApi(`/matches/lost-reports/${encodeURIComponent(id)}/refresh`, { method: "POST" });
      return normalizeMatches(records);
    },
    async refreshFoundItem(id) {
      const records = await requestFeatureApi(`/matches/found-items/${encodeURIComponent(id)}/refresh`, { method: "POST" });
      return normalizeMatches(records);
    },
    // Record an admin decision (confirmed | rejected | linked) on a single
    // lost-report match. Persists without recomputing matches.
    async decideForLostReport(reportId, foundItemId, decision) {
      return requestFeatureApi(
        `/admin/lost-reports/${encodeURIComponent(reportId)}/matches/${encodeURIComponent(foundItemId)}`,
        { method: "PATCH", body: JSON.stringify({ decision }) }
      );
    },
  };
}

function createRecoveryCenterApi() {
  return {
    async summary() {
      try {
        return await requestFeatureApi("/admin/recovery-center");
      } catch (error) {
        // The recovery-center summary is an optional aggregation; when the backend
        // doesn't expose it, fall back to null so the dashboard derives counts from
        // claims/lost-reports instead of surfacing a hard error banner.
        return backendOwnedNullFallback(error);
      }
    },
  };
}

function createRecoveryCaseApi() {
  return {
    async list() {
      try {
        return await requestFeatureApi("/recovery-cases");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async get(id) {
      try {
        return await requestFeatureApi(`/recovery-cases/${encodeURIComponent(id)}`);
      } catch (error) {
        return backendOwnedNullFallback(error);
      }
    },
    async byLostReport(lostReportId) {
      try {
        return await requestFeatureApi(`/recovery-cases/lost-reports/${encodeURIComponent(lostReportId)}`);
      } catch (error) {
        return backendOwnedNullFallback(error);
      }
    },
    async create(data = {}) {
      return requestFeatureApi("/admin/recovery-cases", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async createFromLostReport(lostReportId, data = {}) {
      return requestFeatureApi(`/admin/recovery-cases/lost-reports/${encodeURIComponent(lostReportId)}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async refreshByLostReport(lostReportId) {
      try {
        return await requestFeatureApi(`/recovery-cases/lost-reports/${encodeURIComponent(lostReportId)}/refresh`, {
          method: "POST",
        });
      } catch (error) {
        return backendOwnedNullFallback(error);
      }
    },
    update(id, updates = {}) {
      return requestFeatureApi(`/recovery-cases/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    assign(id, assignment = {}) {
      return requestFeatureApi(`/recovery-cases/${encodeURIComponent(id)}/assign`, {
        method: "POST",
        body: JSON.stringify(assignment),
      });
    },
    async missions(id) {
      try {
        return await requestFeatureApi(`/recovery-cases/${encodeURIComponent(id)}/missions`);
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    createMission(id, mission = {}) {
      return requestFeatureApi(`/recovery-cases/${encodeURIComponent(id)}/missions`, {
        method: "POST",
        body: JSON.stringify(mission),
      });
    },
  };
}

function createRecoveryMissionApi() {
  return {
    update(id, updates = {}) {
      return requestFeatureApi(`/recovery-missions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
  };
}

function normalizeEvidenceReview(record = {}, { includeVaultClues = false } = {}) {
  if (!record) {
    return null;
  }

  return {
    claim_id: record.claim_id || record.claimId || "",
    found_item_id: record.found_item_id || record.foundItemId || "",
    private_verification_clues: includeVaultClues
      ? clone(Array.isArray(record.private_verification_clues) ? record.private_verification_clues : [])
      : [],
    evidence_checklist: clone(Array.isArray(record.evidence_checklist) ? record.evidence_checklist : []),
    private_evidence_responses:
      record.private_evidence_responses && typeof record.private_evidence_responses === "object"
        ? clone(record.private_evidence_responses)
        : {},
    identifying_details: record.identifying_details || "",
    proof_photo_url: record.proof_photo_url || "",
    verification_score: record.verification_score ?? record.verificationScore ?? null,
    verification_flags: clone(Array.isArray(record.verification_flags) ? record.verification_flags : []),
    verification_summary: record.verification_summary || "",
  };
}

function normalizeCaseMessage(record = {}) {
  return {
    id: record.id || record._id || record.message_id || "",
    claim_id: record.claim_id || record.claimId || "",
    sender_role: String(record.sender_role || record.senderRole || "claimant").toLowerCase(),
    sender_email: record.sender_email || record.senderEmail || "",
    sender_name: record.sender_name || record.senderName || "",
    body: record.body || record.message || record.message_text || "",
    message_type: record.message_type || record.messageType || "claimant_reply",
    created_date: record.created_date || record.created_at || record.createdAt || "",
    read_by_claimant: Boolean(record.read_by_claimant ?? record.readByClaimant),
    read_by_admin: Boolean(record.read_by_admin ?? record.readByAdmin),
  };
}

function createProofVaultApi() {
  return {
    async item(itemId) {
      if (!isAdminUser()) {
        const error = new Error("Proof Vault access is restricted to staff.");
        error.status = 403;
        throw error;
      }

      return requestFeatureApi(`/items/${encodeURIComponent(itemId)}/proof-vault`);
    },
    async evidenceReview(claimId, { includeVaultClues = false } = {}) {
      const record = await requestFeatureApi(`/claims/${encodeURIComponent(claimId)}/evidence-review`);
      return normalizeEvidenceReview(record, { includeVaultClues: includeVaultClues && isAdminUser() });
    },
    async submitEvidenceReview(claimId, review = {}) {
      const record = await requestFeatureApi(`/claims/${encodeURIComponent(claimId)}/evidence-review`, {
        method: "POST",
        body: JSON.stringify(review),
      });
      return normalizeEvidenceReview(record, { includeVaultClues: true });
    },
  };
}

function createClaimCaseMessagesApi() {
  return {
    async list(claimId) {
      const records = await requestFeatureApi(`/claims/${encodeURIComponent(claimId)}/case-messages`);
      return Array.isArray(records) ? records.map((record) => normalizeCaseMessage(record)) : [];
    },
    async send(claimId, payload = {}) {
      // Backend expects `message` (see ClaimController POST /case-messages); it
      // derives sender_role from the authenticated caller, so message_type is
      // advisory only.
      const requestBody = {
        message: payload.body || payload.message || "",
        message_type: payload.message_type || payload.messageType,
      };
      const record = await requestFeatureApi(`/claims/${encodeURIComponent(claimId)}/case-messages`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return normalizeCaseMessage(record);
    },
    async requestMoreInfo(claimId, payload = {}) {
      const record = await requestFeatureApi(`/admin/claims/${encodeURIComponent(claimId)}/request-more-info`, {
        method: "POST",
        body: JSON.stringify({
          message: payload.message || payload.body || "",
          admin_notes: payload.admin_notes || payload.message || payload.body || "",
        }),
      });
      return normalizeCaseMessage(record);
    },
  };
}

function createReturnPassApi() {
  return {
    async create(claimId, data = {}) {
      const record = await requestFeatureApi(`/claims/${encodeURIComponent(claimId)}/return-pass`, {
        method: "POST",
        body: JSON.stringify({
          pickup_window: data.pickup_window || data.pickupWindow,
          pickup_location: data.pickup_location || data.pickupLocation,
        }),
      });
      return normalizeReturnPass(record);
    },
    async get(id) {
      try {
        const record = await requestFeatureApi(`/return-passes/${encodeURIComponent(id)}`);
        return normalizeReturnPass(record);
      } catch (error) {
        return backendOwnedNullFallback(error);
      }
    },
    async verify(oneTimeCode) {
      try {
        const record = await requestFeatureApi("/return-passes/verify", {
          method: "POST",
          body: JSON.stringify({ one_time_code: oneTimeCode }),
        });
        return normalizeReturnPassVerify(record);
      } catch (error) {
        return backendOwnedObjectFallback(error, {
          valid: false,
          message: "Return Pass verification is unavailable.",
          backend_required: true,
        });
      }
    },
    async redeem(id, oneTimeCode) {
      const record = await requestFeatureApi(`/return-passes/${encodeURIComponent(id)}/redeem`, {
        method: "POST",
        body: JSON.stringify({ one_time_code: oneTimeCode }),
      });
      return normalizeReturnPass(record);
    },
    async reminder(id) {
      const record = await requestFeatureApi(`/return-passes/${encodeURIComponent(id)}/reminder`, {
        method: "POST",
      });
      return normalizeReturnPass(record);
    },
  };
}

const DEFAULT_NOTIFICATION_PREFERENCES = {
  // Mirrors the backend NotificationPreferencesResponse (snake_case) so the
  // Settings UI reads the same keys whether the data is live or fallback.
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
  sms_opt_in: false,
  notification_categories: [],
};

function normalizeReturnPass(record = {}) {
  return {
    ...record,
    id: record.id || record._id || "",
    claim_id: record.claim_id || record.claimId || "",
    found_item_id: record.found_item_id || record.foundItemId || "",
    claimant_email: record.claimant_email || record.claimantEmail || "",
    pickup_window: record.pickup_window || record.pickupWindow || "",
    pickup_location: record.pickup_location || record.pickupLocation || "",
    status: record.status || "unknown",
    one_time_code: record.one_time_code || record.oneTimeCode || "",
    expires_at: record.expires_at || record.expiresAt || "",
    redeemed_at: record.redeemed_at || record.redeemedAt || "",
    redeemed_by: record.redeemed_by || record.redeemedBy || "",
    created_date: record.created_date || record.createdAt || "",
    updated_date: record.updated_date || record.updatedAt || "",
  };
}

function normalizeReturnPassVerify(record = {}) {
  return {
    valid: Boolean(record.valid),
    return_pass_id: record.return_pass_id || record.returnPassId || "",
    status: record.status || "",
    found_item_id: record.found_item_id || record.foundItemId || "",
    claim_id: record.claim_id || record.claimId || "",
    message: record.message || "",
    backend_required: Boolean(record.backend_required),
  };
}

function normalizeNotificationRecord(record = {}) {
  const message = record.message || record.body || record.safe_message_preview || record.preview || "";

  return {
    ...record,
    id: record.id || record._id || record.notification_id || "",
    title: record.title || record.event_title || record.event_type || "Notification",
    message,
    type: record.type || record.event_type || "",
    link: record.link || record.action_link || "",
    related_item_id: record.related_item_id || record.relatedItemId || "",
    is_read: Boolean(record.is_read ?? record.read),
    created_date: record.created_date || record.created_at || record.createdAt || "",
  };
}

function createRecoveryPulseApi() {
  return {
    async preferences() {
      try {
        return await requestFeatureApi("/recovery-pulse/preferences");
      } catch (error) {
        return backendOwnedObjectFallback(error, {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          backend_required: true,
        });
      }
    },
    updatePreferences(preferences = {}) {
      return requestFeatureApi("/recovery-pulse/preferences", {
        method: "PATCH",
        body: JSON.stringify(preferences),
      });
    },
    async notifications() {
      try {
        const records = await requestFeatureApi("/recovery-pulse/notifications");
        return Array.isArray(records) ? records.map((record) => normalizeNotificationRecord(record)) : [];
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async deliveries() {
      try {
        return await requestFeatureApi("/recovery-pulse/deliveries");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async adminDeliveries(channel = "") {
      try {
        const suffix = channel ? `?channel=${encodeURIComponent(channel)}` : "";
        return await requestFeatureApi(`/recovery-pulse/admin/deliveries${suffix}`);
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    testNotification(payload = {}) {
      return requestFeatureApi("/recovery-pulse/admin/test", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async markNotificationRead(id) {
      try {
        // Ownership-checked endpoint; the generic entity PATCH had no per-user guard.
        const record = normalizeNotificationRecord(
          await requestFeatureApi(`/recovery-pulse/notifications/${encodeURIComponent(id)}/read`, {
            method: "POST",
          }),
        );
        upsertCachedRecord("Notification", record);
        return clone(record);
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        try {
          return saveCachedRecord("Notification", id, { is_read: true });
        } catch {
          return { id, is_read: true, backend_required: true };
        }
      }
    },
  };
}

function createSentinelApi() {
  return {
    async alerts() {
      try {
        return await requestFeatureApi("/sentinel/alerts");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async recompute() {
      try {
        return await requestFeatureApi("/sentinel/recompute", { method: "POST" });
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    update(id, updates = {}) {
      return requestFeatureApi(`/sentinel/alerts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    acknowledge(id, payload = {}) {
      return requestFeatureApi(`/sentinel/alerts/${encodeURIComponent(id)}/acknowledge`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    dismiss(id, payload = {}) {
      return requestFeatureApi(`/sentinel/alerts/${encodeURIComponent(id)}/dismiss`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    resolve(id, payload = {}) {
      return requestFeatureApi(`/sentinel/alerts/${encodeURIComponent(id)}/resolve`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async sourceReports(id) {
      try {
        return await requestFeatureApi(`/sentinel/alerts/${encodeURIComponent(id)}/source-reports`);
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    mission(id, payload = {}) {
      return requestFeatureApi(`/sentinel/alerts/${encodeURIComponent(id)}/mission`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}

function createCustodyApi() {
  return {
    async events(foundItemId) {
      try {
        return await requestFeatureApi(`/custody/items/${encodeURIComponent(foundItemId)}`);
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async verify(foundItemId) {
      try {
        return await requestFeatureApi(`/custody/items/${encodeURIComponent(foundItemId)}/verify`);
      } catch (error) {
        return backendOwnedObjectFallback(error, {
          found_item_id: foundItemId,
          verified: false,
          issues: ["Custody verification is unavailable."],
          backend_required: true,
        });
      }
    },
    move(foundItemId, move = {}) {
      return requestFeatureApi(`/custody/items/${encodeURIComponent(foundItemId)}/move`, {
        method: "POST",
        body: JSON.stringify(move),
      });
    },
  };
}

function createCampusZoneApi() {
  return {
    async list() {
      try {
        return await requestFeatureApi("/campus-zones");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
  };
}

function createEventHubApi() {
  return {
    async list() {
      try {
        return await requestFeatureApi("/event-hubs");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async get(id) {
      try {
        return await requestFeatureApi(`/event-hubs/${encodeURIComponent(id)}`);
      } catch (error) {
        return backendOwnedNullFallback(error);
      }
    },
    async displayFeed(id) {
      try {
        return await requestFeatureApi(`/event-hubs/${encodeURIComponent(id)}/display-feed`);
      } catch (error) {
        return backendOwnedObjectFallback(error, {
          event_hub: null,
          zones: [],
          found_items: [],
          backend_required: true,
        });
      }
    },
    create(data = {}) {
      return requestFeatureApi("/admin/event-hubs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update(id, updates = {}) {
      return requestFeatureApi(`/admin/event-hubs/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    activate(id) {
      return requestFeatureApi(`/admin/event-hubs/${encodeURIComponent(id)}/activate`, { method: "POST" });
    },
    close(id) {
      return requestFeatureApi(`/admin/event-hubs/${encodeURIComponent(id)}/close`, { method: "POST" });
    },
  };
}

function createDemoScenarioApi() {
  return {
    create(scenario, data = {}) {
      return requestFeatureApi(`/admin/demo-scenarios/${encodeURIComponent(scenario)}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    cleanup(confirmation) {
      return requestFeatureApi("/admin/demo-scenarios/cleanup", {
        method: "POST",
        body: JSON.stringify({ confirmation }),
      });
    },
  };
}

function createAssetApi() {
  return {
    async lookup(tag) {
      try {
        return await requestFeatureApi(`/assets/lookup?tag=${encodeURIComponent(tag)}`);
      } catch (error) {
        return backendOwnedObjectFallback(error, {
          recognized: false,
          asset_tag: tag,
          asset_type: "",
          message: "Asset lookup is unavailable.",
          backend_required: true,
        });
      }
    },
  };
}

function createPartnerRelayApi() {
  return {
    async nodes() {
      try {
        return await requestFeatureApi("/recovery-nodes");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
    async relays() {
      try {
        return await requestFeatureApi("/partner-relays");
      } catch (error) {
        return backendOwnedArrayFallback(error);
      }
    },
  };
}

function createUploadApi() {
  return {
    file: uploadFile,
    UploadFile: uploadFile,
  };
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
    status: canonicalFoundItemStatus(record.status || "FOUND"),
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
    linked_lost_report_id: record.linked_lost_report_id || record.linkedLostReportId || "",
    claim_confirmed: Boolean(record.claim_confirmed ?? record.claimConfirmed),
    claim_confirmed_at: record.claim_confirmed_at || record.claimConfirmedAt || "",
    private_verification_clues: Array.isArray(record.private_verification_clues) ? clone(record.private_verification_clues) : [],
    restricted_visibility: Boolean(record.restricted_visibility ?? record.restrictedVisibility),
    asset_tag: record.asset_tag || record.assetTag || "",
    asset_record_id: record.asset_record_id || record.assetRecordId || "",
    department_destination: record.department_destination || record.departmentDestination || "",
    event_hub_id: record.event_hub_id || record.eventHubId || "",
    campus_zone_id: record.campus_zone_id || record.campusZoneId || "",
    ratings: Array.isArray(record.ratings) ? record.ratings.map((rating) => normalizeRating(rating)) : [],
  };
}

function isPublicFoundItem(record = {}) {
  return !record.restricted_visibility && isPublicFoundItemStatus(record.status);
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
    location_found: record.location_found ?? record.locationFound,
    date_found: record.date_found ?? record.dateFound,
    time_found: record.time_found ?? record.timeFound,
    photo_urls: Array.isArray(record.photo_urls)
      ? clone(record.photo_urls)
      : Array.isArray(record.photoUrls)
        ? clone(record.photoUrls)
        : record.imageUrl || record.image_url
          ? [record.imageUrl || record.image_url]
          : undefined,
    storage_location: record.storage_location ?? record.storageLocation,
    condition: record.condition,
    distinguishing_features: record.distinguishing_features ?? record.distinguishingFeatures,
    finder_name: record.finder_name ?? record.finderName,
    finder_email: record.finder_email ?? record.finderEmail,
    finder_role: record.finder_role ?? record.finderRole,
    ai_description: record.ai_description ?? record.aiDescription,
    tags: Array.isArray(record.tags) ? clone(record.tags) : undefined,
    status: record.status,
    record_type: record.record_type ?? record.item_type ?? record.itemType,
    priority: record.priority,
    item_code: record.item_code ?? record.itemCode,
    assigned_to: record.assigned_to ?? record.assignedTo,
    is_flagged: record.is_flagged ?? record.isFlagged,
    linked_lost_report_id: record.linked_lost_report_id ?? record.linkedLostReportId,
    claim_confirmed: record.claim_confirmed ?? record.claimConfirmed,
    claim_confirmed_at: record.claim_confirmed_at ?? record.claimConfirmedAt,
    private_verification_clues: Array.isArray(record.private_verification_clues)
      ? clone(record.private_verification_clues)
      : Array.isArray(record.privateVerificationClues)
        ? clone(record.privateVerificationClues)
        : undefined,
    restricted_visibility: record.restricted_visibility ?? record.restrictedVisibility,
    asset_tag: record.asset_tag ?? record.assetTag,
    asset_record_id: record.asset_record_id ?? record.assetRecordId,
    department_destination: record.department_destination ?? record.departmentDestination,
    event_hub_id: record.event_hub_id ?? record.eventHubId,
    campus_zone_id: record.campus_zone_id ?? record.campusZoneId,
    ratings: Array.isArray(record.ratings)
      ? record.ratings.map((rating) => ({
          claim_id: rating.claim_id || rating.claimId || "",
          rating: rating.rating,
          review: rating.review || "",
          claimant_name: rating.claimant_name || rating.claimantName || "",
          reviewer_email: rating.reviewer_email || rating.reviewerEmail || "",
          review_status: rating.review_status || rating.status || "pending",
          review_submitted_at: rating.review_submitted_at || rating.submittedAt || "",
          review_reviewed_at: rating.review_reviewed_at || rating.reviewedAt || "",
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
      location_found: values.location_found || "",
      date_found: values.date_found || "",
      time_found: values.time_found || "",
      photo_urls: values.photo_urls || [],
      storage_location: values.storage_location || "",
      condition: values.condition || "",
      distinguishing_features: values.distinguishing_features || "",
      finder_name: values.finder_name || "",
      finder_email: values.finder_email || "",
      finder_role: values.finder_role || "",
      ai_description: values.ai_description || "",
      tags: values.tags || [],
      status: values.status || "pending_review",
      record_type: values.record_type || "found",
      priority: values.priority || "",
      item_code: values.item_code || "",
      assigned_to: values.assigned_to || "",
      is_flagged: Boolean(values.is_flagged),
      linked_lost_report_id: values.linked_lost_report_id || "",
      claim_confirmed: Boolean(values.claim_confirmed),
      claim_confirmed_at: values.claim_confirmed_at || "",
      private_verification_clues: values.private_verification_clues || [],
      restricted_visibility: Boolean(values.restricted_visibility),
      asset_tag: values.asset_tag || "",
      asset_record_id: values.asset_record_id || "",
      department_destination: values.department_destination || "",
      event_hub_id: values.event_hub_id || "",
      campus_zone_id: values.campus_zone_id || "",
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
      location_found: hasAnyKey(record, ["location_found", "locationFound"]) ? values.location_found : undefined,
      date_found: hasAnyKey(record, ["date_found", "dateFound"]) ? values.date_found : undefined,
      time_found: hasAnyKey(record, ["time_found", "timeFound"]) ? values.time_found : undefined,
      photo_urls: hasAnyKey(record, ["photo_urls", "photoUrls", "imageUrl", "image_url"]) ? values.photo_urls || [] : undefined,
      storage_location: hasAnyKey(record, ["storage_location", "storageLocation"]) ? values.storage_location : undefined,
      condition: hasAnyKey(record, ["condition"]) ? values.condition : undefined,
      distinguishing_features: hasAnyKey(record, ["distinguishing_features", "distinguishingFeatures"]) ? values.distinguishing_features : undefined,
      finder_name: hasAnyKey(record, ["finder_name", "finderName"]) ? values.finder_name : undefined,
      finder_email: hasAnyKey(record, ["finder_email", "finderEmail"]) ? values.finder_email : undefined,
      finder_role: hasAnyKey(record, ["finder_role", "finderRole"]) ? values.finder_role : undefined,
      ai_description: hasAnyKey(record, ["ai_description", "aiDescription"]) ? values.ai_description : undefined,
      tags: hasAnyKey(record, ["tags"]) ? values.tags || [] : undefined,
      status: hasAnyKey(record, ["status"]) ? values.status : undefined,
      record_type: hasAnyKey(record, ["record_type", "item_type", "itemType"]) ? values.record_type : undefined,
      priority: hasAnyKey(record, ["priority"]) ? values.priority : undefined,
      item_code: hasAnyKey(record, ["item_code", "itemCode"]) ? values.item_code : undefined,
      assigned_to: hasAnyKey(record, ["assigned_to", "assignedTo"]) ? values.assigned_to : undefined,
      is_flagged: hasAnyKey(record, ["is_flagged", "isFlagged"]) ? Boolean(values.is_flagged) : undefined,
      linked_lost_report_id: hasAnyKey(record, ["linked_lost_report_id", "linkedLostReportId"]) ? values.linked_lost_report_id : undefined,
      claim_confirmed: hasAnyKey(record, ["claim_confirmed", "claimConfirmed"]) ? Boolean(values.claim_confirmed) : undefined,
      claim_confirmed_at: hasAnyKey(record, ["claim_confirmed_at", "claimConfirmedAt"]) ? values.claim_confirmed_at : undefined,
      private_verification_clues: hasAnyKey(record, ["private_verification_clues", "privateVerificationClues"]) ? values.private_verification_clues || [] : undefined,
      restricted_visibility: hasAnyKey(record, ["restricted_visibility", "restrictedVisibility"]) ? Boolean(values.restricted_visibility) : undefined,
      asset_tag: hasAnyKey(record, ["asset_tag", "assetTag"]) ? values.asset_tag : undefined,
      asset_record_id: hasAnyKey(record, ["asset_record_id", "assetRecordId"]) ? values.asset_record_id : undefined,
      department_destination: hasAnyKey(record, ["department_destination", "departmentDestination"]) ? values.department_destination : undefined,
      event_hub_id: hasAnyKey(record, ["event_hub_id", "eventHubId"]) ? values.event_hub_id : undefined,
      campus_zone_id: hasAnyKey(record, ["campus_zone_id", "campusZoneId"]) ? values.campus_zone_id : undefined,
      ratings: hasAnyKey(record, ["ratings"]) ? values.ratings || [] : undefined,
    }).filter(([, value]) => value !== undefined)
  );
}

function createFoundItemApi() {
  return {
    async get(id) {
      const adminUser = isAdminUser();

      try {
        let record;
        if (adminUser) {
          const records = await requestAdminFoundItemsApi();
          record = Array.isArray(records) ? records.find((entry) => entry.id === id) : null;
        } else {
          record = await requestFoundItemsApi(`/${encodeURIComponent(id)}`);
        }

        if (!record) {
          return null;
        }

        const normalizedRecord = normalizeFoundItem(record);
        if (!adminUser && !isPublicFoundItem(normalizedRecord)) {
          return null;
        }

        upsertCachedRecord("FoundItem", normalizedRecord);
        return clone(normalizedRecord);
      } catch (error) {
        if (error?.status === 404) {
          return null;
        }

        if (!shouldUseLocalFallback(error, { entityName: "FoundItem" })) {
          throw error;
        }

        const db = readDb();
        const record = (db.FoundItem || [])
          .map((entry) => normalizeFoundItem(entry))
          .find((entry) => entry.id === id && (adminUser || isPublicFoundItem(entry)));
        return record ? clone(record) : null;
      }
    },

    async list(sort, limit) {
      const adminUser = isAdminUser();
      try {
        const records = adminUser ? await requestAdminFoundItemsApi() : await requestFoundItemsApi();
        const normalizedRecords = records.map((record) => normalizeFoundItem(record));
        replaceCachedCollection("FoundItem", normalizedRecords);
        const visibleRecords = adminUser ? normalizedRecords : normalizedRecords.filter(isPublicFoundItem);
        return clone(limitRecords(sortRecords(visibleRecords, sort), limit));
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName: "FoundItem" })) {
          throw error;
        }

        const records = (readDb().FoundItem || [])
          .map((record) => normalizeFoundItem(record))
          .filter((record) => adminUser || isPublicFoundItem(record));
        return clone(limitRecords(sortRecords(records, sort), limit));
      }
    },

    async filter(filters = {}, sort, limit) {
      const adminUser = isAdminUser();
      if (filters?.id && !sort && !limit) {
        const record = await this.get(filters.id);
        return record ? [record] : [];
      }

      try {
        const records = adminUser ? await requestAdminFoundItemsApi() : await requestFoundItemsApi();
        const normalizedRecords = records.map((record) => normalizeFoundItem(record));
        replaceCachedCollection("FoundItem", normalizedRecords);
        const visibleRecords = adminUser ? normalizedRecords : normalizedRecords.filter(isPublicFoundItem);
        const filteredRecords = visibleRecords.filter((record) => matchRecord(record, filters));
        return clone(limitRecords(sortRecords(filteredRecords, sort), limit));
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName: "FoundItem" })) {
          throw error;
        }

        const db = readDb();
        const filteredRecords = (db.FoundItem || [])
          .map((record) => normalizeFoundItem(record))
          .filter((record) => adminUser || isPublicFoundItem(record))
          .filter((record) => matchRecord(record, filters));
        return clone(limitRecords(sortRecords(filteredRecords, sort), limit));
      }
    },

    async create(data) {
      const payload = {
        ...data,
        record_type: "found",
      };
      let createdRecord;

      try {
        createdRecord = await requestFoundItemsApi("", {
          method: "POST",
          body: JSON.stringify(serializeFoundItem(payload)),
        });
      } catch (error) {
        if (!shouldUseLocalFallback(error, { entityName: "FoundItem" })) {
          throw error;
        }

        createdRecord = createCachedRecord("FoundItem", serializeFoundItem(payload));
      }

      const normalizedRecord = normalizeFoundItem({ ...payload, ...createdRecord });
      upsertCachedRecord("FoundItem", normalizedRecord);
      try {
        await requestFeatureApi(`/matches/found-items/${encodeURIComponent(normalizedRecord.id)}/refresh`, { method: "POST" });
      } catch {
        // Match refresh is advisory; intake should still succeed.
      }
      return clone(normalizedRecord);
    },

    async update(id, updates) {
      let updatedRecord;

      try {
        updatedRecord = await requestFoundItemsApi(`/${id}`, {
          method: "PATCH",
          body: JSON.stringify(serializeFoundItem(updates, { partial: true })),
        });
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        updatedRecord = saveCachedRecord("FoundItem", id, serializeFoundItem(updates, { partial: true }));
      }

      const normalizedRecord = normalizeFoundItem(updatedRecord);
      upsertCachedRecord("FoundItem", normalizedRecord);
      await syncMatchesForFoundItem(normalizedRecord);
      return clone(normalizedRecord);
    },

    async delete(id) {
      if (await hasFoundItemReferences(id)) {
        const archivedRecord = await this.update(id, { status: "archived" });
        return { success: Boolean(archivedRecord), archived: true };
      }

      try {
        const response = await requestFoundItemsApi(`/${id}`, {
          method: "DELETE",
        });

        if (response?.archived && response.item) {
          upsertCachedRecord("FoundItem", normalizeFoundItem(response.item));
          return { success: true, archived: true };
        }

        removeCachedRecord("FoundItem", id);
        return { success: Boolean(response?.success), archived: false };
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        removeCachedRecord("FoundItem", id);
        return { success: true, archived: false };
      }
    },

    async upsertRating(id, rating) {
      const normalizedRating = {
        claim_id: rating.claim_id || rating.claimId || "",
        rating: rating.rating,
        review: rating.review || "",
        claimant_name: rating.claimant_name || rating.claimantName || "",
        reviewer_email: rating.reviewer_email || rating.reviewerEmail || "",
        review_status: rating.review_status || rating.status || "pending",
        review_submitted_at: rating.review_submitted_at || rating.submittedAt || "",
        review_reviewed_at: rating.review_reviewed_at || rating.reviewedAt || "",
      };
      let updatedRecord;

      try {
        updatedRecord = await requestFoundItemsApi(`/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            upsert_rating: normalizedRating,
          }),
        });
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        const existingRecords = await this.filter({ id });
        const existingRecord = existingRecords[0];
        if (!existingRecord) {
          throw new Error(`FoundItem ${id} was not found.`);
        }

        const ratings = [...(existingRecord.ratings || [])];
        const ratingIndex = ratings.findIndex((entry) => entry.claim_id === normalizedRating.claim_id);
        if (ratingIndex >= 0) {
          ratings[ratingIndex] = normalizedRating;
        } else {
          ratings.push(normalizedRating);
        }

        updatedRecord = saveCachedRecord("FoundItem", id, { ratings });
      }

      const normalizedRecord = normalizeFoundItem(updatedRecord);
      upsertCachedRecord("FoundItem", normalizedRecord);
      return clone(normalizedRecord);
    },

    async removeRating(id, claimId) {
      let updatedRecord;

      try {
        updatedRecord = await requestFoundItemsApi(`/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            remove_rating_by_claim_id: claimId,
          }),
        });
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        const existingRecords = await this.filter({ id });
        const existingRecord = existingRecords[0];
        if (!existingRecord) {
          throw new Error(`FoundItem ${id} was not found.`);
        }

        updatedRecord = saveCachedRecord("FoundItem", id, {
          ratings: (existingRecord.ratings || []).filter((rating) => rating.claim_id !== claimId),
        });
      }

      const normalizedRecord = normalizeFoundItem(updatedRecord);
      upsertCachedRecord("FoundItem", normalizedRecord);
      return clone(normalizedRecord);
    },
  };
}

async function readFileAsDataUrl(file) {
  if (typeof FileReader === "undefined") {
    return "";
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function uploadFile({ file }) {
  const dataUrl = await readFileAsDataUrl(file);

  if (!dataUrl) {
    return { file_url: "" };
  }

  try {
    return await requestApi(UPLOAD_API_URL, {
      method: "POST",
      body: JSON.stringify({
        file_name: file?.name || "upload",
        content_type: file?.type || "",
        data_url: dataUrl,
      }),
    });
  } catch {
    return { file_url: dataUrl };
  }
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

function createAiAssistanceApi() {
  return {
    suggestFoundItemFields(payload = {}) {
      return requestFeatureApi("/ai-assistance/found-item", {
        method: "POST",
        body: JSON.stringify({
          title: payload.title || "",
          description: payload.description || "",
          file_name: payload.file_name || "",
          photo_urls: Array.isArray(payload.photo_urls) ? payload.photo_urls.slice(0, 1) : [],
        }),
      });
    },
    parseSearchQuery(query = "") {
      return requestFeatureApi("/ai-assistance/search", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
    },
  };
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
    message: "Your account is ready. Reports, claims, and notifications now follow this email in the app data store.",
    type: "system",
    link: "/UserDashboard",
  });

  await addAuditLog({
    action: "User signed in",
    entity_type: "user",
    entity_id: user.id,
    performed_by: user.email,
    details: "Application session started.",
  });
}

function normalizeAuthUser(user = {}) {
  const normalizedEmail = String(user.email || "").trim().toLowerCase();
  const normalizedName = String(user.full_name || user.fullName || "").trim();

  if (!normalizedName) {
    throw new Error("Full name is required.");
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  return {
    id: user.id || "",
    full_name: normalizedName,
    email: normalizedEmail,
    role: String(user.role || "student").toLowerCase(),
    phone_number: user.phone_number || user.phoneNumber || null,
    email_notifications_enabled: user.email_notifications_enabled ?? user.emailNotificationsEnabled ?? true,
    sms_opt_in: user.sms_opt_in ?? user.smsOptIn ?? false,
    sms_notifications_enabled: user.sms_notifications_enabled ?? user.smsNotificationsEnabled ?? false,
    webhook_notifications_enabled: user.webhook_notifications_enabled ?? user.webhookNotificationsEnabled ?? true,
    notification_categories: user.notification_categories || user.notificationCategories || [],
  };
}

// Resolves the signed-in user from a verified Appwrite session via the backend.
// The backend is the source of truth for identity and role.
async function getVerifiedAuthUser() {
  try {
    const canonicalUser = await requestAuthApi("/me");
    if (!canonicalUser) {
      clearStoredAppwriteJwt();
      writeAuthUser(null);
      return null;
    }
    const normalizedUser = normalizeAuthUser(canonicalUser);
    writeAuthUser(normalizedUser);
    return clone(normalizedUser);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      clearStoredAppwriteJwt();
      writeAuthUser(null);
    }
    return null;
  }
}

async function getCurrentAuthUser() {
  const currentUser = readAuthUser();

  if (!currentUser?.email) {
    return null;
  }

  try {
    const canonicalUser = await requestAuthApi(`/user?email=${encodeURIComponent(currentUser.email)}`);
    if (canonicalUser === null) {
      writeAuthUser(null);
      return null;
    }

    if (canonicalUser) {
      const normalizedUser = normalizeAuthUser(canonicalUser);
      writeAuthUser(normalizedUser);
      return clone(normalizedUser);
    }
  } catch {
    writeAuthUser(null);
    return null;
  }

  return null;
}

export function resetAppData() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
}

function createAppClient() {
  const foundItemApi = createFoundItemApi();
  const lostReportApi = createEntityApi("LostReport");
  const claimApi = createClaimApi(createEntityApi("Claim"));
  const notificationEntityApi = createEntityApi("Notification");
  const auditLogApi = createEntityApi("AuditLog");
  const featureClients = {
    health: createHealthApi(),
    matches: createMatchApi(),
    uploads: createUploadApi(),
    recoveryCenter: createRecoveryCenterApi(),
    recoveryCases: createRecoveryCaseApi(),
    recoveryMissions: createRecoveryMissionApi(),
    proofVault: createProofVaultApi(),
    claimCaseMessages: createClaimCaseMessagesApi(),
    returnPasses: createReturnPassApi(),
    recoveryPulse: createRecoveryPulseApi(),
    sentinel: createSentinelApi(),
    custody: createCustodyApi(),
    campusZones: createCampusZoneApi(),
    eventHubs: createEventHubApi(),
    demoScenarios: createDemoScenarioApi(),
    assets: createAssetApi(),
    partnerRelay: createPartnerRelayApi(),
    aiAssistance: createAiAssistanceApi(),
  };

  return {
    auth: {
      isAppwriteEnabled() {
        return isAppwriteConfigured();
      },
      async me() {
        if (isAppwriteConfigured() && getStoredAppwriteJwt()) {
          return getVerifiedAuthUser();
        }
        return getCurrentAuthUser();
      },
      async signIn(credentials) {
        // Appwrite email/password path: authenticate with Appwrite, then let the
        // backend resolve identity from the verified JWT. No password is sent to us.
        if (isAppwriteConfigured() && credentials?.password) {
          const email = String(credentials.email || "").trim().toLowerCase();
          const password = String(credentials.password || "");
          const fullName = String(credentials.full_name || credentials.fullName || "").trim();
          if (credentials.register) {
            await appwriteRegisterEmailPassword(email, password, fullName || email);
          } else {
            await appwriteLoginEmailPassword(email, password);
          }
          const verified = await getVerifiedAuthUser();
          if (!verified) {
            throw new Error("Signed in with Appwrite but the account could not be loaded.");
          }
          emitAuthChange("SIGNED_IN", verified);
          return clone(verified);
        }

        // Local development fallback: name + email demo identity.
        const email = String(credentials.email || "").trim().toLowerCase();
        const fullName = String(credentials.full_name || credentials.fullName || "").trim();
        // The backend /signin endpoint ignores role; self-registration must use
        // /signup so the chosen role (student/staff) is actually honored.
        const role = credentials.role === "staff" ? "staff" : "student";

        let user;
        if (credentials.register) {
          try {
            user = await requestAuthApi("/signup", {
              method: "POST",
              body: JSON.stringify({ email, full_name: fullName, role }),
            });
          } catch (error) {
            // Account already exists — fall back to a normal sign-in so the
            // action still succeeds instead of erroring on a duplicate.
            if (error?.status !== 409) {
              throw error;
            }
            user = await requestAuthApi("/signin", {
              method: "POST",
              body: JSON.stringify({ email, full_name: fullName }),
            });
          }
        } else {
          user = await requestAuthApi("/signin", {
            method: "POST",
            body: JSON.stringify({ email, full_name: fullName }),
          });
        }
        const normalizedUser = normalizeAuthUser(user);
        writeAuthUser(normalizedUser);
        emitAuthChange("SIGNED_IN", normalizedUser);
        return clone(normalizedUser);
      },
      async forgotPassword(email) {
        const normalized = String(email || "").trim().toLowerCase();
        if (!normalized) {
          throw new Error("Email is required.");
        }
        return requestAuthApi("/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: normalized }),
        });
      },
      async listUsers() {
        return requestFeatureApi("/admin/users");
      },
      async updateUserRole(userId, role) {
        return requestFeatureApi(`/admin/users/${encodeURIComponent(userId)}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role }),
        });
      },
      async signInWithGoogle() {
        if (!isAppwriteConfigured()) {
          throw new Error("Google sign-in is not configured.");
        }
        startGoogleOAuth();
        return null;
      },
      // Called on app load to finish a Google OAuth redirect, if one is in progress.
      async completeOAuthRedirect() {
        if (!isAppwriteConfigured() || typeof window === "undefined") {
          return null;
        }
        const params = new URLSearchParams(window.location.search);
        const marker = params.get(OAUTH_RETURN_PARAM);
        if (!marker) {
          return null;
        }

        params.delete(OAUTH_RETURN_PARAM);
        const nextSearch = params.toString();
        const cleanedUrl = window.location.pathname + (nextSearch ? `?${nextSearch}` : "") + window.location.hash;
        window.history.replaceState({}, document.title, cleanedUrl);

        if (marker !== "success") {
          return null;
        }

        try {
          await refreshJwtFromSession();
          const verified = await getVerifiedAuthUser();
          if (verified) {
            emitAuthChange("SIGNED_IN", verified);
          }
          return verified;
        } catch {
          clearStoredAppwriteJwt();
          return null;
        }
      },
      async logout() {
        if (isAppwriteConfigured()) {
          await appwriteDeleteSession().catch(() => {});
        }
        clearClientAuthStorage();
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
    health: featureClients.health,
    items: foundItemApi,
    lostReports: lostReportApi,
    claims: claimApi,
    support: {
      async listTickets(status) {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return requestFeatureApi(`/staff/support/tickets${query}`);
      },
      async updateTicket(id, { status, staff_notes } = {}) {
        return requestFeatureApi(`/staff/support/tickets/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status, staff_notes }),
        });
      },
      async replyToTicket(id, message) {
        return requestFeatureApi(`/staff/support/tickets/${encodeURIComponent(id)}/reply`, {
          method: "POST",
          body: JSON.stringify({ message }),
        });
      },
      async createTicket(payload) {
        return requestFeatureApi("/support/tickets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
    },
    matches: featureClients.matches,
    uploads: featureClients.uploads,
    recoveryCenter: featureClients.recoveryCenter,
    recoveryCases: featureClients.recoveryCases,
    recoveryMissions: featureClients.recoveryMissions,
    proofVault: featureClients.proofVault,
    claimCaseMessages: featureClients.claimCaseMessages,
    returnPasses: featureClients.returnPasses,
    recoveryPulse: featureClients.recoveryPulse,
    sentinel: featureClients.sentinel,
    custody: featureClients.custody,
    campusZones: featureClients.campusZones,
    eventHubs: featureClients.eventHubs,
    demoScenarios: featureClients.demoScenarios,
    assets: featureClients.assets,
    partnerRelay: featureClients.partnerRelay,
    aiAssistance: featureClients.aiAssistance,
    entities: {
      FoundItem: foundItemApi,
      LostReport: lostReportApi,
      Claim: claimApi,
      Notification: notificationEntityApi,
      AuditLog: auditLogApi,
    },
    recoveryMesh: createRecoveryMeshApi(featureClients),
    integrations: {
      Core: {
        UploadFile: uploadFile,
        async InvokeLLM({ prompt }) {
          return createInvokeLlmResponse(prompt);
        },
      },
    },
  };
}

export const appClient = createAppClient();
