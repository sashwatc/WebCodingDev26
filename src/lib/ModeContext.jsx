import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ModeContext = createContext(null);
const SETTINGS_STORAGE_KEY = "findback-ui-settings";

function getDefaultSettings() {
  return {
    theme: "light",
    readingMode: "default",
    contrastMode: "default",
  };
}

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

    const { isAdminMode: _removed, ...rest } = parsed;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // Ignore corrupt UI settings.
  }
}

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

export function ModeProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings);

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

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.dataset.readingMode = settings.readingMode;
    root.dataset.contrastMode = settings.contrastMode;
  }, [settings.theme, settings.readingMode, settings.contrastMode]);

  const setTheme = (value) => {
    setSettings((current) => {
      const nextTheme = value === "dark" ? "dark" : "light";

      if (current.theme === nextTheme) {
        return current;
      }

      return { ...current, theme: nextTheme };
    });
  };

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

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
