/**
 * backend/routes/entities.js
 *
 * Generic CRUD router mounted at `/api/entities` that exposes the project's data
 * stores by name. Instead of a hand-written router per model, a single set of
 * handlers proxies to whichever store matches the `:entityName` URL segment
 * (e.g. LostReport, Claim, Notification, User, ...).
 *
 * Routes (all keyed on `:entityName`):
 *  - GET    /:entityName       -> list all records for an entity
 *  - POST   /:entityName       -> create a record (with auth-stamping + workflows)
 *  - PATCH  /:entityName/:id    -> update a record (with claim validation/side effects)
 *  - DELETE /:entityName/:id    -> delete a record
 *
 * Notable behavior:
 *  - "FoundItem" is deliberately excluded here; found items are served by the
 *    dedicated `routes/items.js` router with richer media handling.
 *  - On create, the submitting user's email (from the `x-demo-user-email` header)
 *    is stamped onto the record for ownership tracking.
 *  - Claims and LostReports trigger extra validation/matching workflows.
 */
const express = require("express");
const router = express.Router();
const { stores } = require("../lib/stores");
const {
  applyClaimStatusSideEffects,
  syncMatchesForLostReport,
  validateClaimSave,
} = require("../lib/workflows");

// Resolve the data store for a given entity name, or null if no such store exists.
// Input: entityName string. Returns: the store object or null.
function getStore(entityName) {
  return stores[entityName] || null;
}

// GET /api/entities/:entityName
// List every record for the named entity. Params: `entityName`.
// Returns 404 if the entity is unknown or is "FoundItem" (handled elsewhere),
// 200 with an array of records, or 500 on a store error.
router.get("/:entityName", async (req, res) => {
  const store = getStore(req.params.entityName);

  // Unknown entity, or FoundItem which is intentionally not served by this router.
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

// POST /api/entities/:entityName
// Create a new record for the named entity. Params: `entityName`. Body: record fields.
// Header `x-demo-user-email` identifies the submitting user and is stamped onto the
// record (and used to backfill the entity-specific owner-email field when blank).
// Side effects: Claims are validated before save; LostReports trigger match syncing.
// Returns 201 with the created record, 404 for unknown/FoundItem entities,
// 400 on validation errors, or 500 otherwise.
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
    // Normalized to a trimmed lowercase string, or null when the header is absent.
    const authUserEmail = String(req.headers["x-demo-user-email"] || "").trim().toLowerCase() || null;
    // Clone the body so we can safely augment it without mutating the request object.
    let body = { ...(req.body || {}) };

    if (authUserEmail) {
      // Backfill the entity-specific contact/owner email only when the client left it blank.
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

    // Claims get domain validation (e.g. status transitions, required fields) before saving.
    if (req.params.entityName === "Claim") {
      await validateClaimSave(body, null);
    }

    let record = await store.create(body);

    // A new lost report may match existing found items; run the matching workflow,
    // which can enrich/replace the returned record with match data.
    if (req.params.entityName === "LostReport") {
      record = await syncMatchesForLostReport(record);
    }

    res.status(201).json(record);
  } catch (error) {
    // Prefer an explicit statusCode from validation; treat Mongoose-style
    // ValidationErrors as 400; otherwise it's a 500.
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    res.status(statusCode).json({
      message: `Failed to create ${req.params.entityName}`,
      error: error.message,
    });
  }
});

// Helper used by GET filter route to match records by ownership email
// including the submitted_by_user_email fallback field.
// Inputs: entityName, a record, and the userEmail to test ownership against.
// Returns true when the record is owned by that user. Ownership is determined by
// the entity-specific email field (contact_email / claimant_email / user_email)
// OR the generic submitted_by_user_email fallback. Comparison is case-insensitive.
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

// PATCH /api/entities/:entityName/:id
// Update an existing record. Params: `entityName`, `id`. Body: partial fields to merge.
// Loads the current record, shallow-merges the body over it, validates (for Claims),
// saves, and—for Claims—applies status-change side effects (comparing old vs new).
// Side effects: persists the record; Claim status transitions can trigger follow-on actions.
// Returns 200 with the updated record, 404 if unknown/FoundItem or record missing,
// 400 on validation errors, or 500 otherwise.
router.patch("/:entityName/:id", async (req, res) => {
  const store = getStore(req.params.entityName);

  if (!store || req.params.entityName === "FoundItem") {
    return res.status(404).json({
      message: "Entity not found",
    });
  }

  try {
    // Fetch the existing record first so we can validate transitions and diff side effects.
    const previousRecord = await store.findById(req.params.id);

    if (!previousRecord) {
      return res.status(404).json({
        message: `${req.params.entityName} not found`,
      });
    }

    // Merge incoming fields over the existing record (body wins on conflicts).
    const candidateRecord = {
      ...previousRecord,
      ...(req.body || {}),
    };

    // Validate the proposed Claim state against its previous state before saving.
    if (req.params.entityName === "Claim") {
      await validateClaimSave(candidateRecord, previousRecord);
    }

    const nextRecord = await store.save(candidateRecord);

    // After saving a Claim, run side effects that depend on the status change
    // (e.g. notifications, linking found items) using before/after snapshots.
    if (req.params.entityName === "Claim") {
      await applyClaimStatusSideEffects(nextRecord, previousRecord);
    }

    res.json(nextRecord);
  } catch (error) {
    // Same status mapping as create: explicit statusCode > ValidationError(400) > 500.
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    res.status(statusCode).json({
      message: `Failed to update ${req.params.entityName}`,
      error: error.message,
    });
  }
});

// DELETE /api/entities/:entityName/:id
// Permanently remove a record. Params: `entityName`, `id`.
// Side effect: deletes the record from the store.
// Returns 200 { success: true } on deletion, 404 if unknown/FoundItem or record
// not found, or 500 on a store error.
router.delete("/:entityName/:id", async (req, res) => {
  const store = getStore(req.params.entityName);

  if (!store || req.params.entityName === "FoundItem") {
    return res.status(404).json({
      message: "Entity not found",
    });
  }

  try {
    const deletedRecord = await store.remove(req.params.id);

    // remove() returns a falsy value when nothing matched the id.
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
