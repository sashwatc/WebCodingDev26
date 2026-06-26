/**
 * Lost Then Found — Item Card
 * List and grid variants with clear typographic hierarchy.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, MapPin, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { staggerChildVariants } from "@/lib/motion";
import { formatLocalizedDate, translateCategory, translateColor, translateLocation } from "@/lib/i18n-helpers";

export default function ItemCard({ item, viewMode = "list", compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const imageUrl = item.photo_urls?.[0];
  const isLostReport = item.record_type === "lost";
  const detailHref = isLostReport ? `/ItemDetails?type=lost&id=${item.id}` : `/ItemDetails?id=${item.id}`;
  const detailLabel = isLostReport ? t("common.view_report") : t("common.view_item");

  const TypeChip = () => (
    <span className={`evidence-chip ${isLostReport ? "evidence-chip-lost" : "evidence-chip-found"}`}>
      {isLostReport ? t("common.lost") : t("common.found")}
    </span>
  );

  const CategoryChip = () =>
    item.category ? (
      <span className="evidence-chip">{translateCategory(t, item.category)}</span>
    ) : null;

  const MetaLine = ({ className = "" }) => (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground ${className}`}>
      {item.location_found && (
        <span className="inline-flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          {translateLocation(t, item.location_found)}
        </span>
      )}
      {item.date_found && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
          {formatLocalizedDate(item.date_found, "MMM d, yyyy")}
        </span>
      )}
    </div>
  );

  const FoundThisButton = () =>
    isLostReport ? (
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/ReportFound?lost_report_id=${item.id}`);
        }}
        className="gap-1.5 text-[12.5px]"
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("lost_items.i_found_this", "I Found This")}
      </Button>
    ) : null;

  /* ── List / compact view ─────────────────────────────────────────────────── */
  if (viewMode === "list" || compact) {
    return (
      <motion.article className="item-card-compact" variants={staggerChildVariants}>
        <div className="flex gap-4 p-4 sm:p-5">

          {/* Thumbnail */}
          <div className="item-card-thumb shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Row 1: chips + status */}
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <TypeChip />
              <CategoryChip />
              <StatusBadge status={item.status} />
            </div>

            {/* Row 2: title */}
            <h3 className="truncate text-[15.5px] font-bold leading-snug tracking-tight text-foreground">
              {item.title}
            </h3>

            {/* Row 3: meta */}
            <MetaLine className="mt-1" />

            {/* Row 4: description */}
            {(item.ai_description || item.description) && (
              <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-muted-foreground">
                {item.ai_description || item.description}
              </p>
            )}

            {/* Row 5: actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FoundThisButton />
              <Link
                to={detailHref}
                className="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors hover:opacity-80"
                style={{ color: "hsl(var(--ring))" }}
              >
                {detailLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  /* ── Grid view ───────────────────────────────────────────────────────────── */
  return (
    <motion.article className="item-card-compact h-full overflow-hidden" variants={staggerChildVariants}>
      <Link to={detailHref} className="block h-full" tabIndex={0}>
        {/* Image */}
        <div className="item-card-grid-media">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {/* Badges on image */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            <StatusBadge status={item.status} />
            <TypeChip />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="line-clamp-1 text-[14.5px] font-bold tracking-tight text-foreground">
            {item.title}
          </h3>
          <MetaLine className="mt-1.5" />
          {(item.ai_description || item.description) && (
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.6] text-muted-foreground">
              {item.ai_description || item.description}
            </p>
          )}

          {/* Footer row */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <CategoryChip />
            <span
              className="inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: "hsl(var(--ring))" }}
            >
              {detailLabel}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>

      {isLostReport && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <FoundThisButton />
        </div>
      )}
    </motion.article>
  );
}
