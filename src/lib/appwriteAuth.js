// Dependency-free Appwrite browser auth using Appwrite's public REST API.
// We intentionally avoid the Appwrite SDK so no new packages are required.
//
// Flow: the browser authenticates with Appwrite (email/password or Google OAuth),
// then mints a short-lived account JWT. That JWT is sent to the Spring Boot backend,
// which verifies it server-side. Passwords never touch our backend.
//
// All values come from Vite env vars. When they are absent, the app gracefully
// falls back to the local demo sign-in (see docs/AUTH_INTEGRATION.md).

const ENDPOINT = String(import.meta.env.VITE_APPWRITE_ENDPOINT || "").replace(/\/+$/, "");
const PROJECT_ID = String(import.meta.env.VITE_APPWRITE_PROJECT_ID || "").trim();
const JWT_STORAGE_KEY = "findback-appwrite-jwt";
export const OAUTH_RETURN_PARAM = "appwrite_oauth";

export function isAppwriteConfigured() {
  return Boolean(ENDPOINT && PROJECT_ID);
}

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function getStoredAppwriteJwt() {
  return storage()?.getItem(JWT_STORAGE_KEY) || null;
}

function setStoredAppwriteJwt(jwt) {
  const store = storage();
  if (!store) return;
  if (jwt) {
    store.setItem(JWT_STORAGE_KEY, jwt);
  } else {
    store.removeItem(JWT_STORAGE_KEY);
  }
}

export function clearStoredAppwriteJwt() {
  setStoredAppwriteJwt(null);
}

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

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
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
  setStoredAppwriteJwt(jwt);
  return jwt;
}

export async function loginWithEmailPassword(email, password) {
  // Clear any stale session so a fresh one is created cleanly.
  await deleteCurrentSession().catch(() => {});
  await appwriteFetch("/account/sessions/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return createJwt();
}

export async function registerWithEmailPassword(email, password, name) {
  await appwriteFetch("/account", {
    method: "POST",
    body: JSON.stringify({ userId: "unique()", email, password, name }),
  });
  return loginWithEmailPassword(email, password);
}

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
export async function refreshJwtFromSession() {
  return createJwt();
}

export async function deleteCurrentSession() {
  try {
    await appwriteFetch("/account/sessions/current", { method: "DELETE" });
  } finally {
    clearStoredAppwriteJwt();
  }
}
