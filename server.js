import "./backend/server.js";

// Keep the API entrypoint attached so npm/concurrently treat it as a foreground process.
const keepAlive = setInterval(() => {}, 1 << 30);

const shutdown = () => {
  clearInterval(keepAlive);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
