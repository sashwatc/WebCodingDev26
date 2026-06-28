/**
 * auth-role.js
 * -----------------------------------------------------------------------------
 * Pure role/UI-settings helpers (no browser or Appwrite deps).
 *
 * Provides storage-key constants plus case-insensitive role predicates that
 * read `user.role`, and a migration that strips a legacy `isAdminMode` flag
 * from persisted UI settings. Kept dependency-free so it's easy to unit test.
 */

// localStorage key for the cached auth user object.
export const AUTH_STORAGE_KEY = "findback-auth-user";
// localStorage key for persisted UI settings (theme, reading/contrast mode).
export const UI_SETTINGS_STORAGE_KEY = "findback-ui-settings";

// True when the user's role is "admin" (case-insensitive). Null-safe.
export function isAdminRole(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

// True when the user's role is "staff". Null-safe.
export function isStaffRole(user) {
  return String(user?.role || "").toLowerCase() === "staff";
}

// True when the user's role is "student". Null-safe.
export function isStudentRole(user) {
  return String(user?.role || "").toLowerCase() === "student";
}

// True when the user's role is "suspended". Null-safe.
export function isSuspendedRole(user) {
  return String(user?.role || "").toLowerCase() === "suspended";
}

// Remove the deprecated `isAdminMode` key from the stored UI-settings object.
// `storage` defaults to window.localStorage but is injectable for testing.
// No-op when storage is unavailable, the key is missing, or the flag isn't present.
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

    // Re-persist everything except the legacy flag.
    const { isAdminMode: _removed, ...rest } = parsed;
    storage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // Ignore corrupt UI settings.
  }
}
