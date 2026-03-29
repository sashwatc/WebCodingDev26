/**
 * FindBack AI - Item Card Component
 * Displays a found item in either grid or list view with status badge,
 * category, location, date, and photo thumbnail.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Eye, Package } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getCategoryLabel } from "@/lib/constants";
import { format } from "date-fns";

export default function ItemCard({ item, viewMode = "grid" }) {
  const imageUrl = item.photo_urls?.[0];
  const isLostReport = item.record_type === "lost";
  const detailHref = isLostReport ? `/ItemDetails?type=lost&id=${item.id}` : `/ItemDetails?id=${item.id}`;
  const detailLabel = isLostReport ? "View Report" : "View Item";
  const typeBadgeClasses = isLostReport
    ? "border-rose-200 bg-rose-100 text-rose-700"
    : "border-sky-200 bg-sky-100 text-sky-700";

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden border-slate-200 shadow-none">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
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
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <Badge variant="secondary" className={typeBadgeClasses}>
                  {isLostReport ? "Lost" : "Found"}
                </Badge>
                <StatusBadge status={item.status} />
                <Badge variant="outline" className="text-xs">{getCategoryLabel(item.category)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {item.location_found}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {item.date_found ? format(new Date(item.date_found), "MMM d") : "N/A"}
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
      <Card className="h-full overflow-hidden border-slate-200 shadow-none">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-slate-200" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={item.status} />
          </div>
          <div className="absolute left-3 top-12">
            <Badge variant="secondary" className={typeBadgeClasses}>
              {isLostReport ? "Lost" : "Found"}
            </Badge>
          </div>
          {item.color && (
            <div className="absolute right-3 top-3">
              <Badge variant="outline" className="bg-white text-slate-700">{item.color}</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location_found}
            </span>
            <span>{item.date_found ? format(new Date(item.date_found), "MMM d") : ""}</span>
          </div>
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-900">
            {item.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm leading-7 text-slate-600">
            {item.ai_description || item.description}
          </p>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Badge variant="outline" className="text-xs">{getCategoryLabel(item.category)}</Badge>
            <Button size="sm" variant="outline" className="gap-1">
              <Eye className="w-3.5 h-3.5" />
              {detailLabel}
            </Button>
          </div>
          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
