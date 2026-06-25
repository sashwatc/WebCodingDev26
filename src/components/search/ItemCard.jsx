/**
 * Lost Then Found - Item Card Component
 * Archive catalog entry with evidence-style metadata labels.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Eye, MapPin, Package } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { cardLift, staggerChildVariants } from "@/lib/motion";
import { formatLocalizedDate, translateCategory, translateColor, translateLocation } from "@/lib/i18n-helpers";

export default function ItemCard({ item, viewMode = "list", compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const imageUrl = item.photo_urls?.[0];
  const isLostReport = item.record_type === "lost";
  const detailHref = isLostReport ? `/ItemDetails?type=lost&id=${item.id}` : `/ItemDetails?id=${item.id}`;
  const detailLabel = isLostReport ? t("common.view_report") : t("common.view_item");
  const recordChipClass = isLostReport ? "evidence-chip-lost" : "evidence-chip-found";

  const metaRow = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{translateLocation(t, item.location_found) || t("common.unknown_location")}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {item.date_found ? formatLocalizedDate(item.date_found, "MMM d, yyyy") : t("common.not_available")}
      </span>
    </div>
  );

  const evidenceRow = (
    <div className="flex flex-wrap gap-1.5">
      <span className={`evidence-chip ${recordChipClass}`}>
        {isLostReport ? t("common.lost") : t("common.found")}
      </span>
      {item.category ? (
        <Badge variant="evidence">{translateCategory(t, item.category)}</Badge>
      ) : null}
      {item.color ? (
        <Badge variant="evidence">{translateColor(t, item.color)}</Badge>
      ) : null}
    </div>
  );

  const actionButton = (
    <Link to={detailHref}>
      <Button size="sm" variant="outline" className="gap-1.5">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {detailLabel}
      </Button>
    </Link>
  );

  const foundThisButton = isLostReport ? (
    <Button
      size="sm"
      variant="secondary"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/ReportFound?lost_report_id=${item.id}`);
      }}
      className="gap-1.5"
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {t("lost_items.i_found_this", "I Found This")}
    </Button>
  ) : null;

  if (viewMode === "list" || compact) {
    return (
      <motion.article className="item-card-compact" variants={staggerChildVariants} {...cardLift}>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="item-card-thumb shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <StatusBadge status={item.status} />
            </div>

            {evidenceRow}
            {metaRow}

            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {item.ai_description || item.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {foundThisButton}
              {actionButton}
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article className="item-card-compact h-full overflow-hidden" variants={staggerChildVariants} {...cardLift}>
      <Link to={detailHref} className="block h-full">
        <div className="item-card-grid-media">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <StatusBadge status={item.status} />
            <span className={`evidence-chip w-fit ${recordChipClass}`}>
              {isLostReport ? t("common.lost") : t("common.found")}
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">{item.title}</h3>
            {metaRow}
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.ai_description || item.description}
          </p>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            {item.category ? (
              <Badge variant="evidence">{translateCategory(t, item.category)}</Badge>
            ) : (
              <span />
            )}
            <span className="text-xs font-medium text-primary">{detailLabel}</span>
          </div>
        </div>
      </Link>

      {foundThisButton ? <div className="border-t border-border px-4 pb-4">{foundThisButton}</div> : null}
    </motion.article>
  );
}
