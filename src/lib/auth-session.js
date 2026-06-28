/**
 * Canonical client auth/session helpers.
 * Backend `/api/auth/me` remains the source of truth for role; these utilities
 * only manage browser storage and derived role checks.
 */

import {
  clearStoredAppwriteJwt,
  getStoredAppwriteJwt,
  isAppwriteConfigured,
} from "@/lib/appwriteAuth";
import {
  AUTH_STORAGE_KEY,
  UI_SETTINGS_STORAGE_KEY,
  isAdminRole,
  isStaffRole,
  isStudentRole,
  isSuspendedRole,
  stripLegacyAdminModeFromUiSettings,
} from "@/lib/auth-role";

// Re-export the pure role/storage helpers so callers can import everything
// session-related from this single module.
export { AUTH_STORAGE_KEY, UI_SETTINGS_STORAGE_KEY, isAdminRole, isStaffRole, isStudentRole, isSuspendedRole, stripLegacyAdminModeFromUiSettings };

/**
 * Whether the API client should attach the demo-user header.
 * Demo header is only sent when Appwrite is off or no JWT is stored — i.e. when
 * there's no real Appwrite-backed session to authenticate with.
 */
export function shouldAttachDemoUserHeader() {
  if (!isAppwriteConfigured()) {
    return true;
  }
  return !getStoredAppwriteJwt();
}

/**
 * Clear all client-side auth state on logout: remove the Appwrite JWT, the
 * cached auth user, and any legacy admin-mode flag from UI settings. Safe to
 * call on the server (storage access guarded). Side-effect only.
 */
export function clearClientAuthStorage() {
  clearStoredAppwriteJwt();

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }

  stripLegacyAdminModeFromUiSettings();
}
