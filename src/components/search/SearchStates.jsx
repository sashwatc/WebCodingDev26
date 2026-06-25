import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Package, RefreshCw, ServerOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultsSkeleton({ viewMode = "list", count = 6 }) {
  const items = Array.from({ length: count });

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

export function SearchStatePanel({
  variant = "empty",
  title,
  description,
  onRetry,
  onClearFilters,
  clearFiltersLabel,
}) {
  const { t } = useTranslation();

  const icons = {
    empty: Package,
    error: AlertTriangle,
    backend: ServerOff,
    offline: WifiOff,
  };

  const Icon = icons[variant] || Package;

  return (
    <div
      className="search-state-panel"
      role={variant === "error" || variant === "backend" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon className="search-state-icon" aria-hidden="true" />
      <h2 className="search-state-title">{title}</h2>
      {description ? <p className="search-state-description">{description}</p> : null}
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
