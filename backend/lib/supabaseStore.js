const { getSupabaseAdminClient } = require("./supabase");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

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

function buildRow(record, { idPrefix, defaults = {} } = {}) {
  const now = new Date().toISOString();
  const nextRecord = {
    ...clone(defaults),
    ...clone(record || {}),
  };
  const id = nextRecord.id || createId(idPrefix);
  const createdAt = nextRecord.created_date || nextRecord.createdAt || now;
  const updatedAt = nextRecord.updated_date || nextRecord.updatedAt || now;

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

function createSupabaseStore({ tableName, seedRecords = [], idPrefix, defaults = {} }) {
  function getTable() {
    return getSupabaseAdminClient().from(tableName);
  }

  async function listRows() {
    const { data, error } = await getTable().select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }

    return data || [];
  }

  return {
    async ensureSeedData() {
      const { count, error } = await getTable().select("*", { count: "exact", head: true });

      if (error) {
        throw new Error(`Failed to inspect ${tableName}: ${error.message}`);
      }

      if ((count || 0) > 0 || seedRecords.length === 0) {
        return;
      }

      const rows = seedRecords.map((record) => buildRow(record, { idPrefix, defaults }));
      const { error: insertError } = await getTable().insert(rows);

      if (insertError) {
        throw new Error(`Failed to seed ${tableName}: ${insertError.message}`);
      }
    },

    async list() {
      const rows = await listRows();
      return rows.map((row) => flattenRow(row, { defaults }));
    },

    async findById(id) {
      const { data, error } = await getTable().select("*").eq("id", id).maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch ${tableName} ${id}: ${error.message}`);
      }

      return flattenRow(data, { defaults });
    },

    async findOne(filters = {}) {
      const records = await this.list();
      return records.find((record) => matchRecord(record, filters)) || null;
    },

    async create(data) {
      const row = buildRow(data, { idPrefix, defaults });
      const { data: insertedRows, error } = await getTable().insert(row).select("*").limit(1);

      if (error) {
        throw new Error(`Failed to create ${tableName}: ${error.message}`);
      }

      return flattenRow(insertedRows?.[0], { defaults });
    },

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

    async remove(id) {
      const { data: deletedRows, error } = await getTable().delete().eq("id", id).select("*").limit(1);

      if (error) {
        throw new Error(`Failed to delete ${tableName} ${id}: ${error.message}`);
      }

      return flattenRow(deletedRows?.[0], { defaults });
    },

    async upsert(match, data) {
      const records = await this.list();
      const existing = records.find((record) => matchRecord(record, match));

      if (existing) {
        return this.save({
          ...existing,
          ...clone(data),
        });
      }

      return this.create({
        ...clone(match),
        ...clone(data),
      });
    },
  };
}

module.exports = createSupabaseStore;
