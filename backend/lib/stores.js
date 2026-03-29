const seedAppData = require("../data/seedAppData");
const createEntityStore = require("./entityStore");
const itemStore = require("./itemStore");

const stores = {
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

async function ensureSeedData() {
  await Promise.all(
    Object.values(stores).map((store) => {
      if (typeof store.ensureSeedData === "function") {
        return store.ensureSeedData();
      }

      return Promise.resolve();
    })
  );
}

module.exports = {
  stores,
  ensureSeedData,
};
