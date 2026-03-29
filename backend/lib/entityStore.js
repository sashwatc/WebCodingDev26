const fs = require("fs");
const path = require("path");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function isLocalMode() {
  return process.env.USE_LOCAL_ITEM_STORE === "true";
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

function createEntityStore({ entityName, seedRecords = [], modelPath, idPrefix }) {
  const dataFile = path.resolve(__dirname, `../data/${entityName}.local.json`);

  function ensureLocalDataFile() {
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(seedRecords, null, 2));
    }
  }

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

  function writeLocalRecords(records) {
    ensureLocalDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(records, null, 2));
  }

  async function getMongoModel() {
    return require(modelPath);
  }

  return {
    async ensureSeedData() {
      if (isLocalMode()) {
        ensureLocalDataFile();
        return;
      }

      const Model = await getMongoModel();
      const count = await Model.countDocuments();

      if (count === 0 && seedRecords.length > 0) {
        await Model.insertMany(clone(seedRecords));
      }
    },

    async list() {
      if (isLocalMode()) {
        return clone(readLocalRecords());
      }

      const Model = await getMongoModel();
      return Model.find().lean();
    },

    async findById(id) {
      if (isLocalMode()) {
        const record = readLocalRecords().find((entry) => entry.id === id);
        return record ? clone(record) : null;
      }

      const Model = await getMongoModel();
      return Model.findOne({ id }).lean();
    },

    async findOne(filters = {}) {
      if (isLocalMode()) {
        const record = readLocalRecords().find((entry) => matchRecord(entry, filters));
        return record ? clone(record) : null;
      }

      const Model = await getMongoModel();
      return Model.findOne(filters).lean();
    },

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
        records.unshift(record);
        writeLocalRecords(records);
        return clone(record);
      }

      const Model = await getMongoModel();
      const doc = new Model(record);
      const saved = await doc.save();
      return saved.toObject();
    },

    async save(record) {
      if (isLocalMode()) {
        const records = readLocalRecords();
        const index = records.findIndex((entry) => entry.id === record.id);

        if (index === -1) {
          const error = new Error(`${entityName} ${record.id} not found`);
          error.statusCode = 404;
          throw error;
        }

        const nextRecord = {
          ...records[index],
          ...clone(record),
          updated_date: new Date().toISOString(),
        };

        records[index] = nextRecord;
        writeLocalRecords(records);
        return clone(nextRecord);
      }

      const Model = await getMongoModel();
      const doc = await Model.findOne({ id: record.id });

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

    async remove(id) {
      if (isLocalMode()) {
        const records = readLocalRecords();
        const index = records.findIndex((entry) => entry.id === id);

        if (index === -1) {
          return null;
        }

        const [deleted] = records.splice(index, 1);
        writeLocalRecords(records);
        return clone(deleted);
      }

      const Model = await getMongoModel();
      return Model.findOneAndDelete({ id }).lean();
    },

    async upsert(match, data) {
      if (isLocalMode()) {
        const records = readLocalRecords();
        const index = records.findIndex((entry) => matchRecord(entry, match));
        const now = new Date().toISOString();

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

      const Model = await getMongoModel();
      const now = new Date().toISOString();
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

module.exports = createEntityStore;
