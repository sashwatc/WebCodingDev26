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

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {item.location_found}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {item.date_found ? format(new Date(item.date_found), "MMM d") : "N/A"}
                </span>
                <Badge variant="outline" className="text-xs">{getCategoryLabel(item.category)}</Badge>
              </div>
            </div>

            {/* Action */}
            <Link to={`/ItemDetails?id=${item.id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="w-3.5 h-3.5" /> View
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Link to={`/ItemDetails?id=${item.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full border border-slate-200/80 group-hover:border-slate-300">
        {/* Image */}
        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-slate-200" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <StatusBadge status={item.status} />
          </div>
          {item.color && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur-sm">{item.color}</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-[hsl(213,56%,24%)] transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">
            {item.ai_description || item.description}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location_found}
            </span>
            <span>{item.date_found ? format(new Date(item.date_found), "MMM d") : ""}</span>
          </div>
          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}