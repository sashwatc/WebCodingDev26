const express = require("express");
const router = express.Router();
const { stores } = require("../lib/stores");
const {
  applyClaimStatusSideEffects,
  syncMatchesForLostReport,
  validateClaimSave,
} = require("../lib/workflows");

function getStore(entityName) {
  return stores[entityName] || null;
}

router.get("/:entityName", async (req, res) => {
  const store = getStore(req.params.entityName);

  if (!store || req.params.entityName === "FoundItem") {
    return res.status(404).json({
      message: "Entity not found",
    });
  }

  try {
    const records = await store.list();
    res.json(records);
  } catch (error) {
    res.status(500).json({
      message: `Failed to fetch ${req.params.entityName}`,
      error: error.message,
    });
  }
});

router.post("/:entityName", async (req, res) => {
  const store = getStore(req.params.entityName);

  if (!store || req.params.entityName === "FoundItem") {
    return res.status(404).json({
      message: "Entity not found",
    });
  }

  try {
    // Stamp the submitting user's email from the auth header so records are
    // always associated with the right account even if the form field was blank.
    const authUserEmail = String(req.headers["x-demo-user-email"] || "").trim().toLowerCase() || null;
    let body = { ...(req.body || {}) };

    if (authUserEmail) {
      if (req.params.entityName === "LostReport" && !body.contact_email) {
        body.contact_email = authUserEmail;
      }
      if (req.params.entityName === "Claim" && !body.claimant_email) {
        body.claimant_email = authUserEmail;
      }
      if (req.params.entityName === "Notification" && !body.user_email) {
        body.user_email = authUserEmail;
      }
      // Always record who submitted this record for ownership queries.
      body.submitted_by_user_email = authUserEmail;
    }

    if (req.params.entityName === "Claim") {
      await validateClaimSave(body, null);
    }

    let record = await store.create(body);

    if (req.params.entityName === "LostReport") {
      record = await syncMatchesForLostReport(record);
    }

    res.status(201).json(record);
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    res.status(statusCode).json({
      message: `Failed to create ${req.params.entityName}`,
      error: error.message,
    });
  }
});

// Helper used by GET filter route to match records by ownership email
// including the submitted_by_user_email fallback field.
function recordBelongsToUser(entityName, record, userEmail) {
  if (!userEmail) return false;
  const email = userEmail.trim().toLowerCase();
  if (entityName === "LostReport") {
    return (
      String(record.contact_email || "").toLowerCase() === email ||
      String(record.submitted_by_user_email || "").toLowerCase() === email
    );
  }
  if (entityName === "Claim") {
    return (
      String(record.claimant_email || "").toLowerCase() === email ||
      String(record.submitted_by_user_email || "").toLowerCase() === email
    );
  }
  if (entityName === "Notification") {
    return String(record.user_email || "").toLowerCase() === email;
  }
  return String(record.submitted_by_user_email || "").toLowerCase() === email;
}

router.patch("/:entityName/:id", async (req, res) => {
  const store = getStore(req.params.entityName);

  if (!store || req.params.entityName === "FoundItem") {
    return res.status(404).json({
      message: "Entity not found",
    });
  }

  try {
    const previousRecord = await store.findById(req.params.id);

    if (!previousRecord) {
      return res.status(404).json({
        message: `${req.params.entityName} not found`,
      });
    }

    const candidateRecord = {
      ...previousRecord,
      ...(req.body || {}),
    };

    if (req.params.entityName === "Claim") {
      await validateClaimSave(candidateRecord, previousRecord);
    }

    const nextRecord = await store.save(candidateRecord);

    if (req.params.entityName === "Claim") {
      await applyClaimStatusSideEffects(nextRecord, previousRecord);
    }

    res.json(nextRecord);
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    res.status(statusCode).json({
      message: `Failed to update ${req.params.entityName}`,
      error: error.message,
    });
  }
});

router.delete("/:entityName/:id", async (req, res) => {
  const store = getStore(req.params.entityName);

  if (!store || req.params.entityName === "FoundItem") {
    return res.status(404).json({
      message: "Entity not found",
    });
  }

  try {
    const deletedRecord = await store.remove(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({
        message: `${req.params.entityName} not found`,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: `Failed to delete ${req.params.entityName}`,
      error: error.message,
    });
  }
});

module.exports = router;
