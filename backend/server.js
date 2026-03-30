const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ensureSeedData } = require("./lib/stores");

const app = express();
const PORT = process.env.PORT || 5001;
const mongoUri = process.env.MONGO_URI;
const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
const usingLocalItemStore = !mongoUri;
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const hasBuiltClient = fs.existsSync(INDEX_FILE);
const LOCAL_DEV_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

process.env.USE_LOCAL_ITEM_STORE = usingLocalItemStore ? "true" : "false";

const itemRoutes = require("./routes/items");
const entityRoutes = require("./routes/entities");
const authRoutes = require("./routes/auth");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, "");
      if (LOCAL_DEV_ORIGINS.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      if (frontendUrl && normalizedOrigin === frontendUrl) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    itemStore: usingLocalItemStore ? "local" : "mongo",
  });
});

app.use("/api/items", itemRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/auth", authRoutes);

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

async function startServer() {
  try {
    if (usingLocalItemStore) {
      console.log(`Starting API on port ${PORT} using local data store`);
    } else {
      console.log("MONGO_URI loaded:", true);
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected");
    }

    await ensureSeedData();

    if (hasBuiltClient) {
      console.log(`Serving built frontend from ${DIST_DIR}`);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(usingLocalItemStore ? "Startup failed:" : "MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

void startServer();
