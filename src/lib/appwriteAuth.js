// Dependency-free Appwrite browser auth using Appwrite's public REST API.
// We intentionally avoid the Appwrite SDK so no new packages are required.
//
// Flow: the browser authenticates with Appwrite (email/password or Google OAuth),
// then mints a short-lived account JWT. That JWT is sent to the Spring Boot backend,
// which verifies it server-side. Passwords never touch our backend.
//
// All values come from Vite env vars. When they are absent, the app gracefully
// falls back to the local demo sign-in (see docs/AUTH_INTEGRATION.md).

// Appwrite endpoint base URL (trailing slashes stripped) from Vite env.
const ENDPOINT = String(import.meta.env.VITE_APPWRITE_ENDPOINT || "").replace(/\/+$/, "");
// Appwrite project id from Vite env.
const PROJECT_ID = String(import.meta.env.VITE_APPWRITE_PROJECT_ID || "").trim();
// localStorage key holding the minted account JWT.
const JWT_STORAGE_KEY = "findback-appwrite-jwt";
// Query param appended to OAuth redirect URLs to signal success/failure on return.
export const OAUTH_RETURN_PARAM = "appwrite_oauth";

// True only when both endpoint and project id are present (i.e. Appwrite is set up).
export function isAppwriteConfigured() {
  return Boolean(ENDPOINT && PROJECT_ID);
}

// Safely access localStorage; returns null on the server or when access throws.
function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

// Read the stored JWT, or null if absent/unavailable.
export function getStoredAppwriteJwt() {
  return storage()?.getItem(JWT_STORAGE_KEY) || null;
}

// Persist (or, when falsy, remove) the JWT in localStorage. Side effect only.
function setStoredAppwriteJwt(jwt) {
  const store = storage();
  if (!store) return;
  if (jwt) {
    store.setItem(JWT_STORAGE_KEY, jwt);
  } else {
    store.removeItem(JWT_STORAGE_KEY);
  }
}

// Remove the stored JWT (used on logout/session reset).
export function clearStoredAppwriteJwt() {
  setStoredAppwriteJwt(null);
}

// Thin fetch wrapper for the Appwrite REST API: adds project headers, JSON
// content negotiation, and cookie credentials; parses the JSON body; and throws
// an Error (with `.status`) on non-2xx responses. Throws if Appwrite is unconfigured.
async function appwriteFetch(path, options = {}) {
  if (!isAppwriteConfigured()) {
    throw new Error("Appwrite is not configured.");
  }
  const response = await fetch(`${ENDPOINT}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Appwrite-Project": PROJECT_ID,
      ...(options.headers || {}),
    },
  });

  // Read the body as text first so non-JSON error bodies don't crash parsing.
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Non-JSON body: wrap the raw text as a message.
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || "Appwrite request failed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

// Mints a short-lived JWT from the current Appwrite session.
// Appwrite 1.6+ exposes /account/jwts; older versions use /account/jwt.
async function createJwt() {
  let payload;
  try {
    payload = await appwriteFetch("/account/jwts", { method: "POST", body: "{}" });
  } catch (error) {
    if (error.status === 404) {
      payload = await appwriteFetch("/account/jwt", { method: "POST", body: "{}" });
    } else {
      throw error;
    }
  }
  const jwt = payload?.jwt || "";
  if (!jwt) {
    throw new Error("Appwrite did not return a session token.");
  }
  // Cache the JWT so subsequent backend calls can attach it.
  setStoredAppwriteJwt(jwt);
  return jwt;
}

// Email/password sign-in: drop any stale session, create an email session, then
// mint and store a JWT. Returns the JWT. Side effect: replaces stored session/JWT.
export async function loginWithEmailPassword(email, password) {
  // Clear any stale session so a fresh one is created cleanly.
  await deleteCurrentSession().catch(() => {});
  await appwriteFetch("/account/sessions/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return createJwt();
}

// Create a new Appwrite account, then immediately log in to obtain a JWT.
// Returns the JWT.
export async function registerWithEmailPassword(email, password, name) {
  await appwriteFetch("/account", {
    method: "POST",
    body: JSON.stringify({ userId: "unique()", email, password, name }),
  });
  return loginWithEmailPassword(email, password);
}

// Begin Google OAuth by redirecting the browser to Appwrite's OAuth2 URL.
// Builds success/failure return URLs (tagged with OAUTH_RETURN_PARAM) pointing
// back at this origin. Does not return — it navigates away.
export function startGoogleOAuth() {
  if (!isAppwriteConfigured()) {
    throw new Error("Google sign-in is not configured.");
  }
  const origin = window.location.origin;
  const successUrl = `${origin}/?${OAUTH_RETURN_PARAM}=success`;
  const failureUrl = `${origin}/?${OAUTH_RETURN_PARAM}=failure`;
  const url = `${ENDPOINT}/account/sessions/oauth2/google?project=${encodeURIComponent(PROJECT_ID)}`
    + `&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`;
  window.location.assign(url);
}

// After returning from an OAuth redirect, mint a JWT from the new session.
// Returns the JWT.
export async function refreshJwtFromSession() {
  return createJwt();
}

// Log out: delete the current Appwrite session, and always clear the local JWT
// (even if the delete request fails).
export async function deleteCurrentSession() {
  try {
    await appwriteFetch("/account/sessions/current", { method: "DELETE" });
  } finally {
    clearStoredAppwriteJwt();
  }
}
