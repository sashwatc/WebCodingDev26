/**
 * i18n.js - Internationalization (i18next) setup.
 *
 * Configures a single i18next instance with three bundled locales (en/es/fr),
 * wires it into React via react-i18next, and adds automatic language detection
 * with a localStorage cache. Importing this module triggers init() as a side
 * effect; the configured instance is the default export and is handed to
 * <I18nextProvider> in main.jsx.
 */
import i18n from "i18next"; // Core i18next engine.
import LanguageDetector from "i18next-browser-languagedetector"; // Detects user language from storage/navigator/html tag.
import { initReactI18next } from "react-i18next"; // Binds i18next to React (enables the useTranslation hook).

// Static translation dictionaries, one JSON file per supported language.
import en from "@/locales/en/translation.json";
import es from "@/locales/es/translation.json";
import fr from "@/locales/fr/translation.json";

// localStorage key under which the chosen language is persisted across visits.
const LOCAL_STORAGE_KEY = "lost-then-found-language";

i18n
  .use(LanguageDetector) // Plugin: figure out the initial language automatically.
  .use(initReactI18next) // Plugin: expose translations to React components.
  .init({
    // Map each language code to its translation namespace ("translation").
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: "en", // Use English when a key/locale is missing.
    supportedLngs: ["en", "es", "fr"], // Only allow these languages.
    interpolation: {
      escapeValue: false, // React already escapes output, so disable i18next escaping.
    },
    detection: {
      // Try localStorage first, then the browser's navigator language, then the <html lang> attribute.
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"], // Persist the detected/selected language to localStorage.
      lookupLocalStorage: LOCAL_STORAGE_KEY, // Read/write under our custom storage key.
    },
  });

// Keep the document's <html lang="..."> in sync with the active language for
// accessibility and SEO. Guarded for non-browser (SSR/test) environments.
if (typeof document !== "undefined") {
  // Set the initial value from the resolved/active language (fallback to "en").
  document.documentElement.lang = i18n.resolvedLanguage || i18n.language || "en";
  // Update it whenever the user switches languages at runtime.
  i18n.on("languageChanged", (language) => {
    document.documentElement.lang = language;
  });
}

export { LOCAL_STORAGE_KEY }; // Exported so other modules can read/clear the stored language.
export default i18n; // The configured instance consumed by <I18nextProvider>.
