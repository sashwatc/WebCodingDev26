/**
 * Reusable status badge component for consistent status display across the app.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ITEM_STATUSES, CLAIM_STATUSES, LOST_REPORT_STATUSES } from "@/lib/constants";

const ALL_STATUSES = { ...ITEM_STATUSES, ...CLAIM_STATUSES, ...LOST_REPORT_STATUSES };

export default function StatusBadge({ status, className = "" }) {
  const config = ALL_STATUSES[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge className={`${config.color} border font-medium text-xs ${className}`} variant="secondary">
      {config.label}
    </Badge>
  );
}