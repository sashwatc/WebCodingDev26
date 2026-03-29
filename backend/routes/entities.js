const express = require("express");
const router = express.Router();
const { stores } = require("../lib/stores");

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
    const record = await store.create(req.body || {});
    res.status(201).json(record);
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    res.status(statusCode).json({
      message: `Failed to create ${req.params.entityName}`,
      error: error.message,
    });
  }
});

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

    const nextRecord = await store.save({
      ...previousRecord,
      ...(req.body || {}),
    });

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
