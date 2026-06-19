import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { translateLocation } from "@/lib/i18n-helpers";
import {
  AlertTriangle,
  ArrowRight,
  Package,
  PlusCircle,
  Search,
  Shield,
} from "lucide-react";

const getItemPhoto = (item) => (
  item?.photo_urls?.[0]
  || item?.photoUrls?.[0]
  || item?.image_url
  || item?.imageUrl
  || ""
);

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasAdminAccess } = useAuth();
  const { isAdminMode } = useMode();
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const { data: foundItems = [] } = useQuery({
    queryKey: ["homeFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 200),
  });

  const { data: lostReports = [] } = useQuery({
    queryKey: ["homeLostReports"],
    queryFn: () => appClient.entities.LostReport.list("-created_date", 200),
  });

  const approvedItems = foundItems.filter((item) => item.status === "approved");
  const returnedItems = foundItems.filter((item) => item.status === "returned");
  const matchedReports = lostReports.filter((report) => report.matched_items?.length > 0);
  const recentApprovedItems = approvedItems.slice(0, 5);
  const isAdminWorkspace = hasAdminAccess && isAdminMode;

  const publicStats = [
    {
      label: t("home.available_items"),
      value: approvedItems.length,
      helper: t("home.available_items_helper"),
    },
    {
      label: t("home.matched_reports"),
      value: matchedReports.length,
      helper: t("home.matched_reports_helper"),
    },
    {
      label: t("home.returned_items"),
      value: returnedItems.length,
      helper: t("home.returned_items_helper"),
    },
  ];

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

  return (
    <div className="bg-background">
      <div className="page-shell pb-12 pt-8">
        <section className="surface-card p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden flex flex-col items-center text-center max-w-4xl mx-auto shadow-sm" aria-labelledby="home-title">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t("home.kicker")}</span>
            <h1 id="home-title" className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {t("home.title")}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
              {t("home.subtitle")}
            </p>
          </div>

          <div className="mt-8 w-full max-w-2xl">
            <form onSubmit={handleHomeSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={homeSearchQuery}
                  onChange={(event) => setHomeSearchQuery(event.target.value)}
                  className="h-12 rounded-xl border-slate-300 bg-white pl-12 text-sm focus-visible:ring-indigo-500"
                  placeholder={t("home.quick_search_placeholder", "Or, search the found items inventory directly...")}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 bg-primary px-6 text-white hover:bg-primary/90 font-semibold rounded-xl">
                {t("home.search_inventory", "Search Inventory")}
              </Button>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/ReportLost">
              <Button variant="outline" className="border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-semibold px-5 py-2.5 h-auto rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                {t("home.cant_find_it", "I lost something")}
              </Button>
            </Link>
            <Link to="/ReportFound">
              <Button variant="outline" className="border-sky-300 bg-sky-50 hover:bg-sky-100/80 text-sky-900 font-semibold px-5 py-2.5 h-auto rounded-xl flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-sky-700" />
                {t("home.found_something", "I found something")}
              </Button>
            </Link>
          </div>

          {/* Sleek horizontal stats ribbon */}
          <div className="mt-10 pt-8 border-t border-slate-200/80 w-full grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {publicStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{stat.helper}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recently found & dashboard link cards */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="surface-card">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <h2 className="section-heading">{t("home.recently_approved_items")}</h2>
                <p className="mt-1 text-xs text-slate-500">{t("home.recently_approved_subtitle")}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link to="/Search">{t("home.open_search")}</Link>
              </Button>
            </div>

            {recentApprovedItems.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentApprovedItems.map((item) => (
                  <Link key={item.id} to={`/ItemDetails?id=${item.id}`} className="group block px-5 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div className="flex gap-4 items-center">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getItemPhoto(item) ? (
                          <img
                            src={getItemPhoto(item)}
                            alt={t("home.photo_alt", { item: item.title })}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="font-semibold text-sm text-slate-900 group-hover:underline">{item.title}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {translateLocation(t, item.location_found) || t("common.unknown_location")}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500">{t("home.no_approved_items")}</div>
            )}
          </div>

          {isAdminWorkspace ? (
            <div className="surface-card p-6 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">{t("home.moderator_active_title", "Moderator Workspace Active")}</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {t("home.moderator_active_desc", "Manage pending found items, claims, and audit logs directly from the dashboard.")}
                </p>
              </div>
              <Button asChild className="bg-primary text-white hover:bg-primary/90 font-semibold px-6 rounded-xl">
                <Link to="/AdminDashboard">
                  {t("home.go_to_admin_panel", "Open Admin Dashboard")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="surface-card p-5 flex flex-col justify-between">
              <div>
                <h2 className="section-heading">{t("home.my_dashboard_title")}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {user ? t("home.my_dashboard_description") : t("home.project_documentation_description")}
                </p>
              </div>
              <Button asChild variant="outline" className="mt-5 w-full rounded-xl">
                <Link to={user ? "/UserDashboard" : "/Documentation"}>
                  {user ? t("navbar.my_dashboard") : t("footer.project_documentation")}
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
