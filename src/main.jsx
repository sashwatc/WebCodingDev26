/**
 * main.jsx - Application bootstrap / entry point.
 *
 * This is the file Vite loads first (referenced from index.html). It mounts the
 * React tree into the #root DOM node and installs the OUTERMOST providers that
 * must exist before <App /> (and its own providers) run:
 *   AppErrorBoundary  -> catches render-time crashes anywhere below it.
 *     I18nextProvider -> makes the configured i18n instance available to hooks.
 *       ModeProvider  -> app display-mode context (e.g. theme/mode toggles).
 *         App         -> the router + auth/query providers (see App.jsx).
 * It also imports the global stylesheet so Tailwind's styles are applied.
 */
import React from 'react' // React core (JSX runtime).
import ReactDOM from 'react-dom/client' // React 18 client renderer (createRoot API).
import { I18nextProvider } from "react-i18next"; // Supplies the i18n instance to translation hooks.
import App from '@/App.jsx' // The root application component (providers + router).
import AppErrorBoundary from '@/components/app/AppErrorBoundary.jsx' // Top-level error boundary fallback UI.
import { ModeProvider } from '@/lib/ModeContext' // Provides app-wide display "mode" context.
import i18n from "@/i18n"; // The pre-initialized i18next instance (see i18n.js).
import '@/index.css' // Global styles incl. Tailwind base/components/utilities.

// Find the #root element from index.html, create a React 18 root, and render the
// full provider stack. The boundary is outermost so it can catch errors thrown
// while any provider or page renders.
ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <ModeProvider>
        <App />
      </ModeProvider>
    </I18nextProvider>
  </AppErrorBoundary>
)
