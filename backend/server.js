const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;
const mongoUri = process.env.MONGO_URI;
const usingLocalItemStore = !mongoUri;
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const hasBuiltClient = fs.existsSync(INDEX_FILE);

process.env.USE_LOCAL_ITEM_STORE = usingLocalItemStore ? "true" : "false";

const itemRoutes = require("./routes/items");

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    itemStore: usingLocalItemStore ? "local" : "mongo",
  });
});

app.use("/api/items", itemRoutes);

if (hasBuiltClient) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(INDEX_FILE);
  });
} else {
  app.get("/", (req, res) => {
    res.send("Server is working");
  });
}

if (usingLocalItemStore) {
  console.log(`Starting API on port ${PORT} using local item store`);
  if (hasBuiltClient) {
    console.log(`Serving built frontend from ${DIST_DIR}`);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  console.log("MONGO_URI loaded:", true);

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB connected");
      if (hasBuiltClient) {
        console.log(`Serving built frontend from ${DIST_DIR}`);
      }
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}
