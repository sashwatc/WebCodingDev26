const fs = require("fs");
const os = require("os");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ensureSeedData } = require("./lib/stores");
const { getDataBackendMode, isMongoMode, isSupabaseMode } = require("./lib/dataBackend");
const { ensureSupabaseStorageBucket } = require("./lib/supabase");

const app = express();
const PORT = process.env.PORT || 5001;
const mongoUri = process.env.MONGO_URI;
const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
const dataBackendMode = getDataBackendMode();
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const hasBuiltClient = fs.existsSync(INDEX_FILE);

function getLocalDevHostnames() {
  const hostnames = new Set(["localhost", "127.0.0.1", "::1"]);

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.internal || entry.family !== "IPv4" || !entry.address) {
        continue;
      }

      hostnames.add(entry.address);
    }
  }

  return hostnames;
}

const LOCAL_DEV_HOSTNAMES = getLocalDevHostnames();

function isPrivateNetworkHostname(hostname = "") {
  if (LOCAL_DEV_HOSTNAMES.has(hostname)) {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match) {
    const secondOctet = Number(match[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

const itemRoutes = require("./routes/items");
const entityRoutes = require("./routes/entities");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/uploads");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      try {
        const parsedOrigin = new URL(normalizedOrigin);
        if (isPrivateNetworkHostname(parsedOrigin.hostname)) {
          callback(null, true);
          return;
        }
      } catch {
        // Fall through to the explicit allowlist checks below.
      }

      if (frontendUrl && normalizedOrigin === frontendUrl) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    dataBackend: dataBackendMode,
  });
});

app.use("/api/items", itemRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);

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
    if (isMongoMode()) {
      console.log("MONGO_URI loaded:", true);
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected");
    } else if (isSupabaseMode()) {
      console.log("Supabase mode enabled");
      await ensureSupabaseStorageBucket();
    } else {
      console.log(`Starting API on port ${PORT} using local data store`);
    }

    await ensureSeedData();

    if (hasBuiltClient) {
      console.log(`Serving built frontend from ${DIST_DIR}`);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const errorLabel = isMongoMode()
      ? "MongoDB connection failed:"
      : isSupabaseMode()
        ? "Supabase startup failed:"
        : "Startup failed:";
    console.error(errorLabel, error.message);
    process.exit(1);
  }
}

void startServer();
