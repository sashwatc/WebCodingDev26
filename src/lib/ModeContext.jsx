import React, { createContext, useContext, useEffect, useState } from "react";

const ModeContext = createContext();
const SETTINGS_STORAGE_KEY = "findback-ui-settings";

function getDefaultSettings() {
  return {
    isAdminMode: false,
    theme: "light",
    readingMode: "default",
  };
}

function readStoredSettings() {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(raw);
    return {
      isAdminMode: Boolean(parsed.isAdminMode),
      theme: parsed.theme === "dark" ? "dark" : "light",
      readingMode: parsed.readingMode === "dyslexic" ? "dyslexic" : "default",
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
  }, [settings.theme, settings.readingMode]);

  const setIsAdminMode = (value) => {
    setSettings((current) => {
      const nextIsAdminMode = typeof value === "function" ? value(current.isAdminMode) : value;

      if (current.isAdminMode === nextIsAdminMode) {
        return current;
      }

      return {
        ...current,
        isAdminMode: nextIsAdminMode,
      };
    });
  };

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

  return (
    <ModeContext.Provider
      value={{
        isAdminMode: settings.isAdminMode,
        setIsAdminMode,
        theme: settings.theme,
        setTheme,
        readingMode: settings.readingMode,
        setReadingMode,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
