/**
 * FindBack AI - Item Card Component
 * Displays a found item in either grid or list view with status badge,
 * category, location, date, and photo thumbnail.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Eye, Package } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatLocalizedDate, translateCategory, translateColor, translateLocation } from "@/lib/i18n-helpers";

export default function ItemCard({ item, viewMode = "grid" }) {
  const { t } = useTranslation();
  const imageUrl = item.photo_urls?.[0];
  const isLostReport = item.record_type === "lost";
  const detailHref = isLostReport ? `/ItemDetails?type=lost&id=${item.id}` : `/ItemDetails?id=${item.id}`;
  const detailLabel = isLostReport ? t("common.view_report") : t("common.view_item");
  const typeBadgeClasses = isLostReport
    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
    : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200";

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden border-slate-200 bg-white shadow-none dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {imageUrl ? (
                <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <Badge variant="secondary" className={typeBadgeClasses}>
                  {isLostReport ? t("common.lost") : t("common.found")}
                </Badge>
                <StatusBadge status={item.status} />
                <Badge variant="outline" className="text-xs">{translateCategory(t, item.category)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {translateLocation(t, item.location_found) || t("common.unknown_location")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {item.date_found ? formatLocalizedDate(item.date_found, "MMM d") : t("common.not_available")}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {item.ai_description || item.description}
              </p>
            </div>

            <Link to={detailHref} className="sm:self-center">
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="w-3.5 h-3.5" /> {detailLabel}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Link to={detailHref} className="block group">
      <Card className="h-full overflow-hidden border-slate-200 shadow-none transition-all duration-300 group-hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] group-hover:border-slate-300 bg-white">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 bg-slate-50">
              <Package className="w-12 h-12 text-slate-200" />
            </div>
          )}
          
          {/* Hover Overlay Button */}
          <div className="absolute inset-0 bg-slate-950/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-white/95 text-slate-900 text-xs font-semibold px-4.5 py-2 rounded-xl shadow-md border border-slate-200/50 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Eye className="w-4 h-4 text-primary" />
              {detailLabel}
            </span>
          </div>

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <StatusBadge status={item.status} />
            <Badge variant="secondary" className={`w-fit text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 shadow-sm border ${typeBadgeClasses}`}>
              {isLostReport ? t("common.lost") : t("common.found")}
            </Badge>
          </div>

          {item.color && (
            <div className="absolute right-3 top-3">
              <Badge variant="outline" className="bg-white/90 text-slate-700 text-[10px] font-semibold border-slate-200/60 shadow-sm">{translateColor(t, item.color)}</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5 flex flex-col h-[calc(100%-75%)] justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {translateLocation(t, item.location_found) || t("common.unknown_location")}
              </span>
              <span>{item.date_found ? formatLocalizedDate(item.date_found, "MMM d, yyyy") : ""}</span>
            </div>
            <h3 className="mb-2 line-clamp-1 text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-500">
              {item.ai_description || item.description}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200/80 text-slate-600 px-2.5 py-0.5">{translateCategory(t, item.category)}</Badge>
              <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:underline">
                {detailLabel} →
              </span>
            </div>
            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] text-slate-400 border-slate-100 bg-slate-50/50 px-1.5 py-0">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
