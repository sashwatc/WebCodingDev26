/**
 * FindBack AI - Item Details Page
 * Full item view with image gallery, metadata, claim form, and
 * possible match indicator. Admin-only info is hidden from public.
 */

import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import {
  formatLocalizedDate,
  translateCategory,
  translateColor,
  translateCondition,
  translateLocation,
} from "@/lib/i18n-helpers";
import {
  ArrowLeft, MapPin, Calendar, Clock, Tag, Package,
  Shield, Printer, Share2, CheckCircle2,
  Brain, ChevronLeft, ChevronRight, Star
} from "lucide-react";

function normalizeLostReport(report = {}) {
  return {
    id: report.id || "",
    title: report.item_type || "Lost item report",
    description: report.description || "",
    ai_description: "",
    category: report.category || "",
    color: report.color || "",
    brand: report.brand || "",
    location_found: report.last_seen_location || "",
    date_found: report.date_lost || "",
    time_found: "",
    photo_urls: report.photo_url ? [report.photo_url] : [],
    status: report.status || "open",
    record_type: "lost",
    tags: [report.color, report.brand].filter(Boolean),
    created_date: report.created_date || "",
    updated_date: report.updated_date || "",
    distinguishing_features: report.extra_notes || "",
    matching_count: report.matched_items?.length || 0,
    matched_items: report.matched_items || [],
    contact_name: report.contact_name || "",
  };
}

export default function ItemDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAdminAccess } = useAuth();
  const { isAdminMode } = useMode();
  const urlParams = new URLSearchParams(location.search);
  const itemId = urlParams.get("id");
  const itemTypeParam = urlParams.get("type");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["itemDetails", itemTypeParam || "found", itemId],
    queryFn: async () => {
      if (itemTypeParam === "lost") {
        const reports = await appClient.entities.LostReport.filter({ id: itemId });
        return reports[0] ? normalizeLostReport(reports[0]) : null;
      }

      const foundItem = await appClient.entities.FoundItem.get(itemId);
      if (foundItem) {
        return foundItem;
      }

      const reports = await appClient.entities.LostReport.filter({ id: itemId });
      return reports[0] ? normalizeLostReport(reports[0]) : null;
    },
    enabled: !!itemId,
  });

  const isAdmin = hasAdminAccess && isAdminMode;
  const isLostReport = item?.record_type === "lost";

  const { data: itemClaims = [] } = useQuery({
    queryKey: ["itemReviews", itemId],
    queryFn: () => appClient.entities.Claim.filter({ found_item_id: itemId }, "-review_reviewed_at", 20),
    enabled: !!itemId && itemTypeParam !== "lost",
  });

  // Fetch matching lost reports for this item
  const { data: matchingReports = [] } = useQuery({
    queryKey: ["matchesForItem", itemId],
    queryFn: async () => {
      const reports = await appClient.entities.LostReport.list();
      return reports.filter(r =>
        r.matched_items?.some(m => (typeof m === "string" ? m : m.found_item_id) === itemId)
      );
    },
    enabled: !!itemId && isAdmin && !isLostReport,
  });

  const { data: custodyEvents = [] } = useQuery({
    queryKey: ["custodyEvents", itemId, isAdmin],
    queryFn: () => appClient.custody.events(itemId),
    enabled: !!itemId && !isLostReport,
  });

  const { data: custodyVerification } = useQuery({
    queryKey: ["custodyVerify", itemId],
    queryFn: () => appClient.custody.verify(itemId),
    enabled: !!itemId && !isLostReport,
  });

  const { data: proofVault } = useQuery({
    queryKey: ["proofVault", itemId],
    queryFn: () => appClient.proofVault.item(itemId),
    enabled: !!itemId && isAdmin && !isLostReport,
    retry: false,
  });

  const { data: recoveryCase } = useQuery({
    queryKey: ["lostReportRecoveryCase", itemId],
    queryFn: () => appClient.recoveryCases.byLostReport(itemId),
    enabled: !!itemId && isLostReport,
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

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t("item_details.unable_to_load")}</h2>
        <p className="text-slate-500 mb-4">{error.message}</p>
        <Button onClick={() => navigate("/Search")}>{t("item_details.back_to_search")}</Button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t("item_details.item_not_found")}</h2>
        <p className="text-slate-500 mb-4">{t("item_details.item_not_found_description")}</p>
        <Button onClick={() => navigate("/Search")}>{t("item_details.back_to_search")}</Button>
      </div>
    );
  }

  const photos = item.photo_urls || [];
  const approvedRatings = (item.ratings || [])
    .filter((rating) => rating.review_status === "approved" && rating.rating)
    .map((rating) => ({
      id: rating.claim_id || `${item.id}-${rating.review_submitted_at || rating.rating}`,
      claimant_name: rating.claimant_name || t("item_details.verified_claimant"),
      claimant_rating: rating.rating,
      claimant_review: rating.review || "",
    }));
  const fallbackApprovedReviews = itemClaims
    .filter((claim) => claim.review_status === "approved" && claim.claimant_rating)
    .map((claim) => ({
      id: claim.id,
      claimant_name: claim.claimant_name,
      claimant_rating: claim.claimant_rating,
      claimant_review: claim.claimant_review || "",
    }));
  const approvedReviews = approvedRatings.length > 0 ? approvedRatings : fallbackApprovedReviews;
  const averageRating = approvedReviews.length
    ? (approvedReviews.reduce((sum, review) => sum + review.claimant_rating, 0) / approvedReviews.length).toFixed(1)
    : null;
  const displayTitle = isLostReport && (!item.title || item.title === "Lost item report")
    ? t("item_details.lost_item_report")
    : item.title;
  const typeBadgeClasses = isLostReport
    ? "border-rose-200 bg-rose-100 text-rose-700"
    : "border-sky-200 bg-sky-100 text-sky-700";
  const locationLabel = isLostReport ? t("item_details.last_seen") : t("item_details.found_at");
  const dateLabel = isLostReport ? t("item_details.date_lost") : t("item_details.date_found");
  const privacyNote = isLostReport
    ? t("item_details.privacy_note_lost")
    : t("item_details.privacy_note_found");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Button variant="ghost" size="sm" className="mb-4 gap-1 text-slate-500" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </Button>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Image gallery: 3 columns */}
        <div className="md:col-span-3">
          <div className="relative aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden mb-3">
            {photos.length > 0 ? (
              <img
                src={photos[currentPhotoIndex]}
                alt={item.title}
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
                  aria-label={t("item_details.previous_photo")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex(i => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white"
                  aria-label={t("item_details.next_photo")}
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

        {/* Item details: 2 columns */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={typeBadgeClasses}>
                {isLostReport ? t("common.lost") : t("common.found")}
              </Badge>
              <StatusBadge status={item.status} />
              {item.item_code && (
                <Badge variant="outline" className="font-mono text-xs">{item.item_code}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{displayTitle}</h1>
            <p className="text-slate-500 leading-relaxed">
              {item.ai_description || item.description}
            </p>
            {item.ai_description && item.description !== item.ai_description && (
              <details className="mt-2">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">{t("item_details.view_original_description")}</summary>
                <p className="text-sm text-slate-400 mt-1 italic">{item.description}</p>
              </details>
            )}
          </div>

          <Separator />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Tag, label: t("common.category"), value: translateCategory(t, item.category) },
              { icon: MapPin, label: locationLabel, value: translateLocation(t, item.location_found) || t("common.unknown_location") },
              { icon: Calendar, label: dateLabel, value: item.date_found ? formatLocalizedDate(item.date_found, "MMM d, yyyy") : t("common.not_available") },
              { icon: Clock, label: t("common.time"), value: item.time_found || t("common.not_available") },
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
                <span className="text-slate-500">{t("common.color")}:</span>
                <span className="font-medium text-slate-700">{translateColor(t, item.color)}</span>
              </div>
            )}
            {item.brand && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">{t("common.brand")}:</span>
                <span className="font-medium text-slate-700">{item.brand}</span>
              </div>
            )}
            {item.condition && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">{t("common.condition")}:</span>
                <span className="font-medium text-slate-700 capitalize">{translateCondition(t, item.condition)}</span>
              </div>
            )}
            {item.distinguishing_features && (
              <div className="text-sm">
                <span className="text-slate-500">{t("common.features")}: </span>
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

          {!isLostReport && approvedReviews.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("item_details.approved_user_ratings")}</p>
                  <p className="text-xs text-slate-600">
                    {t("item_details.rating_summary", { average: averageRating, count: approvedReviews.length })}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`w-4 h-4 ${index < Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-amber-200"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {approvedReviews.slice(0, 2).map((claim) => (
                  <div key={claim.id} className="rounded-lg bg-white/80 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{claim.claimant_name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`w-3.5 h-3.5 ${
                              index < claim.claimant_rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {claim.claimant_review && (
                      <p className="mt-2 text-sm text-slate-600">{claim.claimant_review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Admin-only: Storage Location */}
          {isAdmin && !isLostReport && item.storage_location && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">{t("item_details.admin_only")}</span>
              </div>
              <p className="text-sm text-amber-800">{t("item_details.storage", { location: item.storage_location })}</p>
            </div>
          )}

          {/* Claim Button */}
          {!isLostReport && item.status === "approved" && (
            <Link to={`/ClaimItem?id=${item.id}`} className="block">
              <Button size="lg" className="w-full gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {t("item_details.claim_button")}
              </Button>
            </Link>
          )}

          {isLostReport && !["resolved", "closed"].includes(item.status) && (
            <Link to={`/ReportFound?lost_report_id=${item.id}`} className="block">
              <Button size="lg" className="w-full gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {t("lost_items.i_found_this", "I Found This")}
              </Button>
            </Link>
          )}

          {isLostReport && item.matching_count > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              {t("item_details.possible_matches", { count: item.matching_count })}
            </div>
          )}

          {isLostReport && recoveryCase && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Likely Recovery Zones</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(recoveryCase.likely_zone_summaries || []).map((zone) => (
                  <Badge key={zone} variant="outline" className="bg-white">{zone}</Badge>
                ))}
              </div>
              <p className="mt-3 whitespace-pre-line text-xs leading-5 text-slate-600">{recoveryCase.recovery_plan}</p>
            </div>
          )}

          {!isLostReport && custodyEvents.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Tamper-Evident Custody Ledger</p>
                <Badge variant="outline" className={custodyVerification?.verified === false ? "border-amber-300 text-amber-800" : "border-emerald-300 text-emerald-800"}>
                  {custodyVerification?.verified === false ? "Attention needed" : "Integrity verified"}
                </Badge>
              </div>
              <ol className="mt-3 space-y-2">
                {custodyEvents.map((event) => (
                  <li key={event.id || `${event.sequence_number}-${event.event_type}`} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-0.5 h-5 min-w-5 rounded-full bg-white border border-slate-200 text-center leading-5 font-semibold">{event.sequence_number}</span>
                    <span className="capitalize">{String(event.event_type || "").replaceAll("_", " ")}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {proofVault && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Proof Vault</p>
              <div className="mt-2 space-y-2 text-xs text-amber-900">
                <p>Private clues: {(proofVault.private_verification_clues || []).join(", ") || "None sealed"}</p>
                {proofVault.asset_tag && <p>Asset tag: {proofVault.asset_tag}</p>}
                {proofVault.department_destination && <p>Department route: {proofVault.department_destination}</p>}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            {privacyNote}
          </div>

          {/* Share/Print for demo */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" /> {t("common.print")}
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
              <Share2 className="w-3.5 h-3.5" /> {t("common.share")}
            </Button>
          </div>
        </div>
      </div>

      {/* Admin: Match Panel */}
      {isAdmin && !isLostReport && matchingReports.length > 0 && (
        <Card className="mt-8 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              {t("item_details.match_suggestions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchingReports.map(report => {
                const match = report.matched_items?.find(m => (typeof m === "string" ? m : m.found_item_id) === itemId);
                return (
                  <div key={report.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">
                        {t("item_details.lost_report_label", { title: report.item_type || t("item_details.lost_item_report") })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("item_details.by_line", {
                          name: report.contact_name,
                          date: report.date_lost ? formatLocalizedDate(report.date_lost, "MMM d, yyyy") : t("common.not_available"),
                        })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {t("item_details.match_percent", { count: match?.confidence || 0 })}
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
