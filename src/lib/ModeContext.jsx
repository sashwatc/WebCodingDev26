/**
 * ModeContext.jsx
 * -----------------------------------------------------------------------------
 * React context for user-facing display/accessibility preferences, persisted to
 * localStorage and reflected onto the document root so CSS can react to them.
 *
 * Settings shape: { theme, readingMode, contrastMode }
 *   - theme:        "light" | "dark"      -> toggles the `dark` class on <html>.
 *   - readingMode:  "default" | "dyslexic" -> sets <html data-reading-mode=...>.
 *   - contrastMode: "default" | "high"     -> sets <html data-contrast-mode=...>.
 *
 * Provider (ModeProvider): loads persisted settings, writes them back on every
 * change, and applies them to the DOM. Consumers read the current values and
 * setters via the `useMode()` hook.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Context object; default null so `useMode` can detect missing provider.
const ModeContext = createContext(null);
// localStorage key under which the settings object is persisted.
const SETTINGS_STORAGE_KEY = "findback-ui-settings";

// Baseline settings used when nothing is stored or parsing fails.
function getDefaultSettings() {
  return {
    theme: "light",
    readingMode: "default",
    contrastMode: "default",
  };
}

// Migration helper: older builds stored an `isAdminMode` flag inside this same
// settings object. Strip it out so it never leaks back into the UI. No-op on
// the server (no window) or when the key/flag is absent.
function stripLegacyAdminModeFromUiSettings() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("isAdminMode" in parsed)) {
      return;
    }

    // Rewrite the stored object without the legacy `isAdminMode` key.
    const { isAdminMode: _removed, ...rest } = parsed;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // Ignore corrupt UI settings.
  }
}

// Read + sanitize persisted settings. Falls back to defaults on the server,
// when nothing is stored, or when the stored JSON is invalid. Each field is
// validated against its allowed values so unexpected data can't slip through.
function readStoredSettings() {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  stripLegacyAdminModeFromUiSettings();

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      readingMode: parsed.readingMode === "dyslexic" ? "dyslexic" : "default",
      contrastMode: parsed.contrastMode === "high" ? "high" : "default",
    };
  } catch {
    return getDefaultSettings();
  }
}

// Provider component: owns the settings state and keeps storage + DOM in sync.
export function ModeProvider({ children }) {
  // Lazily initialize from storage so we don't re-read on every render.
  const [settings, setSettings] = useState(readStoredSettings);

  // Persist settings to localStorage whenever they change.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage write failures in restricted browser contexts.
    }
  }, [settings]);

  // Reflect settings onto the document root so global CSS can target them.
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");      // dark theme class
    root.dataset.readingMode = settings.readingMode;               // data-reading-mode attribute
    root.dataset.contrastMode = settings.contrastMode;             // data-contrast-mode attribute
  }, [settings.theme, settings.readingMode, settings.contrastMode]);

  // Setter for theme; normalizes to "light"/"dark" and skips no-op updates.
  const setTheme = (value) => {
    setSettings((current) => {
      const nextTheme = value === "dark" ? "dark" : "light";

      if (current.theme === nextTheme) {
        return current;
      }

      return { ...current, theme: nextTheme };
    });
  };

  // Setter for reading mode; normalizes to "dyslexic"/"default", skips no-ops.
  const setReadingMode = (value) => {
    setSettings((current) => {
      const nextReadingMode = value === "dyslexic" ? "dyslexic" : "default";

      if (current.readingMode === nextReadingMode) {
        return current;
      }

      return {
        ...current,
        readingMode: nextReadingMode,
      };
    });
  };

  // Setter for contrast mode; normalizes to "high"/"default", skips no-ops.
  const setContrastMode = (value) => {
    setSettings((current) => {
      const nextContrastMode = value === "high" ? "high" : "default";

      if (current.contrastMode === nextContrastMode) {
        return current;
      }

      return {
        ...current,
        contrastMode: nextContrastMode,
      };
    });
  };

  // Memoized context value: current values plus their setters.
  const value = useMemo(
    () => ({
      theme: settings.theme,
      setTheme,
      readingMode: settings.readingMode,
      setReadingMode,
      contrastMode: settings.contrastMode,
      setContrastMode,
    }),
    [settings.theme, settings.readingMode, settings.contrastMode],
  );

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

// Consumer hook: returns the mode context. Throws if used outside ModeProvider.
export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
