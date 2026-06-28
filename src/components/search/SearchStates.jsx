/**
 * SearchStates
 * --------------------------------------------------------------------------
 * Two presentational helpers for the search results area:
 *
 *   - SearchResultsSkeleton: placeholder shimmer shown while results load.
 *   - SearchStatePanel: a centered message panel for non-result states
 *     (empty / error / backend-down / offline) with optional retry and
 *     clear-filters actions.
 *
 * Both mirror the list/grid layout of the real ItemCard results so the page
 * doesn't jump when content swaps in. Neither holds state.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Package, RefreshCw, ServerOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for search results.
 * @param viewMode "list" | "grid" — matches the real results layout.
 * @param count    number of placeholder cards to render.
 */
export function SearchResultsSkeleton({ viewMode = "list", count = 6 }) {
  // Build an array of `count` empty slots to map over.
  const items = Array.from({ length: count });

  // Grid layout: image-on-top placeholder cards in a responsive grid.
  if (viewMode === "grid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {items.map((_, index) => (
          <div key={index} className="item-card-compact overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List layout (default): horizontal thumbnail + text-line placeholders.
  return (
    <div className="space-y-3" aria-hidden="true">
      {items.map((_, index) => (
        <div key={index} className="item-card-compact flex gap-4 p-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Centered status/error panel for the search area.
 * @param variant          "empty" | "error" | "backend" | "offline" — picks the icon.
 * @param title/description text content.
 * @param onRetry          optional retry handler (renders a "Try again" button).
 * @param onClearFilters   optional handler (renders a clear-filters button).
 * @param clearFiltersLabel optional override for the clear-filters label.
 */
export function SearchStatePanel({
  variant = "empty",
  title,
  description,
  onRetry,
  onClearFilters,
  clearFiltersLabel,
}) {
  const { t } = useTranslation();

  // Map each variant to its lucide icon.
  const icons = {
    empty: Package,
    error: AlertTriangle,
    backend: ServerOff,
    offline: WifiOff,
  };

  // Resolve the icon component, defaulting to the empty-state icon.
  const Icon = icons[variant] || Package;

  return (
    // Use role="alert" for error-ish variants, otherwise role="status".
    <div
      className="search-state-panel"
      role={variant === "error" || variant === "backend" ? "alert" : "status"}
      aria-live="polite"
    >
      {/* Variant icon + title + optional description */}
      <Icon className="search-state-icon" aria-hidden="true" />
      <h2 className="search-state-title">{title}</h2>
      {description ? <p className="search-state-description">{description}</p> : null}
      {/* Optional actions: each button renders only if its handler is provided */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button type="button" variant="default" size="sm" className="gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("search.retry", "Try again")}
          </Button>
        ) : null}
        {onClearFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            {clearFiltersLabel || t("search.clear_filters")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
