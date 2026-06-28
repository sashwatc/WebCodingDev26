/**
 * Lost Then Found - Application Constants
 * -----------------------------------------------------------------------------
 * Centralized configuration for branding, demo access, categories, and statuses.
 *
 * Exposes brand/contact strings, the canonical option lists (categories,
 * locations, colors, conditions, urgency), status->badge style maps for items /
 * claims / lost reports, demo account definitions, and a few small helpers
 * (item-code generation, category label + demo-role lookups).
 */

// Per-tone dark-mode Tailwind class fragments, appended to light styles by
// statusColor() so each status badge has matching light/dark theming.
const STATUS_DARK = {
  emerald: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  blue: "dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  indigo: "dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  gray: "dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700",
  amber: "dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  slate: "dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600",
  red: "dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  green: "dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
};

// Combine a light-mode class string with the matching dark-mode fragment for a tone.
function statusColor(light, tone) {
  return `${light} ${STATUS_DARK[tone]}`;
}

// --- Branding / contact info ---
export const BRAND_NAME = "Lost Then Found";
export const BRAND_SHORT_NAME = "Lost Then Found";
export const SCHOOL_NAME = "PVHS";
export const SCHOOL_FULL_NAME = "Pleasant Valley High School";
export const SUPPORT_EMAIL = "lostthenfound@pleasval.org";
export const SUPPORT_PHONE = "563-499-6331";
export const SUPPORT_LOCATION = "604 Belmont Rd, Riverdale, IA, 52722";

// Item categories: machine `value`, display `label`, and lucide `icon` name.
export const CATEGORIES = [
  { value: "electronics", label: "Electronics", icon: "Smartphone" },
  { value: "clothing", label: "Clothing & Apparel", icon: "Shirt" },
  { value: "accessories", label: "Accessories", icon: "Watch" },
  { value: "school_supplies", label: "School Supplies", icon: "BookOpen" },
  { value: "sports_equipment", label: "Sports Equipment", icon: "Dumbbell" },
  { value: "food_containers", label: "Food & Containers", icon: "UtensilsCrossed" },
  { value: "keys_ids", label: "Keys & IDs", icon: "Key" },
  { value: "bags_cases", label: "Bags & Cases", icon: "Briefcase" },
  { value: "personal_items", label: "Personal Items", icon: "Heart" },
  { value: "other", label: "Other", icon: "Package" },
];

// Known on-campus locations where items are lost/found.
export const LOCATIONS = [
  "Gymnasium", "Cafeteria", "Library", "Main Office", "Science Hall",
  "Auditorium", "Parking Lot", "Bus Loop", "Front Desk", "Art Room",
  "Music Room", "Computer Lab", "Hallway - 1st Floor", "Hallway - 2nd Floor",
  "Hallway - 3rd Floor", "Restroom Area", "Outdoor Courtyard",
  "Football Field", "Track & Field", "Student Lounge",
];

// Selectable item colors.
export const COLORS = [
  "Black", "White", "Red", "Blue", "Green", "Yellow", "Orange",
  "Purple", "Pink", "Brown", "Gray", "Silver", "Gold", "Multi-color",
];

// Found-item statuses -> { label, color } badge styling. Includes both the
// canonical uppercase keys and the lowercase backend variants.
export const ITEM_STATUSES = {
  FOUND: { label: "Available", color: statusColor("bg-emerald-100 text-emerald-800 border-emerald-200", "emerald") },
  CLAIM_PENDING: { label: "Claim Pending", color: statusColor("bg-blue-100 text-blue-800 border-blue-200", "blue") },
  VERIFIED: { label: "Verified", color: statusColor("bg-indigo-100 text-indigo-800 border-indigo-200", "indigo") },
  ARCHIVED: { label: "Archived", color: statusColor("bg-gray-100 text-gray-800 border-gray-200", "gray") },
  pending_review: { label: "Pending Review", color: statusColor("bg-amber-100 text-amber-800 border-amber-200", "amber") },
  approved: { label: "Approved", color: statusColor("bg-emerald-100 text-emerald-800 border-emerald-200", "emerald") },
  claimed: { label: "Claimed", color: statusColor("bg-blue-100 text-blue-800 border-blue-200", "blue") },
  returned: { label: "Returned", color: statusColor("bg-slate-100 text-slate-700 border-slate-200", "slate") },
  archived: { label: "Archived", color: statusColor("bg-gray-100 text-gray-800 border-gray-200", "gray") },
};

// Claim lifecycle statuses -> { label, color } badge styling.
export const CLAIM_STATUSES = {
  submitted: { label: "Submitted", color: statusColor("bg-blue-100 text-blue-800 border-blue-200", "blue") },
  under_review: { label: "Under Review", color: statusColor("bg-amber-100 text-amber-800 border-amber-200", "amber") },
  need_more_info: { label: "Need More Info", color: statusColor("bg-slate-100 text-slate-700 border-slate-200", "slate") },
  // Approved is the key positive milestone — use a solid, high-contrast badge so
  // it stays clearly legible (including overlaid on the claim photo).
  approved: { label: "Approved", color: "bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-600 dark:text-white dark:border-emerald-500" },
  rejected: { label: "Rejected", color: statusColor("bg-red-100 text-red-800 border-red-200", "red") },
  completed: { label: "Completed", color: statusColor("bg-slate-100 text-slate-700 border-slate-200", "slate") },
};

// Lost-report statuses -> { label, color } badge styling.
export const LOST_REPORT_STATUSES = {
  open: { label: "Open", color: statusColor("bg-blue-100 text-blue-800 border-blue-200", "blue") },
  matched: { label: "Matched", color: statusColor("bg-slate-100 text-slate-700 border-slate-200", "slate") },
  in_review: { label: "In Review", color: statusColor("bg-amber-100 text-amber-800 border-amber-200", "amber") },
  resolved: { label: "Resolved", color: statusColor("bg-green-100 text-green-800 border-green-200", "green") },
  closed: { label: "Closed", color: statusColor("bg-gray-100 text-gray-800 border-gray-200", "gray") },
};

// Item condition options (value/label).
export const CONDITIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "damaged", label: "Damaged" },
];

// Lost-report urgency levels with per-level text color classes.
export const URGENCY_LEVELS = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-amber-600 dark:text-amber-300" },
  { value: "high", label: "High", color: "text-orange-600 dark:text-orange-300" },
  { value: "critical", label: "Critical", color: "text-destructive" },
];

// Predefined demo accounts (one-click sign-in) keyed by an internal id; each
// has full_name, email, role, and a UI label.
export const DEMO_ACCOUNTS = {
  student: {
    full_name: "Jordan Kim",
    email: "jordan.kim@pleasantvalley.edu",
    role: "student",
    label: "Student Demo",
  },
  averyChen: {
    full_name: "Avery Chen",
    email: "avery.chen@pleasantvalley.edu",
    role: "student",
    label: "Avery Chen — Main Demo Case",
  },
  jordanLee: {
    full_name: "Jordan Lee",
    email: "jordan.lee@pleasantvalley.edu",
    role: "student",
    label: "Jordan Lee — Case 041",
  },
  admin: {
    full_name: "Avery Patel",
    email: "avery.patel@pleasantvalley.edu",
    role: "admin",
    label: "Admin Demo",
  },
  staff: {
    full_name: "Demo Staff",
    email: "staff.demo@pleasantvalley.edu",
    role: "staff",
    label: "Staff Demo",
  },
};

// Lookup map: demo account email -> role, built from DEMO_ACCOUNTS.
const DEMO_ROLE_BY_EMAIL = Object.values(DEMO_ACCOUNTS).reduce((roles, account) => {
  roles[account.email] = account.role;
  return roles;
}, {});

// Resolve the role for a (demo) email, case/space-insensitive; defaults to "student".
export function getDemoRoleForEmail(email) {
  return DEMO_ROLE_BY_EMAIL[String(email || "").trim().toLowerCase()] || "student";
}

/**
 * Generate a unique item code like FB-2025-A3K7.
 * Format: FB-<current year>-<4 random chars>. The character set omits easily
 * confused glyphs (no 0/O/1/I). Not cryptographically unique.
 */
export function generateItemCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FB-${new Date().getFullYear()}-${code}`;
}

// Map a category `value` to its display label, falling back to the raw value.
export function getCategoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}
