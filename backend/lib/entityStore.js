/**
 * entityStore.js
 *
 * Factory that builds a generic, backend-agnostic CRUD store for a single
 * entity/collection (e.g. LostReport, Claim, Notification, AuditLog, User).
 *
 * Each store exposes the same async interface (ensureSeedData, list, findById,
 * findOne, create, save, remove, upsert) and internally dispatches to one of
 * three storage backends depending on the active mode reported by
 * ./dataBackend:
 *   - local:    reads/writes a JSON file at ../data/<entityName>.local.json
 *   - supabase: delegates to a per-table store from ./supabaseStore
 *   - mongo:    lazily requires a Mongoose model (modelPath) and uses it
 *
 * This keeps every consumer of the store ignorant of which backend is live.
 * (itemStore.js is a hand-written equivalent specialized for FoundItem.)
 */

const fs = require("fs");
const path = require("path");
const createSupabaseStore = require("./supabaseStore");
const { isLocalMode, isSupabaseMode } = require("./dataBackend");

// Deep-clone a JSON-serializable value so callers never share mutable
// references with the underlying in-memory/file-backed records.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Generate a pseudo-random unique id of the form "<prefix>_<8 base36 chars>"
// (used by the local and mongo paths when a record has no explicit id).
function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Predicate used by the local backend to test whether a record satisfies a
// set of equality filters. Empty/undefined/null filter values are ignored
// (treated as "no constraint"). Array-valued record fields match if they
// contain the filter value; otherwise a strict === comparison is used.
function matchRecord(record, filters = {}) {
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const recordValue = record?.[key];
    if (Array.isArray(recordValue)) {
      return recordValue.includes(value);
    }

    return recordValue === value;
  });
}

/**
 * Build a CRUD store for one entity.
 *
 * @param {Object}   options
 * @param {string}   options.entityName  Logical entity name; drives the local
 *                                       JSON filename and the derived Supabase
 *                                       table name.
 * @param {Array}    options.seedRecords Initial records used to seed empty
 *                                       storage (defaults to []).
 * @param {string}   options.modelPath   Module path of the Mongoose model,
 *                                       required only by the mongo backend.
 * @param {string}   options.idPrefix    Prefix for auto-generated record ids.
 * @returns {Object} Object of async CRUD methods (see returned object below).
 */
function createEntityStore({ entityName, seedRecords = [], modelPath, idPrefix }) {
  // Absolute path of the per-entity JSON file used in local mode.
  const dataFile = path.resolve(__dirname, `../data/${entityName}.local.json`);
  // Pre-built Supabase-backed store. Table name is derived by converting the
  // camelCase entityName to snake_case and pluralizing (e.g. LostReport ->
  // "lost_reports", AuditLog -> "audit_logs").
  const supabaseStore = createSupabaseStore({
    tableName: `${entityName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}s`,
    seedRecords,
    idPrefix,
  });

  // Ensure the local data directory and JSON file exist; create the file
  // pre-populated with seedRecords on first use. Side effect: filesystem writes.
  function ensureLocalDataFile() {
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(seedRecords, null, 2));
    }
  }

  // Read and parse all records from the local JSON file. Falls back to a clone
  // of seedRecords if the file content is not a valid JSON array or fails to
  // parse, guaranteeing an array is always returned.
  function readLocalRecords() {
    ensureLocalDataFile();
    const raw = fs.readFileSync(dataFile, "utf8");

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : clone(seedRecords);
    } catch {
      return clone(seedRecords);
    }
  }

  // Overwrite the local JSON file with the provided records array (pretty
  // printed). Side effect: filesystem write.
  function writeLocalRecords(records) {
    ensureLocalDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(records, null, 2));
  }

  // Lazily require and return the Mongoose model for this entity. Deferred so
  // the model (and a Mongo connection) is only loaded when mongo mode is active.
  async function getMongoModel() {
    return require(modelPath);
  }

  return {
    // Seed empty storage with the initial records, branching by backend.
    // - local:    just ensure the JSON file exists (already seeded on create).
    // - supabase: delegate to the Supabase store's seeding routine.
    // - mongo:    insert seedRecords only if the collection is currently empty.
    // Returns nothing; performs writes as a side effect.
    async ensureSeedData() {
      if (isLocalMode()) {
        ensureLocalDataFile();
        return;
      }

      if (isSupabaseMode()) {
        await supabaseStore.ensureSeedData();
        return;
      }

      const Model = await getMongoModel();
      const count = await Model.countDocuments();

      // Only seed when the collection is empty so we never duplicate records.
      if (count === 0 && seedRecords.length > 0) {
        await Model.insertMany(clone(seedRecords));
      }
    },

    // Return all records for this entity.
    // - local:    a deep clone of the JSON file contents.
    // - supabase: delegate to the Supabase store.
    // - mongo:    plain (lean) documents from the collection.
    async list() {
      if (isLocalMode()) {
        return clone(readLocalRecords());
      }

      if (isSupabaseMode()) {
        return supabaseStore.list();
      }

      const Model = await getMongoModel();
      return Model.find().lean();
    },

    // Look up a single record by its `id` field. Returns the record (cloned in
    // local mode) or null/undefined when not found, per backend.
    async findById(id) {
      if (isLocalMode()) {
        const record = readLocalRecords().find((entry) => entry.id === id);
        return record ? clone(record) : null;
      }

      if (isSupabaseMode()) {
        return supabaseStore.findById(id);
      }

      const Model = await getMongoModel();
      return Model.findOne({ id }).lean();
    },

    // Find the first record matching the given equality filters (see
    // matchRecord). Returns the record or null when none matches.
    async findOne(filters = {}) {
      if (isLocalMode()) {
        const record = readLocalRecords().find((entry) => matchRecord(entry, filters));
        return record ? clone(record) : null;
      }

      if (isSupabaseMode()) {
        return supabaseStore.findOne(filters);
      }

      const Model = await getMongoModel();
      return Model.findOne(filters).lean();
    },

    // Create a new record. Auto-assigns id and created/updated timestamps when
    // absent (caller-supplied fields in `data` override the generated ones).
    // Returns the persisted record. Side effect: writes to the active backend.
    async create(data) {
      const now = new Date().toISOString();
      const record = {
        id: data.id || createId(idPrefix),
        created_date: data.created_date || now,
        updated_date: data.updated_date || now,
        ...clone(data),
      };

      if (isLocalMode()) {
        const records = readLocalRecords();
        // Prepend so newest records appear first in the file.
        records.unshift(record);
        writeLocalRecords(records);
        return clone(record);
      }

      if (isSupabaseMode()) {
        return supabaseStore.create(record);
      }

      const Model = await getMongoModel();
      const doc = new Model(record);
      const saved = await doc.save();
      return saved.toObject();
    },

    // Update an existing record (matched by id), merging `record` over the
    // stored values and refreshing updated_date. Throws a 404 error when the
    // record does not exist. Returns the updated record.
    async save(record) {
      if (isLocalMode()) {
        const records = readLocalRecords();
        const index = records.findIndex((entry) => entry.id === record.id);

        // Missing record is a hard 404 (the caller expected it to exist).
        if (index === -1) {
          const error = new Error(`${entityName} ${record.id} not found`);
          error.statusCode = 404;
          throw error;
        }

        // Shallow-merge new fields over existing ones and bump the timestamp.
        const nextRecord = {
          ...records[index],
          ...clone(record),
          updated_date: new Date().toISOString(),
        };

        records[index] = nextRecord;
        writeLocalRecords(records);
        return clone(nextRecord);
      }

      if (isSupabaseMode()) {
        return supabaseStore.save(record);
      }

      const Model = await getMongoModel();
      const doc = await Model.findOne({ id: record.id });

      // Same 404 contract as the local path.
      if (!doc) {
        const error = new Error(`${entityName} ${record.id} not found`);
        error.statusCode = 404;
        throw error;
      }

      Object.assign(doc, clone(record), {
        updated_date: new Date().toISOString(),
      });

      const saved = await doc.save();
      return saved.toObject();
    },

    // Delete a record by id. Returns the deleted record, or null when no
    // matching record exists. Side effect: writes to the active backend.
    async remove(id) {
      if (isLocalMode()) {
        const records = readLocalRecords();
        const index = records.findIndex((entry) => entry.id === id);

        // Nothing to delete -> signal absence with null (not an error).
        if (index === -1) {
          return null;
        }

        const [deleted] = records.splice(index, 1);
        writeLocalRecords(records);
        return clone(deleted);
      }

      if (isSupabaseMode()) {
        return supabaseStore.remove(id);
      }

      const Model = await getMongoModel();
      return Model.findOneAndDelete({ id }).lean();
    },

    // Update the first record matching `match`, or insert a new one if none
    // matches (upsert). Refreshes updated_date; sets id/created_date only on
    // insert. Returns the upserted record.
    async upsert(match, data) {
      if (isLocalMode()) {
        const records = readLocalRecords();
        const index = records.findIndex((entry) => matchRecord(entry, match));
        const now = new Date().toISOString();

        // Existing record found -> merge updates over it (update branch).
        if (index >= 0) {
          const updatedRecord = {
            ...records[index],
            ...clone(data),
            updated_date: now,
          };
          records[index] = updatedRecord;
          writeLocalRecords(records);
          return clone(updatedRecord);
        }

        // No match -> create a brand-new record (insert branch).
        const createdRecord = {
          id: data.id || createId(idPrefix),
          created_date: now,
          updated_date: now,
          ...clone(data),
        };
        records.unshift(createdRecord);
        writeLocalRecords(records);
        return clone(createdRecord);
      }

      if (isSupabaseMode()) {
        return supabaseStore.upsert(match, data);
      }

      const Model = await getMongoModel();
      const now = new Date().toISOString();
      // Mongo atomic upsert: $set always applies the new data + timestamp,
      // while $setOnInsert provides id/created_date only when inserting.
      const updated = await Model.findOneAndUpdate(
        match,
        {
          $set: {
            ...clone(data),
            updated_date: now,
          },
          $setOnInsert: {
            id: data.id || createId(idPrefix),
            created_date: now,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      return updated.toObject();
    },
  };
}

// Export the factory used by stores.js to instantiate one store per entity.
module.exports = createEntityStore;
