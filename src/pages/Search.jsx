import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
  DrawerFooter, DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import ItemCard from "@/components/search/ItemCard";
import { SearchResultsSkeleton, SearchStatePanel } from "@/components/search/SearchStates";
import { CATEGORIES, COLORS } from "@/lib/constants";
import { translateCategory, translateColor } from "@/lib/i18n-helpers";
import { staggerContainerProps } from "@/lib/motion";
import {
  Bookmark, Loader2, Search as SearchIcon, SlidersHorizontal, X,
} from "lucide-react";

// ── Default filter state ──────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  keywords: "",
  category: "all",
  color: "all",
  location: "",
  status: "all",
  sort: "newest",
};

// ── Filter panel content (shared between Sheet and desktop sidebar) ───────────

function FilterPanel({ filters, onFilterChange, onClear }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="fp-category" className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
          {t("common.category")}
        </Label>
        <Select
          value={filters.category}
          onValueChange={(v) => onFilterChange("category", v)}
        >
          <SelectTrigger id="fp-category" className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("search.all_categories", "All categories")}</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {translateCategory(t, cat.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fp-color" className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
          {t("common.color")}
        </Label>
        <Select
          value={filters.color}
          onValueChange={(v) => onFilterChange("color", v)}
        >
          <SelectTrigger id="fp-color" className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("search.all_colors", "All colors")}</SelectItem>
            {COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                {translateColor(t, color)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fp-location" className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
          {t("common.location")}
        </Label>
        <Input
          id="fp-location"
          placeholder="e.g. Library, Gym…"
          value={filters.location}
          onChange={(e) => onFilterChange("location", e.target.value)}
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fp-status" className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
          Status
        </Label>
        <Select
          value={filters.status}
          onValueChange={(v) => onFilterChange("status", v)}
        >
          <SelectTrigger id="fp-status" className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Available</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" className="w-full" onClick={onClear}>
        {t("search.clear_filters", "Clear filters")}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Search() {
  useEffect(() => { document.title = "Search — Lost Then Found"; }, []);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rawQuery, setRawQuery] = useState(searchParams.get("q") || "");
  const [isParsingQuery, setIsParsingQuery] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // ── Sync URL query param on first mount ─────────────────────────────────────

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setRawQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 500ms debounce → parseSearchQuery ──────────────────────────────────────

  useEffect(() => {
    if (!rawQuery.trim()) {
      setFilters((prev) => ({ ...prev, keywords: "" }));
      const next = new URLSearchParams(searchParams);
      next.delete("q");
      setSearchParams(next, { replace: true });
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("q", rawQuery);
    setSearchParams(next, { replace: true });

    const timer = setTimeout(async () => {
      setIsParsingQuery(true);
      try {
        const parsed = await appClient.aiAssistance.parseSearchQuery(rawQuery);
        setFilters((prev) => ({
          ...prev,
          keywords: parsed.keywords || rawQuery,
          ...(parsed.category ? { category: parsed.category } : {}),
          ...(parsed.color ? { color: parsed.color } : {}),
          ...(parsed.location ? { location: parsed.location } : {}),
        }));
      } catch {
        setFilters((prev) => ({ ...prev, keywords: rawQuery }));
      } finally {
        setIsParsingQuery(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  // searchParams deliberately excluded — only rawQuery should trigger this
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawQuery]);

  // ── Server-side filter params ────────────────────────────────────────────────

  const serverParams = useMemo(() => ({
    ...(filters.category !== "all" && { category: filters.category }),
    ...(filters.color !== "all" && { color: filters.color }),
    ...(filters.status !== "all" && { status: filters.status }),
  }), [filters.category, filters.color, filters.status]);

  const {
    data: rawItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["searchItems", serverParams],
    queryFn: () => appClient.items.filter(serverParams),
    staleTime: 60_000,
  });

  // ── Client-side filter + sort ────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let items = [...rawItems];

    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      items = items.filter((item) =>
        (item.location_found || "").toLowerCase().includes(loc),
      );
    }

    if (filters.keywords.trim()) {
      const kws = filters.keywords
        .toLowerCase()
        .split(/\s+/)
        .filter((k) => k.length > 1);
      items = items.filter((item) => {
        const text = [item.title, item.description, item.brand, ...(item.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return kws.some((kw) => text.includes(kw));
      });
    }

    return items.sort((a, b) => {
      if (filters.sort === "updated") {
        return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
      }
      return (
        new Date(b.created_date || b.date_found || 0) -
        new Date(a.created_date || a.date_found || 0)
      );
    });
  }, [rawItems, filters]);

  // ── Filter chips ─────────────────────────────────────────────────────────────

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const chips = [
    filters.keywords && {
      key: "keywords",
      label: `"${filters.keywords}"`,
      onRemove: () => setFilter("keywords", ""),
    },
    filters.category !== "all" && {
      key: "category",
      label: translateCategory(t, filters.category),
      onRemove: () => setFilter("category", "all"),
    },
    filters.color !== "all" && {
      key: "color",
      label: translateColor(t, filters.color),
      onRemove: () => setFilter("color", "all"),
    },
    filters.location && {
      key: "location",
      label: filters.location,
      onRemove: () => setFilter("location", ""),
    },
    filters.status !== "all" && {
      key: "status",
      label: filters.status,
      onRemove: () => setFilter("status", "all"),
    },
  ].filter(Boolean);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setRawQuery("");
    setFilters(DEFAULT_FILTERS);
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const handleSaveSearch = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("ltf-saved-searches") || "[]");
      existing.push({ query: rawQuery, filters, timestamp: Date.now() });
      localStorage.setItem("ltf-saved-searches", JSON.stringify(existing));
      toast({ title: "Search saved" });
    } catch {
      toast({ title: "Could not save search", variant: "destructive" });
    }
  };

  const filterPanelProps = {
    filters,
    onFilterChange: setFilter,
    onClear: clearFilters,
  };

  const activeCount = chips.length;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell py-10">
      <div className="page-header max-w-3xl">
        <span className="page-kicker">{t("search.kicker", "Item archive")}</span>
        <h1 className="page-title">{t("search.found_title", "Found Items")}</h1>
        <p className="page-subtitle">
          {t("search.found_subtitle", "Search the verified found-item inventory.")}
        </p>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <section className="mb-4 space-y-3" aria-label={t("search.search_label", "Search")}>
        <div className="flex gap-2">
          {/* Input */}
          <div className="relative flex-1">
            {isParsingQuery ? (
              <Loader2
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <SearchIcon
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <Input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Trigger immediately on Enter by flushing the pending debounce
                  setFilters((prev) => ({ ...prev, keywords: rawQuery.trim() }));
                }
              }}
              className="h-11 pl-9 pr-4"
              placeholder={t("search.search_placeholder", "Search by item, brand, color…")}
              aria-label={t("search.search_aria", "Search found items")}
            />
          </div>

          {/* Desktop sidebar toggle */}
          <Button
            variant="outline"
            className="hidden h-11 gap-2 xl:flex"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-expanded={sidebarOpen}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>

          {/* Mobile bottom Drawer trigger */}
          <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 xl:hidden">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
                {activeCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filter Options
                </DrawerTitle>
                <DrawerDescription>
                  Refine results by category, color, location, and status.
                </DrawerDescription>
              </DrawerHeader>
              <div className="max-h-[55vh] overflow-y-auto px-4 pb-2">
                <FilterPanel {...filterPanelProps} />
              </div>
              <DrawerFooter>
                <Button onClick={() => setMobileFilterOpen(false)} className="min-h-[44px]">
                  Apply Filters
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {/* Save Search */}
          <Button
            variant="outline"
            className="h-11 gap-2"
            onClick={handleSaveSearch}
            aria-label="Save this search"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Save Search</span>
          </Button>
        </div>

        {/* ── Filter chips ──────────────────────────────────────────────────── */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Active filters">
            {chips.map((chip) => (
              <span
                key={chip.key}
                role="listitem"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={clearFilters}
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Clear all
            </Button>
          </div>
        )}
      </section>

      {/* ── Main layout: sidebar + results ──────────────────────────────────── */}
      <div className="flex gap-8">

        {/* Desktop sidebar */}
        {sidebarOpen && (
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                Filters
              </p>
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>
        )}

        {/* Results column */}
        <div className="min-w-0 flex-1">
          {/* Sort + count bar */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
              {isLoading
                ? t("common.loading", "Loading…")
                : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""}`}
            </p>
            <Select
              value={filters.sort}
              onValueChange={(v) => setFilter("sort", v)}
            >
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading */}
          {isLoading && <SearchResultsSkeleton viewMode="list" count={3} />}

          {/* Error */}
          {!isLoading && error && (
            <SearchStatePanel
              variant="error"
              title="Could not load items"
              description={error.message || "An unexpected error occurred."}
              onRetry={refetch}
            />
          )}

          {/* Empty */}
          {!isLoading && !error && filteredItems.length === 0 && (
            <SearchStatePanel
              variant="empty"
              title="No items match"
              description="Try different keywords or remove some filters."
              onClearFilters={chips.length > 0 ? clearFilters : undefined}
              clearFiltersLabel="Clear filters"
            />
          )}

          {/* Results */}
          {!isLoading && !error && filteredItems.length > 0 && (
            <motion.div className="space-y-3" aria-label="Search results" {...staggerContainerProps}>
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} viewMode="list" compact />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
