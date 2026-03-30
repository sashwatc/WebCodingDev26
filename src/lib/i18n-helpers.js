import i18n from "@/i18n";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { CATEGORIES, CONDITIONS, ITEM_STATUSES, CLAIM_STATUSES, LOST_REPORT_STATUSES } from "@/lib/constants";

const DATE_FNS_LOCALES = {
  en: enUS,
  es,
  fr,
};

function toTitleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toOptionKey(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function translateCategory(t, value = "") {
  const fallback = CATEGORIES.find((category) => category.value === value)?.label || toTitleCase(value);
  return value ? t(`categories.${value}`, { defaultValue: fallback }) : "";
}

export function translateCondition(t, value = "") {
  const fallback = CONDITIONS.find((condition) => condition.value === value)?.label || toTitleCase(value);
  return value ? t(`conditions.${value}`, { defaultValue: fallback }) : "";
}

export function translateColor(t, value = "") {
  return value ? t(`colors.${toOptionKey(value)}`, { defaultValue: value }) : "";
}

export function translateLocation(t, value = "") {
  return value ? t(`locations.${toOptionKey(value)}`, { defaultValue: value }) : "";
}

export function translateStatus(t, status = "") {
  const allStatuses = { ...ITEM_STATUSES, ...CLAIM_STATUSES, ...LOST_REPORT_STATUSES };
  const fallback = allStatuses[status]?.label || toTitleCase(status);
  return status ? t(`statuses.${status}`, { defaultValue: fallback }) : "";
}

export function translateUrgency(t, urgency = "") {
  return urgency ? t(`urgency.${urgency}`, { defaultValue: toTitleCase(urgency) }) : "";
}

export function getCurrentLanguage() {
  return (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
}

export function getDateFnsLocale(language = getCurrentLanguage()) {
  return DATE_FNS_LOCALES[String(language || "en").split("-")[0]] || enUS;
}

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
