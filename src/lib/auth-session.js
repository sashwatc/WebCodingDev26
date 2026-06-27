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

export { AUTH_STORAGE_KEY, UI_SETTINGS_STORAGE_KEY, isAdminRole, isStaffRole, isStudentRole, isSuspendedRole, stripLegacyAdminModeFromUiSettings };

/** Demo header is only sent when Appwrite is off or no JWT is stored. */
export function shouldAttachDemoUserHeader() {
  if (!isAppwriteConfigured()) {
    return true;
  }
  return !getStoredAppwriteJwt();
}

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
