import React from "react";
import { useTranslation } from "react-i18next";
import { getCurrentLanguage } from "@/lib/i18n-helpers";

const LANGUAGES = [
  { value: "en", labelKey: "language_switcher.english" },
  { value: "es", labelKey: "language_switcher.spanish" },
  { value: "fr", labelKey: "language_switcher.french" },
];

export default function LanguageSwitcher({ className = "" }) {
  const { t, i18n } = useTranslation();
  const activeLanguage = getCurrentLanguage();

  return (
    <label className={`block ${className}`}>
      <span className="sr-only">{t("language_switcher.label")}</span>
      <select
        value={activeLanguage}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        aria-label={t("language_switcher.label")}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>
            {t(language.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
