/**
 * backend/server.js
 *
 * Main Express application entry point for the Lost & Found backend API.
 *
 * Responsibilities:
 *  - Loads environment configuration from the project-root `.env` file.
 *  - Configures CORS so that the frontend (and any device on the local/private
 *    network during development) can call the API.
 *  - Mounts the REST API routers under `/api/*` (items, entities, auth, uploads).
 *  - Optionally serves the pre-built frontend (the Vite `dist/` bundle) when it
 *    exists, falling back to single-page-app routing for non-`/api` paths.
 *  - Selects and initializes the active data backend (MongoDB, Supabase, or a
 *    local in-process data store) and seeds initial data before listening.
 *
 * This module both constructs the app and starts the HTTP server at the bottom
 * (`startServer()`), so simply requiring/importing it boots the API.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

// Load environment variables from the project-root `.env` (one level above this
// `backend/` directory) so the same config is shared across the whole project.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ensureSeedData } = require("./lib/stores");
const { getDataBackendMode, isMongoMode, isSupabaseMode } = require("./lib/dataBackend");
const { ensureSupabaseStorageBucket } = require("./lib/supabase");

const app = express();
// Port to listen on; defaults to 5001 when PORT is not set in the environment.
const PORT = process.env.PORT || 5001;
// MongoDB connection string (only used when running in Mongo mode).
const mongoUri = process.env.MONGO_URI;
// Allowed frontend origin for CORS; trailing slash is stripped for exact-match comparison.
const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
// Which data backend is active: "mongo", "supabase", or local store (see dataBackend lib).
const dataBackendMode = getDataBackendMode();
// Filesystem locations for the optional pre-built frontend bundle.
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
// True when a built client exists, so the server should also serve the SPA.
const hasBuiltClient = fs.existsSync(INDEX_FILE);

// Build the set of hostnames/IPs that count as "this development machine".
// Starts with the loopback names and then adds every non-internal IPv4 address
// bound to a local network interface (so phones/other devices on the LAN that
// hit this machine's LAN IP are recognized as local during development).
// Returns: a Set<string> of hostname/IP strings.
function getLocalDevHostnames() {
  const hostnames = new Set(["localhost", "127.0.0.1", "::1"]);

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      // Skip loopback/internal entries, non-IPv4 families, and missing addresses.
      if (entry.internal || entry.family !== "IPv4" || !entry.address) {
        continue;
      }

      hostnames.add(entry.address);
    }
  }

  return hostnames;
}

// Computed once at startup; reused by the CORS origin check below.
const LOCAL_DEV_HOSTNAMES = getLocalDevHostnames();

// Returns true when `hostname` is a private/local-network address that should be
// trusted by CORS during development. Recognizes the local dev hostnames plus the
// three RFC 1918 private IPv4 ranges. Inputs: hostname string. Returns: boolean.
function isPrivateNetworkHostname(hostname = "") {
  // Exact match against loopback names and this machine's own LAN IPs.
  if (LOCAL_DEV_HOSTNAMES.has(hostname)) {
    return true;
  }

  // 10.0.0.0/8 private range.
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  // 192.168.0.0/16 private range.
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  // 172.16.0.0/12 private range: the second octet must be between 16 and 31.
  // Capture the second octet so we can verify it falls inside that window.
  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match) {
    const secondOctet = Number(match[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

// API route modules, each an express.Router mounted under an `/api/*` prefix below.
const itemRoutes = require("./routes/items");
const entityRoutes = require("./routes/entities");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/uploads");

// Configure CORS with a dynamic origin function that decides per request whether
// the requesting origin is allowed.
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header (e.g. same-origin requests, curl, server-to-server): allow.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Normalize by removing any trailing slash for consistent comparison.
      const normalizedOrigin = origin.replace(/\/$/, "");

      try {
        // Allow any private/local-network origin during development.
        const parsedOrigin = new URL(normalizedOrigin);
        if (isPrivateNetworkHostname(parsedOrigin.hostname)) {
          callback(null, true);
          return;
        }
      } catch {
        // Origin was not a parseable URL.
        // Fall through to the explicit allowlist checks below.
      }

      // Allow the explicitly configured production frontend origin.
      if (frontendUrl && normalizedOrigin === frontendUrl) {
        callback(null, true);
        return;
      }

      // Otherwise reject the request with a CORS error.
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
// Parse JSON request bodies, allowing up to 20mb to accommodate base64 image uploads.
app.use(express.json({ limit: "20mb" }));

// Health-check endpoint. Returns { ok: true, dataBackend } so monitors/clients
// can confirm the API is up and learn which data backend is active.
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    dataBackend: dataBackendMode,
  });
});

// Mount each feature router under its API namespace.
app.use("/api/items", itemRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);

if (hasBuiltClient) {
  // Serve static assets from the built frontend bundle.
  app.use(express.static(DIST_DIR));
  // SPA fallback: any non-API route returns index.html so client-side routing works.
  app.use((req, res, next) => {
    // Let API requests continue to (eventually) 404 rather than serving HTML.
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(INDEX_FILE);
  });
} else {
  // No built client present: respond at the root with a simple liveness message.
  app.get("/", (req, res) => {
    res.send("Server is working");
  });
}

// Initializes the active data backend, seeds baseline data, and starts listening.
// Side effects: connects to MongoDB or provisions the Supabase storage bucket
// depending on mode, seeds data, and binds the HTTP server to PORT.
// On any startup failure it logs a mode-specific label and exits the process(1).
async function startServer() {
  try {
    if (isMongoMode()) {
      // Mongo mode: connect to the configured MongoDB instance.
      console.log("MONGO_URI loaded:", true);
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected");
    } else if (isSupabaseMode()) {
      // Supabase mode: make sure the storage bucket used for uploads exists.
      console.log("Supabase mode enabled");
      await ensureSupabaseStorageBucket();
    } else {
      // Fallback: in-process local data store, no external DB connection needed.
      console.log(`Starting API on port ${PORT} using local data store`);
    }

    // Populate baseline/seed records (idempotent) regardless of backend.
    await ensureSeedData();

    if (hasBuiltClient) {
      console.log(`Serving built frontend from ${DIST_DIR}`);
    }

    // Start accepting HTTP connections once initialization succeeded.
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Choose an error label that reflects which backend was being initialized.
    const errorLabel = isMongoMode()
      ? "MongoDB connection failed:"
      : isSupabaseMode()
        ? "Supabase startup failed:"
        : "Startup failed:";
    console.error(errorLabel, error.message);
    // Abort: a failed startup should not leave a half-initialized server running.
    process.exit(1);
  }
}

// Kick off startup. `void` makes it explicit the returned promise is intentionally
// not awaited at the top level.
void startServer();
