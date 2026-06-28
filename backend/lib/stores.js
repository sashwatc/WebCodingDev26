/**
 * stores.js
 *
 * Composition root / registry for the data-access layer. Instantiates one
 * store per domain entity and exposes them under a single `stores` map that
 * the rest of the backend (routes, workflows) imports.
 *
 * - FoundItem uses the specialized itemStore (extra media/validation logic).
 * - Every other entity (LostReport, Claim, Notification, AuditLog, User) uses
 *   the generic createEntityStore factory, configured with its seed data,
 *   Mongoose model path, and id prefix.
 *
 * All stores share the same backend-agnostic interface, so consumers never
 * care whether data lives in local JSON, Mongo, or Supabase.
 */

const seedAppData = require("../data/seedAppData");
const createEntityStore = require("./entityStore");
const itemStore = require("./itemStore");

// Registry mapping entity name -> its store instance.
const stores = {
  // Found items get the bespoke store; all others use the generic factory.
  FoundItem: itemStore,
  LostReport: createEntityStore({
    entityName: "LostReport",
    seedRecords: seedAppData.LostReport,
    modelPath: "../models/LostReport",
    idPrefix: "lost",
  }),
  Claim: createEntityStore({
    entityName: "Claim",
    seedRecords: seedAppData.Claim,
    modelPath: "../models/Claim",
    idPrefix: "claim",
  }),
  Notification: createEntityStore({
    entityName: "Notification",
    seedRecords: seedAppData.Notification,
    modelPath: "../models/Notification",
    idPrefix: "notif",
  }),
  AuditLog: createEntityStore({
    entityName: "AuditLog",
    seedRecords: seedAppData.AuditLog,
    modelPath: "../models/AuditLog",
    idPrefix: "audit",
  }),
  User: createEntityStore({
    entityName: "User",
    seedRecords: seedAppData.User,
    modelPath: "../models/User",
    idPrefix: "user",
  }),
};

// Seed all registered stores in parallel (typically called once at startup).
// Each store that implements ensureSeedData is invoked; stores without it are
// skipped. Resolves once every store has finished seeding. Side effect: may
// write seed data to the active backend.
async function ensureSeedData() {
  await Promise.all(
    Object.values(stores).map((store) => {
      if (typeof store.ensureSeedData === "function") {
        return store.ensureSeedData();
      }

      // Store has no seeding step -> resolve immediately.
      return Promise.resolve();
    })
  );
}

// Export the entity registry and the bulk seeding helper.
module.exports = {
  stores,
  ensureSeedData,
};
