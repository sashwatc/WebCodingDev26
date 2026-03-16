/**
 * FindBack AI - Search / Browse Found Items Page
 * Advanced search with filters, AI smart search, grid/list toggle,
 * and responsive filter drawer for mobile.
 */

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { CATEGORIES, LOCATIONS, COLORS } from "@/lib/constants";
import ItemCard from "@/components/search/ItemCard";
import {
  Search as SearchIcon, Grid3X3, List, SlidersHorizontal,
  X, Package, Sparkles
} from "lucide-react";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    category: "all", color: "all", location: "all", status: "all", sort: "newest",
  });

  // Fetch all approved (and claimed/returned for browsing) found items
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["searchFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 200),
  });

  // Client-side filtering and search
  const filteredItems = useMemo(() => {
    let items = allItems.filter(item =>
      ["approved", "claimed", "returned"].includes(item.status)
    );

    // Text search across multiple fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => {
        const searchFields = [
          item.title, item.description, item.ai_description,
          item.brand, item.color, item.location_found,
          item.subcategory, item.distinguishing_features,
          ...(item.tags || []),
        ].filter(Boolean).join(" ").toLowerCase();
        return searchFields.includes(q);
      });
    }

    // Category filter
    if (filters.category !== "all") {
      items = items.filter(item => item.category === filters.category);
    }
    // Color filter
    if (filters.color !== "all") {
      items = items.filter(item => item.color === filters.color);
    }
    // Location filter
    if (filters.location !== "all") {
      items = items.filter(item => item.location_found === filters.location);
    }
    // Status filter
    if (filters.status !== "all") {
      items = items.filter(item => item.status === filters.status);
    }

    // Sorting
    switch (filters.sort) {
      case "oldest":
        items.sort((a, b) => new Date(a.date_found) - new Date(b.date_found));
        break;
      case "newest":
      default:
        items.sort((a, b) => new Date(b.date_found) - new Date(a.date_found));
        break;
    }

    return items;
  }, [allItems, searchQuery, filters]);

  const clearFilters = () => {
    setFilters({ category: "all", color: "all", location: "all", status: "all", sort: "newest" });
    setSearchQuery("");
  };

  const hasActiveFilters = filters.category !== "all" || filters.color !== "all" || filters.location !== "all" || filters.status !== "all" || searchQuery;

  // Filter controls component (reused in desktop sidebar and mobile sheet)
  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
        <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Color</label>
        <Select value={filters.color} onValueChange={(v) => setFilters(f => ({ ...f, color: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Location</label>
        <Select value={filters.location} onValueChange={(v) => setFilters(f => ({ ...f, location: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
        <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Sort By</label>
        <Select value={filters.sort} onValueChange={(v) => setFilters(f => ({ ...f, sort: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-slate-500 gap-1">
          <X className="w-3.5 h-3.5" /> Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Found Items</h1>
        <p className="text-slate-500">Browse items that have been found on campus.</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <Input
            placeholder='Search items — try "black bottle near gym" or "airpods"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            aria-label="Search found items"
          />
          {searchQuery && (
            <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-teal-50 text-teal-700 text-[10px] gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Smart Search
            </Badge>
          )}
        </div>

        {/* View Toggle */}
        <div className="hidden sm:flex border rounded-lg overflow-hidden">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")} aria-label="Grid view">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")} aria-label="List view">
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Filter Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs">
            <SheetHeader>
              <SheetTitle>Filter Items</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-sm text-slate-900 mb-4">Filters</h3>
            <FilterControls />
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {isLoading ? "Loading..." : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""} found`}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-slate-400 gap-1 lg:hidden">
                <X className="w-3 h-3" /> Clear Filters
              </Button>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-4">
                  <Skeleton className="h-40 rounded-lg mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-1">No Items Found</h3>
              <p className="text-sm text-slate-400 mb-4">
                {searchQuery ? "Try adjusting your search or filters." : "No items match your current filters."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          )}

          {/* Results Grid/List */}
          {!isLoading && filteredItems.length > 0 && (
            <div className={
              viewMode === "grid"
                ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
                : "space-y-3"
            }>
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
