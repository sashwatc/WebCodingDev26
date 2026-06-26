const express = require("express");
const router = express.Router();
const { stores } = require("../lib/stores");

const ADMIN_EMAIL = "avery.patel@pleasantvalley.edu";
const VALID_ROLES = ["student", "staff", "admin", "suspended"];

function getRoleForEmail(email) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL ? "admin" : "student";
}

function validateCredentials({ full_name, email, role }) {
  const normalizedName = String(full_name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedName) {
    const error = new Error("Full name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error("Enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }

  // Admin email always gets admin; otherwise use provided role or default to student
  let resolvedRole = getRoleForEmail(normalizedEmail);
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

router.get("/user", async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();

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

router.post("/signin", async (req, res) => {
  try {
    const credentials = validateCredentials(req.body || {});

    // If user already exists, return them without overwriting admin-managed role
    const existing = await stores.User.findOne({ email: credentials.email });
    if (existing) {
      return res.json(existing);
    }

    const user = await stores.User.create(credentials);
    res.json(user);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: statusCode === 400 ? error.message : "Failed to sign in",
      error: error.message,
    });
  }
});

// List all users (admin panel)
router.get("/users", async (req, res) => {
  try {
    const users = await stores.User.list();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to list users", error: error.message });
  }
});

// Update a user's role
router.patch("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await stores.User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const updated = await stores.User.save({ ...user, role });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update role", error: error.message });
  }
});

module.exports = router;
