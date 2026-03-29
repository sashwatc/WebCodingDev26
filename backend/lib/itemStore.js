const fs = require("fs");
const path = require("path");

const seedItems = require("../data/seedItems");

const DATA_DIR = path.resolve(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "items.local.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isLocalMode() {
  return process.env.USE_LOCAL_ITEM_STORE === "true";
}

function ensureLocalDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedItems, null, 2));
  }
}

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

function writeLocalItems(items) {
  ensureLocalDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

async function getMongoModel() {
  return require("../models/Item");
}

function sortByCreatedDateDesc(items) {
  return [...items].sort((first, second) => {
    const a = new Date(first.createdAt || 0).getTime();
    const b = new Date(second.createdAt || 0).getTime();
    return b - a;
  });
}

function normalizeLocalItem(record = {}) {
  return {
    imageUrl: "",
    photoUrls: [],
    ratings: [],
    ...record,
  };
}

async function list() {
  if (!isLocalMode()) {
    const Item = await getMongoModel();
    return Item.find().sort({ createdAt: -1 });
  }

  return sortByCreatedDateDesc(readLocalItems()).map((item) => clone(normalizeLocalItem(item)));
}

async function create(data) {
  if (!data.title || !data.description) {
    const error = new Error("title and description are required");
    error.name = "ValidationError";
    throw error;
  }

  if (!isLocalMode()) {
    const Item = await getMongoModel();
    const newItem = new Item(data);
    return newItem.save();
  }

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

async function findById(id) {
  if (!isLocalMode()) {
    const Item = await getMongoModel();
    return Item.findById(id);
  }

  const item = readLocalItems().find((record) => record.id === id);
  return item ? clone(normalizeLocalItem(item)) : null;
}

async function save(item) {
  if (!isLocalMode()) {
    return item.save();
  }

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

async function remove(id) {
  if (!isLocalMode()) {
    const Item = await getMongoModel();
    return Item.findByIdAndDelete(id);
  }

  const items = readLocalItems();
  const index = items.findIndex((record) => record.id === id);

  if (index === -1) {
    return null;
  }

  const [deletedItem] = items.splice(index, 1);
  writeLocalItems(items);
  return clone(deletedItem);
}

module.exports = {
  isLocalMode,
  list,
  create,
  findById,
  save,
  remove,
};
