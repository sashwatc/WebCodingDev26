/**
 * FindBack AI - Search / Browse Found Items Page
 * Prioritizes direct filtering and quick record review.
 */

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "@/components/search/ItemCard";
import { CATEGORIES, COLORS, LOCATIONS } from "@/lib/constants";
import { Grid3X3, List, Package, Search as SearchIcon, X } from "lucide-react";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [filters, setFilters] = useState({
    category: "all",
    color: "all",
    location: "all",
    sort: "newest",
  });

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["searchFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 200),
  });

  const approvedItems = useMemo(
    () => allItems.filter((item) => item.status === "approved"),
    [allItems]
  );

  const filteredItems = useMemo(() => {
    let items = [...approvedItems];

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
  }, [approvedItems, filters, searchQuery]);

  const activeFilterBadges = [
    filters.category !== "all" ? CATEGORIES.find((category) => category.value === filters.category)?.label : null,
    filters.color !== "all" ? filters.color : null,
    filters.location !== "all" ? filters.location : null,
    searchQuery ? `Query: ${searchQuery}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      category: "all",
      color: "all",
      location: "all",
      sort: "newest",
    });
  };

  const hasActiveFilters = activeFilterBadges.length > 0;

  return (
    <div className="page-shell py-10">
      <div className="page-header">
        <span className="page-kicker">Search</span>
        <h1 className="page-title">Search approved found-item records.</h1>
        <p className="page-subtitle">
          Search matches titles, descriptions, tags, brand, color, and found location. Only approved items appear in
          this public view.
        </p>
      </div>

      <section className="surface-card mb-6 p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
                placeholder='Try "airpods", "black bottle", or "library"'
                aria-label="Search found items"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Category
            </label>
            <Select value={filters.category} onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Color
            </label>
            <Select value={filters.color} onValueChange={(value) => setFilters((current) => ({ ...current, color: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All colors</SelectItem>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Location
            </label>
            <Select value={filters.location} onValueChange={(value) => setFilters((current) => ({ ...current, location: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sort
            </label>
            <Select value={filters.sort} onValueChange={(value) => setFilters((current) => ({ ...current, sort: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{approvedItems.length} approved items</Badge>
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
                Clear filters
              </Button>
            )}
            <div className="flex items-center rounded-md border">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                aria-label="List view"
                onClick={() => setViewMode("list")}
                className="h-9 w-9 rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                aria-label="Grid view"
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
        {isLoading ? "Loading items..." : `${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""}`}
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
          <h2 className="text-lg font-semibold text-slate-900">No matching items found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Try a broader description or remove one of the filters.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
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
