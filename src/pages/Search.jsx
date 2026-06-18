/**
 * FindBack AI - Search / Browse Found Items Page
 * Prioritizes direct filtering and quick record review.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "@/components/search/ItemCard";
import { CATEGORIES, COLORS, LOCATIONS } from "@/lib/constants";
import { translateCategory, translateColor, translateLocation } from "@/lib/i18n-helpers";
import { Grid3X3, List, Package, Search as SearchIcon, X } from "lucide-react";

export default function Search() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [viewMode, setViewMode] = useState("list");
  const [filters, setFilters] = useState({
    category: "all",
    color: "all",
    location: "all",
    sort: "newest",
  });

  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["searchRecords"],
    queryFn: async () => {
      const [foundItems, lostReports] = await Promise.all([
        appClient.entities.FoundItem.list("-created_date", 200),
        appClient.entities.LostReport.list("-created_date", 200),
      ]);

      return { foundItems, lostReports };
    },
  });

  const foundItems = data?.foundItems || [];
  const lostReports = data?.lostReports || [];

  const publicFoundItems = useMemo(
    () =>
      foundItems.filter(
        (item) => item.record_type !== "lost" && item.status === "approved" && !["claimed", "returned", "archived"].includes(item.status)
      ),
    [foundItems]
  );

  const publicLostReports = useMemo(
    () =>
      lostReports
        .filter((report) => !["resolved", "closed"].includes(report.status))
        .map((report) => ({
          id: report.id,
          title: report.item_type || t("item_details.lost_item_report"),
          description: report.description || "",
          ai_description: "",
          category: report.category || "",
          color: report.color || "",
          brand: report.brand || "",
          location_found: report.last_seen_location || "",
          date_found: report.date_lost || "",
          photo_urls: report.photo_url ? [report.photo_url] : [],
          status: report.status || "open",
          record_type: "lost",
          tags: [report.color, report.brand].filter(Boolean),
          created_date: report.created_date || "",
          updated_date: report.updated_date || "",
          matching_count: report.matched_items?.length || 0,
        })),
    [lostReports, t]
  );

  const searchableRecords = useMemo(
    () => [...publicFoundItems, ...publicLostReports],
    [publicFoundItems, publicLostReports]
  );

  const filteredItems = useMemo(() => {
    let items = [...searchableRecords];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const fields = [
          item.title,
          item.description,
          item.ai_description,
          item.brand,
          item.color,
          item.location_found,
          item.subcategory,
          item.distinguishing_features,
          item.record_type,
          ...(item.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return fields.includes(query);
      });
    }

    if (filters.category !== "all") {
      items = items.filter((item) => item.category === filters.category);
    }

    if (filters.color !== "all") {
      items = items.filter((item) => item.color === filters.color);
    }

    if (filters.location !== "all") {
      items = items.filter((item) => item.location_found === filters.location);
    }

    items.sort((a, b) => {
      const first = new Date(a.date_found || a.created_date || 0);
      const second = new Date(b.date_found || b.created_date || 0);
      return filters.sort === "oldest" ? first - second : second - first;
    });

    return items;
  }, [filters, searchQuery, searchableRecords]);

  const activeFilterBadges = [
    filters.category !== "all" ? translateCategory(t, filters.category) : null,
    filters.color !== "all" ? translateColor(t, filters.color) : null,
    filters.location !== "all" ? translateLocation(t, filters.location) : null,
    searchQuery ? t("search.query_badge", { query: searchQuery }) : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setSearchQuery("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    setSearchParams(nextParams);
    setFilters({
      category: "all",
      color: "all",
      location: "all",
      sort: "newest",
    });
  };

  const hasActiveFilters = activeFilterBadges.length > 0;

  if (error) {
    return (
      <div className="page-shell py-10">
        <div className="surface-card p-6 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-950">{t("search.unable_to_load")}</h2>
          <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10">
      <div className="page-header">
        <span className="page-kicker">{t("search.kicker")}</span>
        <h1 className="page-title">{t("search.title")}</h1>
        <p className="page-subtitle">{t("search.subtitle")}</p>
      </div>

      <section className="hero-panel mb-6 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("search.search_label")}
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setSearchQuery(nextQuery);
                  const nextParams = new URLSearchParams(searchParams);
                  if (nextQuery.trim()) {
                    nextParams.set("q", nextQuery);
                  } else {
                    nextParams.delete("q");
                  }
                  setSearchParams(nextParams);
                }}
                className="pl-9"
                placeholder={t("search.search_placeholder")}
                aria-label={t("search.search_aria")}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("common.category")}
            </label>
            <Select value={filters.category} onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("search.all_categories")}</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {translateCategory(t, category.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("common.color")}
            </label>
            <Select value={filters.color} onValueChange={(value) => setFilters((current) => ({ ...current, color: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("search.all_colors")}</SelectItem>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {translateColor(t, color)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("common.location")}
            </label>
            <Select value={filters.location} onValueChange={(value) => setFilters((current) => ({ ...current, location: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("search.all_locations")}</SelectItem>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {translateLocation(t, location)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("common.sort")}
            </label>
            <Select value={filters.sort} onValueChange={(value) => setFilters((current) => ({ ...current, sort: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("search.newest_first")}</SelectItem>
                <SelectItem value="oldest">{t("search.oldest_first")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("search.available_found_items", { count: publicFoundItems.length })}</Badge>
            <Badge variant="outline">{t("search.active_lost_reports", { count: publicLostReports.length })}</Badge>
            {hasActiveFilters &&
              activeFilterBadges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" />
                {t("search.clear_filters")}
              </Button>
            )}
            <div className="flex items-center rounded-md border">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                aria-label={t("search.list_view")}
                onClick={() => setViewMode("list")}
                className="h-9 w-9 rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                aria-label={t("search.grid_view")}
                onClick={() => setViewMode("grid")}
                className="h-9 w-9 rounded-l-none border-l"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 text-sm text-slate-600">
        {isLoading ? t("common.loading") : t("search.results_count", { count: filteredItems.length })}
      </div>

      {isLoading && (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface-card p-4">
              <Skeleton className="mb-3 h-32 rounded-md" />
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <div className="surface-card px-5 py-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h2 className="section-heading">{t("search.no_matching_items")}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("search.broaden_search")}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t("search.clear_filters")}
            </Button>
          )}
        </div>
      )}

      {!isLoading && filteredItems.length > 0 && (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
