/**
 * backend/routes/auth.js
 *
 * Express router mounted at `/api/auth` that handles the demo authentication and
 * user-management flows for the Lost & Found app.
 *
 * Endpoints:
 *  - GET    /user            -> look up a user by email (query param)
 *  - POST   /signin          -> sign in / register a user from name + email
 *  - GET    /users           -> list all users (admin panel)
 *  - PATCH  /users/:id/role  -> change a user's role (admin panel)
 *
 * This is a lightweight, demo-style auth scheme: there are no passwords. A user is
 * identified solely by email, and a single hard-coded admin email is automatically
 * granted the "admin" role. Persistence goes through the abstract `stores.User`
 * data store (backed by Mongo/Supabase/local depending on configuration).
 */
const express = require("express");
const router = express.Router();
const { stores } = require("../lib/stores");

// The single email address that is always elevated to the "admin" role.
const ADMIN_EMAIL = "avery.patel@pleasantvalley.edu";
// Roles accepted when an admin updates another user's role.
const VALID_ROLES = ["student", "staff", "admin", "suspended"];

// Determine the default role for an email: the hard-coded admin address becomes
// "admin", everyone else defaults to "student". Comparison is case-insensitive and
// trimmed. Input: email string. Returns: "admin" | "student".
function getRoleForEmail(email) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL ? "admin" : "student";
}

// Validate and normalize sign-in credentials from a request body.
// Input: { full_name, email, role } (all untrusted/raw).
// Returns: a clean user object { full_name, email, role, avatar_url } ready to persist.
// Throws an Error with `.statusCode = 400` when the name is missing or the email is
// missing/malformed, so the route can translate it into an HTTP 400 response.
function validateCredentials({ full_name, email, role }) {
  // Normalize inputs: trim the name; trim + lowercase the email for consistent storage/lookup.
  const normalizedName = String(full_name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  // A display name is required.
  if (!normalizedName) {
    const error = new Error("Full name is required.");
    error.statusCode = 400;
    throw error;
  }

  // Basic email shape check: non-empty local part, "@", domain, ".", TLD, no spaces/@ inside parts.
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error("Enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }

  // Admin email always gets admin; otherwise use provided role or default to student
  let resolvedRole = getRoleForEmail(normalizedEmail);
  // A non-admin may self-select only "student" or "staff"; any other requested role is ignored.
  if (resolvedRole !== "admin" && ["student", "staff"].includes(role)) {
    resolvedRole = role;
  }

  return {
    full_name: normalizedName,
    email: normalizedEmail,
    role: resolvedRole,
    avatar_url: "",
  };
}

// GET /api/auth/user?email=...
// Look up a single user by email (case-insensitive). Query: `email`.
// Responds with the user JSON if found, `null` if no email was supplied (or no
// match), or 500 on a store error.
router.get("/user", async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();

  // No email provided: nothing to look up, return null rather than erroring.
  if (!email) {
    return res.json(null);
  }

  try {
    const user = await stores.User.findOne({ email });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to load user", error: error.message });
  }
});

// POST /api/auth/signin
// Sign in or register a user. Body: { full_name, email, role? }.
// Validates/normalizes the credentials, returns the existing user if one already
// exists for that email (preserving any admin-assigned role), otherwise creates a
// new user. Side effect: may create a User record.
// Responds 200 with the user, 400 on validation failure, or 500 on other errors.
router.post("/signin", async (req, res) => {
  try {
    const credentials = validateCredentials(req.body || {});

    // If user already exists, return them without overwriting admin-managed role
    const existing = await stores.User.findOne({ email: credentials.email });
    if (existing) {
      return res.json(existing);
    }

    // First-time sign-in: persist the new user.
    const user = await stores.User.create(credentials);
    res.json(user);
  } catch (error) {
    // validateCredentials sets statusCode 400 for bad input; anything else is a 500.
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: statusCode === 400 ? error.message : "Failed to sign in",
      error: error.message,
    });
  }
});

// GET /api/auth/users
// List all users (admin panel). No inputs. Responds with an array of users, or 500.
router.get("/users", async (req, res) => {
  try {
    const users = await stores.User.list();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to list users", error: error.message });
  }
});

// PATCH /api/auth/users/:id/role
// Update a user's role. Params: `id` (user id). Body: { role }.
// Validates `role` against VALID_ROLES, looks up the user, and saves the change.
// Side effect: updates the User record's role.
// Responds 200 with the updated user, 400 for an invalid role, 404 if not found,
// or 500 on store errors.
router.patch("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};

  // Reject any role that isn't in the allowed set before touching the store.
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await stores.User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Persist the user with only the role replaced; all other fields are preserved.
    const updated = await stores.User.save({ ...user, role });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update role", error: error.message });
  }
});

module.exports = router;
