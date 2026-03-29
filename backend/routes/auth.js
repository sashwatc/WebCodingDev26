const express = require("express");
const router = express.Router();
const { stores } = require("../lib/stores");

const ADMIN_EMAIL = "avery.patel@pleasantvalley.edu";

function getRoleForEmail(email) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL ? "admin" : "student";
}

function validateCredentials({ full_name, email }) {
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

  return {
    full_name: normalizedName,
    email: normalizedEmail,
    role: getRoleForEmail(normalizedEmail),
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
    res.status(500).json({
      message: "Failed to load user",
      error: error.message,
    });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const credentials = validateCredentials(req.body || {});
    const user = await stores.User.upsert(
      { email: credentials.email },
      credentials
    );

    res.json(user);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: statusCode === 400 ? error.message : "Failed to sign in",
      error: error.message,
    });
  }
});

module.exports = router;
