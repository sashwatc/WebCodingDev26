/**
 * FindBack AI - Application Constants
 * Centralized configuration for categories, locations, statuses, and color mappings.
 * This keeps the app consistent and easy to maintain.
 */

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

export const LOCATIONS = [
  "Gymnasium", "Cafeteria", "Library", "Main Office", "Science Hall",
  "Auditorium", "Parking Lot", "Bus Loop", "Front Desk", "Art Room",
  "Music Room", "Computer Lab", "Hallway - 1st Floor", "Hallway - 2nd Floor",
  "Hallway - 3rd Floor", "Restroom Area", "Outdoor Courtyard",
  "Football Field", "Track & Field", "Student Lounge",
];

export const COLORS = [
  "Black", "White", "Red", "Blue", "Green", "Yellow", "Orange",
  "Purple", "Pink", "Brown", "Gray", "Silver", "Gold", "Multi-color",
];

export const ITEM_STATUSES = {
  pending_review: { label: "Pending Review", color: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  claimed: { label: "Claimed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  returned: { label: "Returned", color: "bg-slate-100 text-slate-700 border-slate-200" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export const CLAIM_STATUSES = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800 border-blue-200" },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-800 border-amber-200" },
  need_more_info: { label: "Need More Info", color: "bg-slate-100 text-slate-700 border-slate-200" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

export const LOST_REPORT_STATUSES = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800 border-blue-200" },
  matched: { label: "Matched", color: "bg-slate-100 text-slate-700 border-slate-200" },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-800 border-amber-200" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 border-green-200" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export const CONDITIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "damaged", label: "Damaged" },
];

export const URGENCY_LEVELS = [
  { value: "low", label: "Low", color: "text-gray-600" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "critical", label: "Critical", color: "text-red-600" },
];

export const DEMO_ACCOUNTS = {
  student: {
    full_name: "Jordan Kim",
    email: "jordan.kim@pleasantvalley.edu",
    role: "student",
    label: "Student Demo",
  },
  admin: {
    full_name: "Avery Patel",
    email: "avery.patel@pleasantvalley.edu",
    role: "admin",
    label: "Admin Demo",
  },
};

const DEMO_ROLE_BY_EMAIL = Object.values(DEMO_ACCOUNTS).reduce((roles, account) => {
  roles[account.email] = account.role;
  return roles;
}, {});

export function getDemoRoleForEmail(email) {
  return DEMO_ROLE_BY_EMAIL[String(email || "").trim().toLowerCase()] || "student";
}

/** Generate a unique item code like FB-2025-A3K7 */
export function generateItemCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FB-${new Date().getFullYear()}-${code}`;
}

export function getCategoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}
