import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import {
  formatLocalizedDate,
  translateCategory,
  translateColor,
  translateCondition,
} from "@/lib/i18n-helpers";
import { fadeUp } from "@/lib/motion";
import {
  ArrowLeft, Bookmark, BookmarkCheck, Calendar, CheckCircle2,
  ChevronLeft, ChevronRight, MapPin, Package, Printer, Share2,
} from "lucide-react";

// ── Status stepper ────────────────────────────────────────────────────────────

const STEPPER = [
  { id: "found",     label: "Found" },
  { id: "review",    label: "In Review" },
  { id: "published", label: "Published" },
  { id: "claimed",   label: "Claimed" },
  { id: "returned",  label: "Returned" },
];

function getStepIndex(status) {
  const s = (status || "").toLowerCase();
  if (["returned"].includes(s))                                return 4;
  if (["claimed", "claim_pending", "verified"].includes(s))   return 3;
  if (["published", "approved", "found"].includes(s))         return 2;
  if (["pending_review"].includes(s))                         return 1;
  return 0;
}

function StatusStepper({ status }) {
  const current = getStepIndex(status);
  return (
    <div className="flex items-center gap-0" role="list" aria-label="Item status progress">
      {STEPPER.map((step, i) => {
        const done   = current > i;
        const active = current === i;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center" role="listitem">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  done   ? "bg-emerald-600 text-white" :
                  active ? "bg-primary text-white ring-2 ring-primary/25" :
                           "bg-slate-100 text-slate-400"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`mt-1 text-[10px] font-medium whitespace-nowrap ${active ? "text-primary" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPPER.length - 1 && (
              <div className={`mb-4 h-px flex-1 transition-colors ${done ? "bg-emerald-400" : "bg-slate-200"}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ItemDetailsSkeleton() {
  return (
    <div className="page-shell max-w-5xl py-8">
      <Skeleton className="mb-6 h-8 w-20" />
      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        </div>
        <div className="space-y-5 md:col-span-2">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ItemDetails() {
  useEffect(() => { document.title = "Item Details — Lost Then Found"; }, []);
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, navigateToLogin } = useAuth();

  const id = new URLSearchParams(location.search).get("id");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ltf-saved-items") || "[]").includes(id);
    } catch { return false; }
  });

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["itemDetails", id],
    queryFn: () => appClient.items.get(id),
    enabled: !!id,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("ltf-saved-items") || "[]");
      const next = isSaved ? saved.filter((s) => s !== id) : [...saved, id];
      localStorage.setItem("ltf-saved-items", JSON.stringify(next));
      setIsSaved(!isSaved);
    } catch { /* ignore storage errors */ }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  // ── States ────────────────────────────────────────────────────────────────

  if (!id || (!isLoading && !item && !error)) {
    return (
      <div className="page-shell max-w-lg py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-bold text-foreground">Item not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          This item may have been removed or the link is invalid.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Go back
        </Button>
      </div>
    );
  }

  if (isLoading) return <ItemDetailsSkeleton />;

  if (error || !item) {
    return (
      <div className="page-shell max-w-lg py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-bold text-foreground">Item not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {error?.message || "This item could not be loaded."}
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Go back
        </Button>
      </div>
    );
  }

  const photos   = item.photo_urls || [];
  const isPublished = item.status === "published" || item.status === "approved";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          header[role="banner"],
          footer,
          [data-print-hide="true"] { display: none !important; }
          .page-shell { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <motion.div className="page-shell max-w-5xl py-8" {...fadeUp}>

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-1 text-muted-foreground"
          onClick={() => navigate(-1)}
          data-print-hide="true"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("common.back", "Back")}
        </Button>

        <div className="grid gap-8 md:grid-cols-5">

          {/* ── Left: Photo carousel ──────────────────────────────────────── */}
          <div className="md:col-span-3">
            <div className="relative overflow-hidden rounded-xl border border-border bg-muted" style={{ aspectRatio: "4/3" }} aria-label="Item photos">
              {photos.length > 0 ? (
                <img
                  key={photoIndex}
                  src={photos[photoIndex]}
                  alt={`${item.title} — photo ${photoIndex + 1} of ${photos.length}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background/95 shadow-sm hover:bg-muted"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background/95 shadow-sm hover:bg-muted"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Photos">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === photoIndex}
                        aria-current={i === photoIndex ? "true" : undefined}
                        aria-label={`Photo ${i + 1}`}
                        onClick={() => setPhotoIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === photoIndex ? "w-5 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Right: Info panel ────────────────────────────────────────── */}
          <div className="space-y-5 md:col-span-2">

            {/* Status + title */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                {item.condition && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {translateCondition(t, item.condition)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {item.title || "Untitled item"}
              </h1>

              {/* Category / color / brand chips */}
              <div className="flex flex-wrap gap-1.5">
                {item.category && (
                  <Badge variant="evidence">{translateCategory(t, item.category)}</Badge>
                )}
                {item.color && (
                  <Badge variant="evidence">{translateColor(t, item.color)}</Badge>
                )}
                {item.brand && (
                  <Badge variant="outline" className="text-xs">{item.brand}</Badge>
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Location + date */}
            <div className="space-y-2 text-sm">
              {item.location_found && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Found at <span className="font-medium text-foreground">{item.location_found}</span>
                    {item.date_found && (
                      <>
                        {" "}on{" "}
                        <span className="font-medium text-foreground">
                          {formatLocalizedDate(item.date_found, "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              )}
              {item.date_found && !item.location_found && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Found on{" "}
                    <span className="font-medium text-foreground">
                      {formatLocalizedDate(item.date_found, "MMM d, yyyy")}
                    </span>
                  </span>
                </div>
              )}
              {/* finder_name always shown as "PVHS Staff" */}
              {item.finder_name && (
                <p className="text-xs text-muted-foreground">Reported by PVHS Staff</p>
              )}
            </div>

            {/* Description */}
            {(item.description || item.ai_description) && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.ai_description || item.description}
              </p>
            )}

            {/* Identifying features */}
            {item.distinguishing_features && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                  Identifying features
                </p>
                <p className="text-sm text-foreground">{item.distinguishing_features}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            <hr className="border-border" />

            {/* Action bar */}
            <div className="flex flex-wrap gap-2" data-print-hide="true">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={toggleSave}
                aria-pressed={isSaved}
                aria-label={isSaved ? "Unsave item" : "Save item"}
              >
                {isSaved
                  ? <BookmarkCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  : <Bookmark className="h-4 w-4" aria-hidden="true" />}
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print
              </Button>
            </div>

            {/* Claim button */}
            <div data-print-hide="true">
              {!isAuthenticated && (
                <Button size="lg" className="w-full gap-2" onClick={navigateToLogin}>
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  Claim This Item
                </Button>
              )}
              {isAuthenticated && !isPublished && (
                <Button size="lg" className="w-full" disabled>
                  This item is no longer available for claims
                </Button>
              )}
              {isAuthenticated && isPublished && (
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => navigate(`/ClaimItem?id=${id}`)}
                >
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  Claim This Item
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Status stepper ──────────────────────────────────────────────── */}
        <div className="mt-10" data-print-hide="true">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
            Item status
          </p>
          <StatusStepper status={item.status} />
        </div>

        {/* ── Print-only summary block ─────────────────────────────────────── */}
        <div className="print-only hidden mt-8 border-t border-gray-300 pt-6 text-sm leading-relaxed text-black">
          <h2 className="mb-3 text-lg font-bold">Found Item Summary</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {item.title && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Title</td><td>{item.title}</td></tr>
              )}
              {item.category && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Category</td><td>{item.category}</td></tr>
              )}
              {item.color && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Color</td><td>{item.color}</td></tr>
              )}
              {item.location_found && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Location found</td><td>{item.location_found}</td></tr>
              )}
              {item.date_found && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Date found</td><td>{item.date_found}</td></tr>
              )}
              {(item.ai_description || item.description) && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Description</td><td>{item.ai_description || item.description}</td></tr>
              )}
              {item.distinguishing_features && (
                <tr><td style={{ fontWeight: 600, paddingRight: 16, whiteSpace: "nowrap", verticalAlign: "top" }}>Features</td><td>{item.distinguishing_features}</td></tr>
              )}
            </tbody>
          </table>
          <p className="mt-4 font-semibold">To claim this item visit PVHS Main Office during school hours.</p>
        </div>

      </motion.div>
    </>
  );
}
