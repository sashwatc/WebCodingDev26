/**
 * supabaseStore.js
 *
 * Factory that builds a generic CRUD store backed by a single Supabase
 * (Postgres) table. Used by entityStore and itemStore whenever the active
 * backend is "supabase".
 *
 * Storage convention: each table has fixed columns `id`, `created_at`,
 * `updated_at`, and a JSON `data` column holding the rest of the record's
 * fields. This module translates between that on-disk shape (rows) and the
 * flat application record shape:
 *   - flattenRow(): row  -> flat app record (merges data, surfaces id/dates in
 *     both snake_case and camelCase for compatibility).
 *   - buildRow():   flat app record -> row (extracts id/timestamps, nests the
 *     remaining fields under `data`).
 *
 * Returned methods mirror the common store interface: ensureSeedData, list,
 * findById, findOne, create, save, remove, upsert.
 */

const { getSupabaseAdminClient } = require("./supabase");

// Deep-clone a JSON-serializable value to avoid shared mutable references.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Generate a unique id of the form "<prefix>_<8 base36 chars>".
function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Equality-filter predicate (same semantics as entityStore.matchRecord):
// empty filter values are ignored; array fields match by inclusion; otherwise
// strict ===. Used for in-memory filtering of already-fetched records.
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

// Convert a stored DB row into a flat application record. Merges configured
// `defaults` under the row's JSON `data`, then surfaces id and timestamps at
// the top level in both snake_case (created_date/updated_date) and camelCase
// (createdAt/updatedAt) so either convention works downstream. Returns null
// for a falsy row.
function flattenRow(row, { defaults = {} } = {}) {
  if (!row) {
    return null;
  }

  return {
    ...clone(defaults),
    ...clone(row.data || {}),
    id: row.id,
    created_date: row.created_at || "",
    updated_date: row.updated_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

// Convert a flat application record into a DB row. Applies defaults, derives
// id (generating one if absent) and created/updated timestamps from whichever
// naming convention the record used, then strips the id/_id/timestamp keys out
// of the JSON `data` payload (they live in dedicated columns).
function buildRow(record, { idPrefix, defaults = {} } = {}) {
  const now = new Date().toISOString();
  const nextRecord = {
    ...clone(defaults),
    ...clone(record || {}),
  };
  const id = nextRecord.id || createId(idPrefix);
  // Accept either snake_case or camelCase timestamps; default to now.
  const createdAt = nextRecord.created_date || nextRecord.createdAt || now;
  const updatedAt = nextRecord.updated_date || nextRecord.updatedAt || now;

  // Remove identity/timestamp fields so they aren't duplicated inside `data`.
  delete nextRecord.id;
  delete nextRecord._id;
  delete nextRecord.created_date;
  delete nextRecord.updated_date;
  delete nextRecord.createdAt;
  delete nextRecord.updatedAt;

  return {
    id,
    data: nextRecord,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

/**
 * Build a Supabase-backed CRUD store for one table.
 *
 * @param {Object}   options
 * @param {string}   options.tableName   Supabase table name to operate on.
 * @param {Array}    options.seedRecords Records to insert when seeding an empty
 *                                       table (defaults to []).
 * @param {string}   options.idPrefix    Prefix for auto-generated record ids.
 * @param {Object}   options.defaults    Default fields merged into every
 *                                       record on read and write.
 * @returns {Object} Async CRUD methods (see returned object below).
 */
function createSupabaseStore({ tableName, seedRecords = [], idPrefix, defaults = {} }) {
  // Helper returning a query builder bound to this store's table.
  function getTable() {
    return getSupabaseAdminClient().from(tableName);
  }

  // Fetch all rows ordered newest-first by created_at. Throws on query error;
  // returns [] when the table is empty.
  async function listRows() {
    const { data, error } = await getTable().select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }

    return data || [];
  }

  return {
    // Seed the table with seedRecords only when it is currently empty. Uses a
    // head count query to check existing rows, then bulk-inserts built rows.
    // Throws on Supabase errors. Side effect: inserts seed rows.
    async ensureSeedData() {
      // Head-only count query (no rows returned, just the total).
      const { count, error } = await getTable().select("*", { count: "exact", head: true });

      if (error) {
        throw new Error(`Failed to inspect ${tableName}: ${error.message}`);
      }

      // Skip seeding if the table already has rows or there is nothing to seed.
      if ((count || 0) > 0 || seedRecords.length === 0) {
        return;
      }

      const rows = seedRecords.map((record) => buildRow(record, { idPrefix, defaults }));
      const { error: insertError } = await getTable().insert(rows);

      if (insertError) {
        throw new Error(`Failed to seed ${tableName}: ${insertError.message}`);
      }
    },

    // Return all records (newest first), each flattened to app record shape.
    async list() {
      const rows = await listRows();
      return rows.map((row) => flattenRow(row, { defaults }));
    },

    // Fetch a single record by id. Uses maybeSingle so a missing row yields
    // null (not an error). Throws on query error.
    async findById(id) {
      const { data, error } = await getTable().select("*").eq("id", id).maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch ${tableName} ${id}: ${error.message}`);
      }

      return flattenRow(data, { defaults });
    },

    // Find the first record matching `filters`. Note: fetches the full list and
    // filters in memory (Supabase JSON `data` fields are not queried directly).
    async findOne(filters = {}) {
      const records = await this.list();
      return records.find((record) => matchRecord(record, filters)) || null;
    },

    // Insert a new record (id/timestamps assigned by buildRow). Returns the
    // inserted record flattened to app shape. Throws on query error.
    async create(data) {
      const row = buildRow(data, { idPrefix, defaults });
      const { data: insertedRows, error } = await getTable().insert(row).select("*").limit(1);

      if (error) {
        throw new Error(`Failed to create ${tableName}: ${error.message}`);
      }

      return flattenRow(insertedRows?.[0], { defaults });
    },

    // Update an existing record by id. Loads the current record first (404 if
    // missing), merges new fields over it, preserves the original created
    // timestamps, and refreshes the updated timestamps. Returns the updated
    // record. Throws on missing record (statusCode 404) or query error.
    async save(record) {
      const existing = await this.findById(record.id);

      if (!existing) {
        const error = new Error(`${tableName} ${record.id} not found`);
        error.statusCode = 404;
        throw error;
      }

      const row = buildRow(
        {
          ...existing,
          ...clone(record),
          // Keep original creation time; force-update the modified time.
          created_date: existing.created_date,
          createdAt: existing.createdAt,
          updated_date: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { idPrefix, defaults }
      );

      const { data: updatedRows, error } = await getTable().update(row).eq("id", record.id).select("*").limit(1);

      if (error) {
        throw new Error(`Failed to update ${tableName} ${record.id}: ${error.message}`);
      }

      return flattenRow(updatedRows?.[0], { defaults });
    },

    // Delete a record by id. Returns the deleted record (flattened) or null
    // when no row matched. Throws on query error.
    async remove(id) {
      const { data: deletedRows, error } = await getTable().delete().eq("id", id).select("*").limit(1);

      if (error) {
        throw new Error(`Failed to delete ${tableName} ${id}: ${error.message}`);
      }

      return flattenRow(deletedRows?.[0], { defaults });
    },

    // Update the first record matching `match`, or create one if none exists.
    // Matching is done in memory over the full list (see findOne). Returns the
    // upserted record.
    async upsert(match, data) {
      const records = await this.list();
      const existing = records.find((record) => matchRecord(record, match));

      // Found a match -> merge updates over it via save (update branch).
      if (existing) {
        return this.save({
          ...existing,
          ...clone(data),
        });
      }

      // No match -> create combining the match criteria with the new data.
      return this.create({
        ...clone(match),
        ...clone(data),
      });
    },
  };
}

// Export the factory used by entityStore/itemStore for Supabase-backed tables.
module.exports = createSupabaseStore;
