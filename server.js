/**
 * server.js (project root)
 *
 * Thin process entrypoint that boots the real Express backend.
 *
 * Importing `./backend/server.js` runs that module's top-level `startServer()`,
 * which connects to the data backend and begins listening. This wrapper exists so
 * tooling (npm scripts, `concurrently`, etc.) has a stable root-level entry file
 * and so the Node process is kept alive and shuts down cleanly on termination
 * signals.
 */
import "./backend/server.js";

// Keep the API entrypoint attached so npm/concurrently treat it as a foreground process.
// The no-op interval (~12.4 day period, 2^30 ms) prevents the event loop from
// draining and the process from exiting prematurely.
const keepAlive = setInterval(() => {}, 1 << 30);

// Clean shutdown handler: cancel the keep-alive timer and exit successfully so the
// process terminates promptly instead of lingering on the interval.
const shutdown = () => {
  clearInterval(keepAlive);
  process.exit(0);
};

// Exit gracefully on Ctrl+C (SIGINT) and on process-manager termination (SIGTERM).
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
