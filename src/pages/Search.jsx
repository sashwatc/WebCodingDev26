/**
 * FindBack AI - Search / Browse Found Items Page
 * Prioritizes direct filtering and quick record review.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ItemCard from "@/components/search/ItemCard";
import { CATEGORIES, COLORS, LOCATIONS } from "@/lib/constants";
import { translateCategory, translateColor, translateLocation } from "@/lib/i18n-helpers";
import { Grid3X3, List, Package, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";

export default function Search({ recordTypeOverride = "found" }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const recordType = recordTypeOverride || "found";
  const isLostItemsPage = recordType === "lost";
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [viewMode, setViewMode] = useState("list");
  const [filters, setFilters] = useState({
    category: "all",
    color: "all",
    location: "all",
    sort: "newest",
    recordType,
  });

  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    setFilters((curr) => ({ ...curr, recordType }));
  }, [recordType]);

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
          matched_items: report.matched_items || [],
        })),
    [lostReports, t]
  );

  const searchableRecords = useMemo(
    () => {
      return isLostItemsPage ? publicLostReports : publicFoundItems;
    },
    [isLostItemsPage, publicFoundItems, publicLostReports]
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

    if (filters.recordType !== "all") {
      items = items.filter((item) => item.record_type === filters.recordType);
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
      recordType,
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
        <span className="page-kicker">{isLostItemsPage ? t("lost_items.kicker", "Lost reports") : t("search.kicker")}</span>
        <h1 className="page-title">{isLostItemsPage ? t("lost_items.title", "Lost Items") : t("search.found_title", "Found Items")}</h1>
        <p className="page-subtitle">
          {isLostItemsPage
            ? t("lost_items.subtitle", "Browse items students and staff are looking for. If you physically found one, submit it as a found item so the normal verification workflow can begin.")
            : t("search.found_subtitle", "Search the verified found-item inventory. Claimed, returned, and archived records stay out of public results.")}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild variant={!isLostItemsPage ? "secondary" : "outline"} size="sm">
          <Link to="/Search">{t("search.found_items_tag", "Found Items")}</Link>
        </Button>
        <Button asChild variant={isLostItemsPage ? "secondary" : "outline"} size="sm">
          <Link to="/LostItems">{t("search.lost_reports_tag", "Lost Reports")}</Link>
        </Button>
      </div>

      <section className="mb-6 space-y-4">
        {/* Main Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
              className="h-12 rounded-xl border-slate-300 bg-white pl-12 text-sm shadow-sm"
              placeholder={t("search.search_placeholder")}
              aria-label={t("search.search_aria")}
            />
          </div>

          <div className="flex gap-2">
            {/* Sliding Drawer Filter Dialog */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 gap-2 border-slate-300 rounded-xl px-5 shadow-sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>{t("search.filters", "Filters")}</span>
                  {activeFilterBadges.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {activeFilterBadges.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-6">
                <SheetHeader className="border-b pb-4 mb-6">
                  <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    {t("search.filter_settings", "Filter Options")}
                  </SheetTitle>
                  <SheetDescription>
                    {t("search.filter_description", "Refine results by category, color, location, and type.")}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  {/* Category filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {t("common.category")}
                    </label>
                    <Select value={filters.category} onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}>
                      <SelectTrigger className="w-full h-11 border-slate-300">
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

                  {/* Color filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {t("common.color")}
                    </label>
                    <Select value={filters.color} onValueChange={(value) => setFilters((current) => ({ ...current, color: value }))}>
                      <SelectTrigger className="w-full h-11 border-slate-300">
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

                  {/* Location filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {t("common.location")}
                    </label>
                    <Select value={filters.location} onValueChange={(value) => setFilters((current) => ({ ...current, location: value }))}>
                      <SelectTrigger className="w-full h-11 border-slate-300">
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

                  {/* Sort */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {t("common.sort")}
                    </label>
                    <Select value={filters.sort} onValueChange={(value) => setFilters((current) => ({ ...current, sort: value }))}>
                      <SelectTrigger className="w-full h-11 border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{t("search.newest_first")}</SelectItem>
                        <SelectItem value="oldest">{t("search.oldest_first")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <Button variant="outline" className="w-full text-slate-500 hover:text-slate-900" onClick={clearFilters}>
                    {t("search.clear_filters")}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center rounded-xl border border-slate-300 shadow-sm bg-white p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                aria-label={t("search.list_view")}
                onClick={() => setViewMode("list")}
                className="h-10 w-10 rounded-lg"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                aria-label={t("search.grid_view")}
                onClick={() => setViewMode("grid")}
                className="h-10 w-10 rounded-lg"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filter Tags & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {/* Category Quick Tags */}
            {[
              { val: "electronics", label: t("categories.electronics") },
              { val: "clothing", label: t("categories.clothing") },
              { val: "keys_ids", label: t("categories.keys_ids") },
              { val: "bags_cases", label: t("categories.bags_cases") }
            ].map(cat => {
              const active = filters.category === cat.val;
              return (
                <button
                  key={cat.val}
                  type="button"
                  onClick={() => setFilters(curr => ({ ...curr, category: active ? "all" : cat.val }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900"
                      : "bg-white text-slate-600 hover:text-slate-900 border-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline" className="border-slate-200">{t("search.available_found_items", { count: publicFoundItems.length })}</Badge>
            <Badge variant="outline" className="border-slate-200">{t("search.active_lost_reports", { count: publicLostReports.length })}</Badge>
          </div>
        </div>

        {/* Active badges list if any filters active */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border p-2.5 rounded-xl animate-in fade-in duration-200">
            <span className="text-xs font-medium text-slate-500 mr-1">{t("search.applied_filters", "Filters:")}</span>
            {activeFilterBadges.map((badge) => (
              <Badge key={badge} variant="secondary" className="gap-1 bg-white border border-slate-200 px-2 py-0.5 text-xs font-medium">
                {badge}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs gap-1 ml-auto text-slate-500 hover:text-slate-950">
              <X className="h-3 w-3" />
              {t("search.clear_all", "Clear All")}
            </Button>
          </div>
        )}
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

      {isLostItemsPage && (
        <div className="mt-12 p-6 rounded-xl border border-amber-250 bg-amber-500/5 dark:border-amber-900/40 dark:bg-amber-950/10 text-center max-w-2xl mx-auto space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">
            {t("search.lost_item_cta_title", "Don't see your missing item listed?")}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {t("search.lost_item_cta_desc", "File a lost item report. PVHS staff will review it, check incoming items, and notify you as soon as a match is found.")}
          </p>
          <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl mt-2 px-6">
            <Link to="/ReportLost">
              {t("common.report_lost_item", "Report a Lost Item")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
