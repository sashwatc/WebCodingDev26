/**
 * Reusable status badge component for consistent status display across the app.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { ITEM_STATUSES, CLAIM_STATUSES, LOST_REPORT_STATUSES } from "@/lib/constants";
import { translateStatus } from "@/lib/i18n-helpers";

const ALL_STATUSES = { ...ITEM_STATUSES, ...CLAIM_STATUSES, ...LOST_REPORT_STATUSES };

export default function StatusBadge({ status, className = "" }) {
  const { t } = useTranslation();
  const config = ALL_STATUSES[status];
  const label = translateStatus(t, status);

  if (!config) {
    return (
      <Badge variant="outline" className={className} role="status" aria-label={t("statuses.badge_label", { status: label })}>
        {label}
      </Badge>
    );
  }

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
