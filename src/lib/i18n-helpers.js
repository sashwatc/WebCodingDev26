/**
 * i18n-helpers.js
 * -----------------------------------------------------------------------------
 * Translation/formatting utilities bridging app constants and i18next.
 *
 * Each `translateX(t, value)` helper looks up a localized string under a known
 * key namespace (e.g. `categories.<value>`), falling back to the constant's
 * English label or a title-cased version of the raw value. Also provides
 * current-language detection and locale-aware date formatting via date-fns.
 *
 * Note: `t` is the translation function from react-i18next, passed in by callers.
 */
import i18n from "@/i18n";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { CATEGORIES, CONDITIONS, ITEM_STATUSES, CLAIM_STATUSES, LOST_REPORT_STATUSES } from "@/lib/constants";

// Map of language code -> date-fns locale used for date formatting.
const DATE_FNS_LOCALES = {
  en: enUS,
  es,
  fr,
};

// Convert a snake_case/identifier into "Title Case" words (used as a fallback label).
function toTitleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Normalize an arbitrary label into a stable translation-key segment:
// lowercase, "&"->"and", non-alphanumerics collapsed to "_", trimmed of edge "_".
export function toOptionKey(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Localize a category value via `categories.<value>`, falling back to the
// constant's label or title-cased value. Returns "" for empty input.
export function translateCategory(t, value = "") {
  const fallback = CATEGORIES.find((category) => category.value === value)?.label || toTitleCase(value);
  return value ? t(`categories.${value}`, { defaultValue: fallback }) : "";
}

// Localize a condition value via `conditions.<value>`, with constant/title-case fallback.
export function translateCondition(t, value = "") {
  const fallback = CONDITIONS.find((condition) => condition.value === value)?.label || toTitleCase(value);
  return value ? t(`conditions.${value}`, { defaultValue: fallback }) : "";
}

// Localize a color name via `colors.<key>` (key normalized), falling back to the raw value.
export function translateColor(t, value = "") {
  return value ? t(`colors.${toOptionKey(value)}`, { defaultValue: value }) : "";
}

// Localize a location name via `locations.<key>` (key normalized), falling back to the raw value.
export function translateLocation(t, value = "") {
  return value ? t(`locations.${toOptionKey(value)}`, { defaultValue: value }) : "";
}

// Localize a status via `statuses.<status>`. Fallback label is sourced from the
// merged item/claim/lost-report status maps, then title-cased.
export function translateStatus(t, status = "") {
  const allStatuses = { ...ITEM_STATUSES, ...CLAIM_STATUSES, ...LOST_REPORT_STATUSES };
  const fallback = allStatuses[status]?.label || toTitleCase(status);
  return status ? t(`statuses.${status}`, { defaultValue: fallback }) : "";
}

// Localize an urgency level via `urgency.<urgency>`, title-cased fallback.
export function translateUrgency(t, urgency = "") {
  return urgency ? t(`urgency.${urgency}`, { defaultValue: toTitleCase(urgency) }) : "";
}

// Current active language as a base code (e.g. "en" from "en-US"); defaults to "en".
export function getCurrentLanguage() {
  return (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
}

// Resolve the date-fns locale for a language code (defaults to current language, then enUS).
export function getDateFnsLocale(language = getCurrentLanguage()) {
  return DATE_FNS_LOCALES[String(language || "en").split("-")[0]] || enUS;
}

// Format a date/value into a localized string using the active locale.
// Returns "" for empty/invalid input. `formatString` is a date-fns pattern.
export function formatLocalizedDate(value, formatString = "MMM d, yyyy") {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return format(date, formatString, { locale: getDateFnsLocale() });
}
