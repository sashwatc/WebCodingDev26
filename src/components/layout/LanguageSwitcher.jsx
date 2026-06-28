/**
 * LanguageSwitcher.jsx
 * --------------------------------------------------------------------------
 * A small accessible <select> that lets the user change the active UI
 * language. Selecting an option calls i18next's changeLanguage(), which
 * re-renders every translated string in the app. The currently active
 * language is read back via getCurrentLanguage() so the control always
 * reflects the real i18n state.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { getCurrentLanguage } from "@/lib/i18n-helpers";

// Supported languages. `value` is the i18next language code; `labelKey` is the
// translation key for the option's human-readable name (translated per-locale).
const LANGUAGES = [
  { value: "en", labelKey: "language_switcher.english" },
  { value: "es", labelKey: "language_switcher.spanish" },
  { value: "fr", labelKey: "language_switcher.french" },
];

// Props:
//   className - extra classes merged onto the wrapping <label> for layout.
export default function LanguageSwitcher({ className = "" }) {
  const { t, i18n } = useTranslation();
  // Normalized current language code (e.g. "en") used as the <select> value.
  const activeLanguage = getCurrentLanguage();

  return (
    // Label wraps the select; the visible text is screen-reader-only (sr-only).
    <label className={`block ${className}`}>
      {/* Hidden accessible label describing the control */}
      <span className="sr-only">{t("language_switcher.label")}</span>
      {/* Controlled select: value tracks i18n; onChange switches language live */}
      <select
        value={activeLanguage}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        aria-label={t("language_switcher.label")}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* One <option> per supported language, label translated via t() */}
        {LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>
            {t(language.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
