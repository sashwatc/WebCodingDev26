/**
 * itemStore.js
 *
 * Specialized data-access store for "found items" (the FoundItem entity).
 * Mirrors the generic entityStore interface (ensureSeedData, list, create,
 * findById, save, remove) but is hand-written because found items have extra
 * behavior: input validation, default media fields (imageUrl/photoUrls/
 * ratings), createdAt-descending sorting, and Mongo id-or-_id lookups.
 *
 * Like entityStore, every method dispatches to the active backend reported by
 * ./dataBackend:
 *   - supabase: delegate to a Supabase store bound to the "found_items" table.
 *   - mongo:    use the Mongoose ../models/Item model.
 *   - local:    read/write ../data/items.local.json (default fallback).
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const createSupabaseStore = require("./supabaseStore");
const { isLocalMode, isSupabaseMode } = require("./dataBackend");

// Seed data used to populate empty storage on first run.
const seedItems = require("../data/seedItems");

// Local-mode storage location: ../data/items.local.json.
const DATA_DIR = path.resolve(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "items.local.json");

// Deep-clone a JSON-serializable value to avoid sharing mutable references.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Ensure the local data dir and items JSON file exist, seeding the file with
// seedItems on first creation. Side effect: filesystem writes.
function ensureLocalDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedItems, null, 2));
  }
}

// Read/parse all found items from the local JSON file, falling back to a clone
// of seedItems if the contents are missing/invalid. Always returns an array.
function readLocalItems() {
  ensureLocalDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(seedItems);
  } catch {
    return clone(seedItems);
  }
}

// Overwrite the local items JSON file with the provided array. Side effect:
// filesystem write.
function writeLocalItems(items) {
  ensureLocalDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

// Lazily require the Mongoose Item model (only needed in mongo mode).
async function getMongoModel() {
  return require("../models/Item");
}

// Supabase-backed store for the "found_items" table, pre-configured with the
// media/rating default fields applied to every row.
const supabaseStore = createSupabaseStore({
  tableName: "found_items",
  seedRecords: seedItems,
  idPrefix: "found",
  defaults: {
    imageUrl: "",
    photoUrls: [],
    ratings: [],
  },
});

// Build a Mongo query that matches by the app-level `id` field, and also by
// `_id` when the supplied id is a valid ObjectId. Allows lookups by either
// identifier.
function buildMongoIdQuery(id) {
  const query = [{ id }];

  if (mongoose.Types.ObjectId.isValid(id)) {
    query.push({ _id: id });
  }

  return { $or: query };
}

// Return a new array of items sorted newest-first by createdAt (missing dates
// sort as epoch 0). Does not mutate the input.
function sortByCreatedDateDesc(items) {
  return [...items].sort((first, second) => {
    const a = new Date(first.createdAt || 0).getTime();
    const b = new Date(second.createdAt || 0).getTime();
    return b - a;
  });
}

// Ensure local item records always expose the media/rating fields, applying
// empty defaults that the record's own values override.
function normalizeLocalItem(record = {}) {
  return {
    imageUrl: "",
    photoUrls: [],
    ratings: [],
    ...record,
  };
}

// List all found items, newest first.
// - supabase: delegate to the Supabase store.
// - mongo:    Item.find() sorted by createdAt desc, returned lean.
// - local:    sorted + normalized + cloned records from the JSON file.
async function list() {
  if (isSupabaseMode()) {
    return supabaseStore.list();
  }

  if (!isLocalMode()) {
    const Item = await getMongoModel();
    return Item.find().sort({ createdAt: -1 }).lean();
  }

  return sortByCreatedDateDesc(readLocalItems()).map((item) => clone(normalizeLocalItem(item)));
}

// Create a new found item.
// Validates that title and description are present (throws a ValidationError
// otherwise). Auto-generates id/createdAt/updatedAt and applies media defaults.
// Returns the persisted item. Side effect: writes to the active backend.
async function create(data) {
  // Required-field validation applies regardless of backend.
  if (!data.title || !data.description) {
    const error = new Error("title and description are required");
    error.name = "ValidationError";
    throw error;
  }

  if (isSupabaseMode()) {
    // Spread defaults first so caller data overrides them.
    return supabaseStore.create({
      imageUrl: "",
      photoUrls: [],
      ratings: [],
      ...clone(data),
    });
  }

  if (!isLocalMode()) {
    // Mongo: let the model apply its own schema defaults/timestamps.
    const Item = await getMongoModel();
    const newItem = new Item(data);
    const saved = await newItem.save();
    return saved.toObject();
  }

  // Local: assign id + timestamps, normalize defaults, prepend (newest first).
  const items = readLocalItems();
  const now = new Date().toISOString();
  const id = data.id || `found_${Math.random().toString(36).slice(2, 10)}`;
  const nextItem = normalizeLocalItem({
    id,
    createdAt: now,
    updatedAt: now,
    ...clone(data),
  });

  items.unshift(nextItem);
  writeLocalItems(items);
  return clone(nextItem);
}

// Find a single found item by id (or _id in mongo). Returns the item or null
// when not found.
async function findById(id) {
  if (isSupabaseMode()) {
    return supabaseStore.findById(id);
  }

  if (!isLocalMode()) {
    const Item = await getMongoModel();
    return Item.findOne(buildMongoIdQuery(id));
  }

  const item = readLocalItems().find((record) => record.id === id);
  return item ? clone(normalizeLocalItem(item)) : null;
}

// Update an existing found item, merging `item` over the stored record and
// refreshing updatedAt (local). Throws a 404 error when the item is missing.
// Returns the updated item.
async function save(item) {
  if (isSupabaseMode()) {
    return supabaseStore.save({
      imageUrl: "",
      photoUrls: [],
      ratings: [],
      ...clone(item),
    });
  }

  if (!isLocalMode()) {
    // Mongo: locate by id or _id, then assign and re-save.
    const Item = await getMongoModel();
    const doc = await Item.findOne(buildMongoIdQuery(item.id || item._id));

    if (!doc) {
      const error = new Error("Item not found");
      error.statusCode = 404;
      throw error;
    }

    Object.assign(doc, clone(item));
    const saved = await doc.save();
    return saved.toObject();
  }

  // Local: find by id, merge updates over existing record, bump updatedAt.
  const items = readLocalItems();
  const index = items.findIndex((record) => record.id === item.id);

  if (index === -1) {
    const error = new Error("Item not found");
    error.statusCode = 404;
    throw error;
  }

  const nextItem = normalizeLocalItem({
    ...items[index],
    ...clone(item),
    updatedAt: new Date().toISOString(),
  });

  items[index] = nextItem;
  writeLocalItems(items);
  return clone(nextItem);
}

// Delete a found item by id. Returns the deleted item, or null when no match
// exists. Side effect: writes to the active backend.
async function remove(id) {
  if (isSupabaseMode()) {
    return supabaseStore.remove(id);
  }

  if (!isLocalMode()) {
    const Item = await getMongoModel();
    return Item.findOneAndDelete(buildMongoIdQuery(id)).lean();
  }

  const items = readLocalItems();
  const index = items.findIndex((record) => record.id === id);

  // No matching item -> null rather than an error.
  if (index === -1) {
    return null;
  }

  const [deletedItem] = items.splice(index, 1);
  writeLocalItems(items);
  return clone(deletedItem);
}

// Seed empty storage with seedItems, branching by backend.
// - local:    ensure the JSON file exists.
// - supabase: delegate to the Supabase store's seeding routine.
// - mongo:    insert seedItems only when the collection is empty.
async function ensureSeedData() {
  if (isLocalMode()) {
    ensureLocalDataFile();
    return;
  }

  if (isSupabaseMode()) {
    await supabaseStore.ensureSeedData();
    return;
  }

  const Item = await getMongoModel();
  const count = await Item.countDocuments();

  // Avoid duplicate seeding by only inserting into an empty collection.
  if (count === 0 && seedItems.length > 0) {
    await Item.insertMany(clone(seedItems));
  }
}

// Public API: re-export isLocalMode plus the found-item CRUD methods.
module.exports = {
  isLocalMode,
  ensureSeedData,
  list,
  create,
  findById,
  save,
  remove,
};
