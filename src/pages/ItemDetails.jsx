/**
 * FindBack AI - Item Details Page
 * Full item view with image gallery, metadata, claim form, and
 * possible match indicator. Admin-only info is hidden from public.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StatusBadge from "@/components/ui/StatusBadge";
import { getCategoryLabel } from "@/lib/constants";
import { format } from "date-fns";
import {
  ArrowLeft, MapPin, Calendar, Clock, Tag, Package,
  Shield, Printer, Share2, AlertTriangle, CheckCircle2,
  Brain, Eye, ChevronLeft, ChevronRight
} from "lucide-react";

export default function ItemDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get("id");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: item, isLoading } = useQuery({
    queryKey: ["foundItem", itemId],
    queryFn: () => base44.entities.FoundItem.filter({ id: itemId }),
    enabled: !!itemId,
    select: (data) => data?.[0],
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isAdmin = user?.role === "admin";

  // Fetch matching lost reports for this item
  const { data: matchingReports = [] } = useQuery({
    queryKey: ["matchesForItem", itemId],
    queryFn: async () => {
      const reports = await base44.entities.LostReport.list();
      return reports.filter(r =>
        r.matched_items?.some(m => m.found_item_id === itemId)
      );
    },
    enabled: !!itemId && isAdmin,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Item Not Found</h2>
        <p className="text-slate-500 mb-4">This item may have been removed or doesn't exist.</p>
        <Button onClick={() => navigate("/Search")}>Back to Search</Button>
      </div>
    );
  }

  const photos = item.photo_urls || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Button variant="ghost" size="sm" className="mb-4 gap-1 text-slate-500" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Image Gallery — 3 columns */}
        <div className="md:col-span-3">
          <div className="relative aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden mb-3">
            {photos.length > 0 ? (
              <img
                src={photos[currentPhotoIndex]}
                alt={`${item.title} - Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-contain bg-slate-50"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-slate-200" />
              </div>
            )}
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex(i => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2">
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhotoIndex(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === currentPhotoIndex ? "border-[hsl(174,60%,40%)]" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details — 2 columns */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={item.status} />
              {item.item_code && (
                <Badge variant="outline" className="font-mono text-xs">{item.item_code}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
            <p className="text-slate-500 leading-relaxed">
              {item.ai_description || item.description}
            </p>
            {item.ai_description && item.description !== item.ai_description && (
              <details className="mt-2">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">View original description</summary>
                <p className="text-sm text-slate-400 mt-1 italic">{item.description}</p>
              </details>
            )}
          </div>

          <Separator />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Tag, label: "Category", value: getCategoryLabel(item.category) },
              { icon: MapPin, label: "Found At", value: item.location_found },
              { icon: Calendar, label: "Date Found", value: item.date_found ? format(new Date(item.date_found), "MMM d, yyyy") : "N/A" },
              { icon: Clock, label: "Time", value: item.time_found || "N/A" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                </div>
                <p className="text-sm font-medium text-slate-700">{value}</p>
              </div>
            ))}
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            {item.color && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Color:</span>
                <span className="font-medium text-slate-700">{item.color}</span>
              </div>
            )}
            {item.brand && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Brand:</span>
                <span className="font-medium text-slate-700">{item.brand}</span>
              </div>
            )}
            {item.condition && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Condition:</span>
                <span className="font-medium text-slate-700 capitalize">{item.condition}</span>
              </div>
            )}
            {item.distinguishing_features && (
              <div className="text-sm">
                <span className="text-slate-500">Features: </span>
                <span className="text-slate-700">{item.distinguishing_features}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Admin-only: Storage Location */}
          {isAdmin && item.storage_location && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">ADMIN ONLY</span>
              </div>
              <p className="text-sm text-amber-800">Storage: {item.storage_location}</p>
            </div>
          )}

          {/* Claim Button */}
          {item.status === "approved" && (
            <Link to={`/ClaimItem?id=${item.id}`} className="block">
              <Button size="lg" className="w-full bg-[hsl(174,60%,40%)] hover:bg-[hsl(174,60%,35%)] text-white gap-2 shadow-md">
                <CheckCircle2 className="w-5 h-5" />
                This Is Mine — Submit Claim
              </Button>
            </Link>
          )}

          {/* Privacy Note */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            Finder contact info and exact storage location are kept private. 
            Submit a claim to verify ownership.
          </div>

          {/* Share/Print for demo */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>
        </div>
      </div>

      {/* Admin: AI Match Panel */}
      {isAdmin && matchingReports.length > 0 && (
        <Card className="mt-8 border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Match Suggestions (Admin View)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchingReports.map(report => {
                const match = report.matched_items?.find(m => m.found_item_id === itemId);
                return (
                  <div key={report.id} className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">
                        Lost report: {report.item_type}
                      </p>
                      <p className="text-xs text-slate-500">
                        by {report.contact_name} • {report.date_lost}
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {match?.confidence}% match
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}