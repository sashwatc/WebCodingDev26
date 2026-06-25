import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { appClient } from "@/api/appClient";
import ItemCard from "@/components/search/ItemCard";
import { SearchResultsSkeleton, SearchStatePanel } from "@/components/search/SearchStates";
import { isPublicFoundItemStatus, isArchivedFoundItemStatus } from "@/lib/found-items";
import { AlertTriangle, PlusCircle, Search, Shield } from "lucide-react";

function isBackendUnavailable(health) {
  return health?.status === "unavailable" || health?.backend_required === true;
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasAdminAccess } = useAuth();
  const { isAdminMode } = useMode();
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const isAdminWorkspace = hasAdminAccess && isAdminMode;

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["backendHealth"],
    queryFn: () => appClient.health.check(),
    staleTime: 30_000,
    retry: 1,
  });

  const backendUnavailable = !healthLoading && isBackendUnavailable(health);

  const {
    data: previewItems = [],
    isLoading: previewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ["homePreviewItems"],
    queryFn: async () => {
      const items = await appClient.entities.FoundItem.list("-created_date", 12);
      return items
        .filter(
          (item) =>
            item.record_type !== "lost" &&
            isPublicFoundItemStatus(item.status) &&
            !isArchivedFoundItemStatus(item.status)
        )
        .slice(0, 4);
    },
    enabled: !backendUnavailable,
    staleTime: 60_000,
  });

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

  const previewState = useMemo(() => {
    if (backendUnavailable) {
      return "backend";
    }
    if (previewLoading) {
      return "loading";
    }
    if (previewError) {
      return "error";
    }
    if (previewItems.length === 0) {
      return "empty";
    }
    return "ready";
  }, [backendUnavailable, previewError, previewItems.length, previewLoading]);

  return (
    <div className="page-shell py-10 sm:py-14">
      <section className="max-w-3xl" aria-labelledby="home-title">
        <p className="page-kicker">{t("home.kicker")}</p>
        <h1 id="home-title" className="page-title mt-2">
          {t("home.title")}
        </h1>
        <p className="page-subtitle mt-3">{t("home.subtitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("home.front_desk_note")}</p>
      </section>

      <section className="mt-8 max-w-2xl" aria-labelledby="home-search-heading">
        <h2 id="home-search-heading" className="sr-only">
          {t("home.search_step_title")}
        </h2>
        <form onSubmit={handleHomeSearch} className="search-hero-form">
          <div className="relative flex-1">
            <Search className="search-hero-icon" aria-hidden="true" />
            <Input
              value={homeSearchQuery}
              onChange={(event) => setHomeSearchQuery(event.target.value)}
              className="search-hero-input"
              placeholder={t("home.search_placeholder")}
              aria-label={t("home.search_aria")}
            />
          </div>
          <Button type="submit" className="search-hero-submit shrink-0">
            {t("home.search_inventory")}
          </Button>
        </form>
        <p className="mt-2 text-sm text-muted-foreground">{t("home.search_help")}</p>
      </section>

      <section className="mt-8 max-w-2xl" aria-labelledby="home-secondary-actions">
        <h2 id="home-secondary-actions" className="text-sm font-semibold text-foreground">
          {t("home.next_step_title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("home.next_step_helper")}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link to="/ReportLost" className="flex-1">
            <Button variant="outline" className="secondary-action-button w-full justify-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-left">
                <span className="block font-semibold">{t("home.cant_find_it")}</span>
                <span className="block text-xs font-normal text-muted-foreground">{t("home.lost_helper")}</span>
              </span>
            </Button>
          </Link>
          <Link to="/ReportFound" className="flex-1">
            <Button variant="outline" className="secondary-action-button w-full justify-start gap-2">
              <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-left">
                <span className="block font-semibold">{t("home.found_something")}</span>
                <span className="block text-xs font-normal text-muted-foreground">{t("home.found_helper")}</span>
              </span>
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="home-preview-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="home-preview-heading" className="section-heading">
              {t("home.recently_approved_items")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.recently_approved_subtitle")}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/Search">{t("home.open_search")}</Link>
          </Button>
        </div>

        {previewState === "loading" ? <SearchResultsSkeleton viewMode="list" count={3} /> : null}

        {previewState === "backend" ? (
          <SearchStatePanel
            variant="backend"
            title={t("search.backend_unavailable_title")}
            description={t("search.backend_unavailable_description")}
            onRetry={() => {
              void refetchHealth();
              void refetchPreview();
            }}
          />
        ) : null}

        {previewState === "error" ? (
          <SearchStatePanel
            variant="error"
            title={t("search.unable_to_load")}
            description={previewError?.message || t("search.error_description")}
            onRetry={() => refetchPreview()}
          />
        ) : null}

        {previewState === "empty" ? (
          <SearchStatePanel
            variant="empty"
            title={t("home.no_approved_items")}
            description={t("search.broaden_search")}
          />
        ) : null}

        {previewState === "ready" ? (
          <div className="space-y-3">
            {previewItems.map((item) => (
              <ItemCard key={item.id} item={item} viewMode="list" compact />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-10 border-t border-border pt-8 max-w-2xl">
        {isAdminWorkspace ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4" aria-hidden="true" />
                {t("home.moderator_active_title")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("home.admin_workspace_active")}</p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/AdminDashboard">{t("home.go_to_admin_panel")}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{t("home.my_dashboard_title")}</h3>
              <p className="text-sm text-muted-foreground">
                {user ? t("home.my_dashboard_description") : t("home.project_documentation_description")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link to={user ? "/UserDashboard" : "/Documentation"}>
                {user ? t("navbar.my_dashboard") : t("footer.project_documentation")}
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
