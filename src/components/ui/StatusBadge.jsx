/**
 * Reusable status badge component for consistent status display across the app.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { ITEM_STATUSES, CLAIM_STATUSES, LOST_REPORT_STATUSES } from "@/lib/constants";
import { translateStatus } from "@/lib/i18n-helpers";

// Merge every status dictionary into one lookup so any status key (item,
// claim, or lost-report) resolves to its display config (e.g. color classes).
const ALL_STATUSES = { ...ITEM_STATUSES, ...CLAIM_STATUSES, ...LOST_REPORT_STATUSES };

// StatusBadge: renders a localized, accessible Badge for a given status key.
// Props: `status` (one of the known status keys) and optional `className`.
// Wraps the shared Badge primitive and adds role="status" + aria-label for a11y.
export default function StatusBadge({ status, className = "" }) {
  const { t } = useTranslation();
  // Look up the visual config for this status; may be undefined for unknown keys.
  const config = ALL_STATUSES[status];
  // Translate the status key into a human-readable label for the current locale.
  const label = translateStatus(t, status);

  // Fallback path: unknown status -> plain outline badge with just the label.
  if (!config) {
    return (
      <Badge variant="outline" className={className} role="status" aria-label={t("statuses.badge_label", { status: label })}>
        {label}
      </Badge>
    );
  }

  // Known status path: apply the per-status color classes from the config.
  return (
    <Badge
      className={`${config.color} border font-medium text-xs ${className}`}
      variant="secondary"
      role="status"
      aria-label={t("statuses.badge_label", { status: label })}
    >
      {label}
    </Badge>
  );
}
