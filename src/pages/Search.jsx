/**
 * Search.jsx - Search / Browse page (Found Items, Lost Reports, or All).
 *
 * Purpose: the main browse-and-search surface. It loads the found-item inventory
 * and lost reports, filters out non-public records, then applies the user's text
 * query + filters and renders the results as cards (list or grid view).
 *
 * One component serves three modes:
 *   - /Search           → found items (default, recordTypeOverride="found")
 *   - /LostItems        → lost reports (recordTypeOverride="lost")
 *   - /Search?type=all  → both, when launched from the global navbar search
 *
 * What the user can do: type a query (synced to the ?q= URL param), apply
 * category/color/location/sort filters (panel + quick-filter chips), toggle
 * list/grid view, ask the AI to "interpret" the query into filters, and save the
 * current search. The page has explicit loading, backend-unavailable, error, and
 * empty states.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import RadarPulseCanvas from "@/components/shared/RadarPulseCanvas";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import ItemCard from "@/components/search/ItemCard";
import { SearchResultsSkeleton, SearchStatePanel } from "@/components/search/SearchStates";
import { CATEGORIES, COLORS, LOCATIONS } from "@/lib/constants";
import { isPublicFoundItemStatus, isArchivedFoundItemStatus } from "@/lib/found-items";
import { translateCategory, translateColor, translateLocation } from "@/lib/i18n-helpers";
import { Grid3X3, List, Loader2, Search as SearchIcon, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainerProps } from "@/lib/motion";

function isBackendUnavailable(health) {
  // Treat missing/malformed health response (e.g. HTML from Vite) as unavailable
  return !health?.status || health.status === "unavailable" || health?.backend_required === true;
}


export default function Search({ recordTypeOverride = "found" }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || ""; // text query persisted in the URL
  /* type=all comes from the global navbar search — show both found and lost */
  const typeParam = searchParams.get("type");
  const isAllMode = typeParam === "all"; // combined found + lost results
  const recordType = recordTypeOverride || "found"; // which entity this page pins to
  const isLostItemsPage = recordType === "lost"; // toggles lost-vs-found copy/UI
  const [searchQuery, setSearchQuery] = useState(queryFromUrl); // controlled search box
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"
  // Active filters. recordType is part of the filter set so "all" mode can mix types.
  const [filters, setFilters] = useState({
    category: "all",
    color: "all",
    location: "all",
    sort: "relevance",
    // The global navbar search (type=all) must span both found and lost; only
    // the dedicated Found/Lost pages pin the record type.
    recordType: isAllMode ? "all" : recordType,
  });
  const [searchAssist, setSearchAssist] = useState(null); // AI "interpret search" result
  const [filtersOpen, setFiltersOpen] = useState(false); // filter sheet/drawer open
  const [saveSearchOpen, setSaveSearchOpen] = useState(false); // save-search dialog open
  const [saveSearchName, setSaveSearchName] = useState(""); // name input for saved search
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768); // drawer vs sheet

  // Track viewport so filters render in a bottom Drawer (mobile) vs side Sheet (desktop).
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keep the search box in sync if the ?q= URL param changes (e.g. navbar search).
  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  // Re-pin the record-type filter whenever the page mode changes.
  useEffect(() => {
    setFilters((curr) => ({ ...curr, recordType: isAllMode ? "all" : recordType }));
  }, [recordType, isAllMode]);

  // Backend health probe — gates the records query and drives the "unavailable" panel.
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["backendHealth"],
    queryFn: () => appClient.health.check(),
    staleTime: 30_000,
    retry: 1,
  });

  const backendUnavailable = !healthLoading && isBackendUnavailable(health);

  // Load both datasets in parallel; only runs once the backend is known reachable.
  const { data, isLoading, error, refetch: refetchSearch } = useQuery({
    queryKey: ["searchRecords"],
    queryFn: async () => {
      const [foundItems, lostReports] = await Promise.all([
        appClient.entities.FoundItem.list("-created_date", 200),
        appClient.entities.LostReport.list("-created_date", 200),
      ]);

      return { foundItems, lostReports };
    },
    enabled: !healthLoading && !backendUnavailable,
    staleTime: 60_000,
  });

  const foundItems = data?.foundItems || [];
  const lostReports = data?.lostReports || [];

  // Public found items: exclude lost-typed rows, non-public statuses, and archived.
  const publicFoundItems = useMemo(
    () =>
      foundItems.filter(
        (item) =>
          item.record_type !== "lost" &&
          isPublicFoundItemStatus(item.status) &&
          !isArchivedFoundItemStatus(item.status)
      ),
    [foundItems]
  );

  // Public lost reports: drop resolved/closed, then normalize each report into the
  // same shape ItemCard expects for found items (so both render uniformly).
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
          // Carried so the card can flag the viewer's OWN report. The backend
          // redacts contact_email on reports the caller doesn't own, and
          // submitted_by_user_email is the reporter — so only the owner matches.
          contact_email: report.contact_email || "",
          submitted_by_user_email: report.submitted_by_user_email || "",
        })),
    [lostReports, t]
  );

  // The candidate pool before query/filter narrowing — depends on the page mode.
  const searchableRecords = useMemo(() => {
    if (isAllMode) return [...publicFoundItems, ...publicLostReports];
    return isLostItemsPage ? publicLostReports : publicFoundItems;
  }, [isAllMode, isLostItemsPage, publicFoundItems, publicLostReports]);

  // The final visible list: apply text search, then each filter, then sorting.
  const filteredItems = useMemo(() => {
    let items = [...searchableRecords];

    // Text search: match the full lowercased query against a concatenation of
    // searchable fields, OR match any meaningful token (>2 chars, excluding
    // common stop/filler words) for looser partial matching.
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const queryTokens = query
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .filter((token) => !["after", "near", "with", "from", "lost", "found", "item"].includes(token));
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

        return fields.includes(query) || (queryTokens.length > 0 && queryTokens.some((token) => fields.includes(token)));
      });
    }

    // Dropdown/chip filters — each "all" value means "no constraint".
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

    // Sorting — "relevance" keeps source order; others sort by updated/found date.
    if (filters.sort !== "relevance") {
      items.sort((a, b) => {
        if (filters.sort === "updated") {
          const firstU = new Date(a.updated_date || a.updated_at || a.created_date || 0);
          const secondU = new Date(b.updated_date || b.updated_at || b.created_date || 0);
          return secondU - firstU;
        }
        const first = new Date(a.date_found || a.created_date || 0);
        const second = new Date(b.date_found || b.created_date || 0);
        return filters.sort === "oldest" ? first - second : second - first;
      });
    }

    return items;
  }, [filters, searchQuery, searchableRecords]);

  // Human-readable badges for every active filter/query (drives the filter bar + count).
  const activeFilterBadges = [
    filters.category !== "all" ? translateCategory(t, filters.category) : null,
    filters.color !== "all" ? translateColor(t, filters.color) : null,
    filters.location !== "all" ? translateLocation(t, filters.location) : null,
    searchQuery ? t("search.query_badge", { query: searchQuery }) : null,
  ].filter(Boolean);

  // Reset query + all filters back to defaults (and drop ?q= from the URL).
  const clearFilters = () => {
    setSearchQuery("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    setSearchParams(nextParams);
    setFilters({
      category: "all",
      color: "all",
      location: "all",
      sort: "relevance",
      recordType,
    });
  };

  const hasActiveFilters = activeFilterBadges.length > 0;
  // The "N results" / "Loading…" label above the result grid.
  const resultsLabel = isLoading
    ? t("common.loading")
    : t("search.results_count", { count: filteredItems.length });

  // Retry both the health probe and the records query (used by error/unavailable panels).
  const handleRetry = () => {
    void refetchHealth();
    void refetchSearch();
  };

  // AI "Interpret search": parse the free-text query into structured filters and
  // pre-apply category/color/location (the user can still edit them).
  const searchAssistMutation = useMutation({
    mutationFn: (query) => appClient.aiAssistance.parseSearchQuery(query),
    onSuccess: (suggestion) => {
      setSearchAssist(suggestion);
      setFilters((current) => ({
        ...current,
        category: suggestion?.category || current.category,
        color: suggestion?.color || current.color,
        location: suggestion?.location || current.location,
      }));
    },
  });

  // Shared filter controls (category, color, location, sort, clear) rendered
  // inside either the mobile Drawer or the desktop Sheet.
  const filterPanelContent = (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="filter-label" htmlFor="search-category-filter">
          {t("common.category")}
        </label>
        <Select value={filters.category} onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}>
          <SelectTrigger id="search-category-filter" className="h-11">
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

      <div className="space-y-2">
        <label className="filter-label" htmlFor="search-color-filter">
          {t("common.color")}
        </label>
        <Select value={filters.color} onValueChange={(value) => setFilters((current) => ({ ...current, color: value }))}>
          <SelectTrigger id="search-color-filter" className="h-11">
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

      <div className="space-y-2">
        <label className="filter-label" htmlFor="search-location-filter">
          {t("common.location")}
        </label>
        <Select value={filters.location} onValueChange={(value) => setFilters((current) => ({ ...current, location: value }))}>
          <SelectTrigger id="search-location-filter" className="h-11">
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

      <div className="space-y-2">
        <label className="filter-label" htmlFor="search-sort-filter">
          {t("common.sort")}
        </label>
        <Select value={filters.sort} onValueChange={(value) => setFilters((current) => ({ ...current, sort: value }))}>
          <SelectTrigger id="search-sort-filter" className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Most Relevant</SelectItem>
            <SelectItem value="newest">{t("search.newest_first")}</SelectItem>
            <SelectItem value="updated">{t("search.recently_updated", "Recently Updated")}</SelectItem>
            <SelectItem value="oldest">{t("search.oldest_first")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 border-t pt-6">
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          {t("search.clear_filters")}
        </Button>
      </div>
    </div>
  );

  // Top (hero) is the lighter shade; content below is the darker shade
  const heroBg = "#0d1117";
  const contentBg = "#08090f";

  // ── Page layout: hero banner, then search toolbar, filters, and results ──
  return (
    <div style={{ background: contentBg }}>
      {/* Full-bleed hero with locker graphic — copy switches by page mode */}
      <div
        className="relative mb-0 overflow-hidden"
        style={{ background: heroBg, minHeight: "220px" }}
      >
        <RadarPulseCanvas />
        <div className="mx-auto flex max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8" style={{ paddingRight: "clamp(2rem, 38%, 520px)", position: "relative", zIndex: 2 }}>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              {isAllMode ? "All items" : isLostItemsPage ? t("lost_items.kicker", "Lost reports") : t("search.kicker")}
            </span>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
              {isAllMode ? "Search Results" : isLostItemsPage ? t("lost_items.title", "Lost Items") : t("search.found_title", "Found Items")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
              {isAllMode
                ? "Searching across both found items and lost reports."
                : isLostItemsPage
                  ? t("lost_items.subtitle", "Browse items students and staff are looking for and see whether staff have already matched one to you.")
                  : t("search.found_subtitle", "Search the verified found-item inventory. Claimed, returned, and archived records stay out of public results; request a claim when something matches.")}
            </p>
          </div>
        </div>

        {/* Locker wall — tiled horizontally to fill the right portion of the hero */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[62%]"
          style={{
            backgroundImage: `url(${!isLostItemsPage ? "./images/locker-warm.png" : "./images/locker-cool.png"})`,
            backgroundSize: "auto 100%",
            backgroundPosition: "right center",
            backgroundRepeat: "repeat-x",
          }}
        >
          {/* Gradient fade — covers most of the panel so only the right edge shows clearly */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[88%]"
            style={{ background: `linear-gradient(to right, ${heroBg} 0%, ${heroBg}ee 40%, ${heroBg}99 70%, transparent 100%)` }}
          />
        </div>

        {/* Bottom border */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
      </div>

      <div className="page-shell py-8" style={{ background: contentBg }}>
      {/* Tabs — switch between the Found Items and Lost Reports pages */}
      <div className="mb-5 flex gap-2">
        <Button asChild variant={!isLostItemsPage ? "default" : "outline"}>
          <Link to="/Search">{t("search.found_items_tag", "Found Items")}</Link>
        </Button>
        <Button asChild variant={isLostItemsPage ? "default" : "outline"}>
          <Link to="/LostItems">{t("search.lost_reports_tag", "Lost Reports")}</Link>
        </Button>
      </div>

      <section className="mb-5 space-y-3" aria-label={t("search.search_label")}>
        {/* Search toolbar — single bordered card, no inner borders */}
        <div className="search-toolbar">
          {/* Search input — mirrors its value into the ?q= URL param as you type */}
          <div className="relative flex-1">
            <SearchIcon className="search-toolbar-icon" aria-hidden="true" />
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
              className="search-toolbar-input"
              placeholder={t("search.search_placeholder")}
              aria-label={t("search.search_aria")}
            />
          </div>

          <div className="flex items-center gap-1 pr-2">
            {/* Interpret search — ghost text button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={!searchQuery.trim() || searchAssistMutation.isPending}
              onClick={() => searchAssistMutation.mutate(searchQuery)}
            >
              {searchAssistMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Interpret search</span>
            </Button>

            <div className="h-5 w-px bg-border" aria-hidden="true" />

            {/* Filters — filled secondary button */}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("search.filters", "Filters")}</span>
              {activeFilterBadges.length > 0 ? (
                <span className="search-filter-count" aria-label={t("search.applied_filters", "Filters:")}>
                  {activeFilterBadges.length}
                </span>
              ) : null}
            </Button>

            {/* Filter container — bottom Drawer on mobile, side Sheet on desktop */}
            {isMobile ? (
              <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DrawerContent className="max-h-[90vh] overflow-y-auto">
                  <DrawerHeader>
                    <DrawerTitle>{t("search.filter_settings", "Filter Options")}</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-2">{filterPanelContent}</div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">Done</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ) : (
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetContent className="w-full p-6 sm:max-w-md">
                  <SheetHeader className="mb-6 border-b pb-4">
                    <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
                      <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                      {t("search.filter_settings", "Filter Options")}
                    </SheetTitle>
                    <SheetDescription>
                      {t("search.filter_description", "Refine results by category, color, location, and type.")}
                    </SheetDescription>
                  </SheetHeader>
                  {filterPanelContent}
                </SheetContent>
              </Sheet>
            )}

            <div className="h-5 w-px bg-border" aria-hidden="true" />

            {/* View toggles — icon-only, no container border */}
            <div className="view-toggle" role="group" aria-label={t("search.list_view")}>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                aria-label={t("search.list_view")}
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className="h-9 w-9"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                aria-label={t("search.grid_view")}
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className="h-9 w-9"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* AI search-interpretation result — editable suggestion badges + explanation */}
        {searchAssist ? (
          <div className="soft-panel px-4 py-3 text-sm text-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Editable search suggestions</span>
              {searchAssist.category ? <Badge variant="secondary">{translateCategory(t, searchAssist.category)}</Badge> : null}
              {searchAssist.color ? <Badge variant="secondary">{translateColor(t, searchAssist.color)}</Badge> : null}
              {searchAssist.location ? <Badge variant="secondary">{translateLocation(t, searchAssist.location)}</Badge> : null}
              {searchAssist.date_hint ? <Badge variant="outline">{searchAssist.date_hint}</Badge> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {searchAssist.explanation || "Suggestions are advisory only. Edit the search box or filters anytime."}
            </p>
          </div>
        ) : null}

        {/* Quick category chips (left) + live availability counts (right) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Quick filters — each chip toggles its category on/off */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { val: "electronics", label: t("categories.electronics") },
              { val: "clothing", label: t("categories.clothing") },
              { val: "keys_ids", label: t("categories.keys_ids") },
              { val: "bags_cases", label: t("categories.bags_cases") },
            ].map((cat) => {
              const active = filters.category === cat.val;
              return (
                <button
                  key={cat.val}
                  type="button"
                  onClick={() => setFilters((curr) => ({ ...curr, category: active ? "all" : cat.val }))}
                  aria-pressed={active}
                  className={`quick-filter-chip ${active ? "quick-filter-chip-active" : ""}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{t("search.available_found_items", { count: publicFoundItems.length })}</Badge>
            <Badge variant="outline">{t("search.active_lost_reports", { count: publicLostReports.length })}</Badge>
          </div>
        </div>

        {/* Active-filter bar — chips for each applied filter + "Clear All" */}
        {hasActiveFilters ? (
          <div className="active-filter-bar">
            <span className="text-xs font-medium text-muted-foreground">{t("search.applied_filters", "Filters:")}</span>
            {activeFilterBadges.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs font-medium">
                {badge}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-7 gap-1 px-2 text-xs">
              <X className="h-3 w-3" aria-hidden="true" />
              {t("search.clear_all", "Clear All")}
            </Button>
          </div>
        ) : null}
      </section>

      {/* Results count + "Save search" action */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resultsLabel}
        </p>
        {(filteredItems.length > 0 || hasActiveFilters) && !isLoading && !healthLoading ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSaveSearchName(""); setSaveSearchOpen(true); }}
          >
            Save search
          </Button>
        ) : null}
      </div>

      {/* ── Result region: exactly one of skeleton / unavailable / error / empty / grid ── */}
      {/* Loading skeleton while health or records are still loading */}
      {healthLoading || isLoading ? <SearchResultsSkeleton viewMode={viewMode} /> : null}

      {/* Backend unreachable */}
      {!healthLoading && backendUnavailable ? (
        <SearchStatePanel
          variant="backend"
          title={t("search.backend_unavailable_title")}
          description={t("search.backend_unavailable_description")}
          onRetry={handleRetry}
        />
      ) : null}

      {/* Records query failed */}
      {!healthLoading && !backendUnavailable && error ? (
        <SearchStatePanel
          variant="error"
          title={t("search.unable_to_load")}
          description={error.message || t("search.error_description")}
          onRetry={handleRetry}
        />
      ) : null}

      {/* Loaded successfully but nothing matches the query/filters */}
      {!healthLoading && !backendUnavailable && !isLoading && !error && filteredItems.length === 0 ? (
        <SearchStatePanel
          variant="empty"
          title={t("search.no_matching_items")}
          description={t("search.broaden_search")}
          onClearFilters={hasActiveFilters ? clearFilters : undefined}
          clearFiltersLabel={t("search.clear_filters")}
        />
      ) : null}

      {/* Results — staggered grid or list of ItemCards */}
      {!healthLoading && !backendUnavailable && !isLoading && !error && filteredItems.length > 0 ? (
        <motion.div
          className={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}
          {...staggerContainerProps}
        >
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} compact={viewMode === "list"} />
          ))}
        </motion.div>
      ) : null}

      {/* Lost-page secondary CTA — prompt to file a lost report if not listed */}
      {isLostItemsPage ? (
        <div className="search-secondary-cta mt-12 max-w-2xl">
          <h3 className="text-base font-semibold text-foreground">{t("search.lost_item_cta_title", "Don't see your missing item listed?")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "search.lost_item_cta_desc",
              "File a lost item report. PVHS staff will review it, check incoming items, and notify you as soon as a match is found."
            )}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/ReportLost">{t("common.report_lost_item", "Report a Lost Item")}</Link>
          </Button>
        </div>
      ) : null}

      {/* Save-search dialog — name the current query+filters to persist it */}
      <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="search-name-input">Name</Label>
            <Input
              id="search-name-input"
              className="mt-1.5"
              placeholder="e.g. Blue backpacks"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSearchOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!saveSearchName.trim()) return;
              // Persist to the backend; if that fails, fall back to localStorage.
              try {
                await appClient.savedSearches.create({
                  name: saveSearchName.trim(),
                  filters: { query: searchQuery, ...filters },
                  alertsEnabled: true,
                });
              } catch {
                const saved = JSON.parse(localStorage.getItem("ltf_saved_searches") || "[]");
                saved.unshift({ id: String(Date.now()), name: saveSearchName.trim(), query: searchQuery, filters, savedAt: new Date().toISOString() });
                localStorage.setItem("ltf_saved_searches", JSON.stringify(saved));
              }
              setSaveSearchOpen(false);
              toast({ title: "Search saved", description: `Saved as "${saveSearchName.trim()}"` });
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div> {/* end page-shell */}
    </div>
  );
}
