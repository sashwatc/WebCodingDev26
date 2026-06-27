/** Pure role/UI-settings helpers (no browser or Appwrite deps). */

export const AUTH_STORAGE_KEY = "findback-auth-user";
export const UI_SETTINGS_STORAGE_KEY = "findback-ui-settings";

export function isAdminRole(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

export function isStaffRole(user) {
  return String(user?.role || "").toLowerCase() === "staff";
}

export function isStudentRole(user) {
  return String(user?.role || "").toLowerCase() === "student";
}

export function isSuspendedRole(user) {
  return String(user?.role || "").toLowerCase() === "suspended";
}

export function stripLegacyAdminModeFromUiSettings(storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage) {
    return;
  }

  try {
    const raw = storage.getItem(UI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("isAdminMode" in parsed)) {
      return;
    }

    const { isAdminMode: _removed, ...rest } = parsed;
    storage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // Ignore corrupt UI settings.
  }
}
