import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/translation.json";
import es from "@/locales/es/translation.json";
import fr from "@/locales/fr/translation.json";

const LOCAL_STORAGE_KEY = "lost-then-found-language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: LOCAL_STORAGE_KEY,
    },
  });

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.resolvedLanguage || i18n.language || "en";
  i18n.on("languageChanged", (language) => {
    document.documentElement.lang = language;
  });
}

export { LOCAL_STORAGE_KEY };
export default i18n;
