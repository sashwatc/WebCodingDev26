// vite.config.js - Vite build/dev-server configuration.
// Controls how the app is bundled, how the dev server proxies API calls to the
// backend, and the "@" import alias used throughout the codebase.
import { fileURLToPath, URL } from "node:url" // Used to resolve the absolute path of ./src for the alias.
import react from '@vitejs/plugin-react' // Enables React Fast Refresh + JSX transform.
import { defineConfig } from 'vite' // Typed config helper (gives editor autocompletion).

// https://vite.dev/config/
export default defineConfig({
  base: "./", // Emit relative asset URLs so the build can be hosted from any sub-path.
  logLevel: 'error', // Suppress warnings, only show errors
  // Dev server (`npm run dev`): proxy any /api/* request to the local backend so
  // the browser sees same-origin requests (no CORS) during development.
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080", // Local Spring Boot backend.
        changeOrigin: true, // Rewrite the Host header to the target.
      },
    },
  },
  // Preview server (`npm run preview`, serves the production build): same /api
  // proxy so the built app can also talk to the local backend.
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // "@" resolves to the absolute ./src directory, enabling imports like
      // "@/components/..." instead of brittle relative paths.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [react()] // Activate the React plugin.
});
