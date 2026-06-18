/**
 * Lost Then Found - Home Page
 * Prioritizes the first user decision: search first, then report only if needed.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { formatLocalizedDate, translateCategory, translateLocation } from "@/lib/i18n-helpers";
import {
  AlertTriangle,
  ArrowRight,
  Package,
  PlusCircle,
  Search,
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

  const { data: claims = [] } = useQuery({
    queryKey: ["homeClaims"],
    queryFn: () => appClient.entities.Claim.list("-created_date", 200),
  });

  const { data: lostReports = [] } = useQuery({
    queryKey: ["homeLostReports"],
    queryFn: () => appClient.entities.LostReport.list("-created_date", 200),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["homeAuditLogs"],
    queryFn: () => appClient.entities.AuditLog.list("-created_date", 20),
  });

  const approvedItems = foundItems.filter((item) => item.status === "approved");
  const pendingItems = foundItems.filter((item) => item.status === "pending_review");
  const returnedItems = foundItems.filter((item) => item.status === "returned");
  const activeClaims = claims.filter((claim) => ["submitted", "under_review"].includes(claim.status));
  const openReports = lostReports.filter((report) => report.status === "open");
  const matchedReports = lostReports.filter((report) => report.matched_items?.length > 0);
  const recentApprovedItems = approvedItems.slice(0, 5);
  const recentActivity = auditLogs.slice(0, 4);
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

  const reportActions = [
    {
      icon: AlertTriangle,
      title: t("home.cant_find_it"),
      description: t("home.lost_helper"),
      to: "/ReportLost",
      action: t("common.report_lost_item"),
      iconClassName: "text-amber-700 dark:text-amber-200",
    },
    {
      icon: PlusCircle,
      title: t("home.found_something"),
      description: t("home.found_helper"),
      to: "/ReportFound",
      action: t("common.report_found_item"),
      iconClassName: "text-emerald-700 dark:text-emerald-200",
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
        <section className="surface-card overflow-hidden" aria-labelledby="home-title">
          <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800 lg:border-b-0 lg:border-r">
              <p className="text-sm font-semibold text-slate-950">{t("home.kicker")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("home.front_desk_note")}</p>

              <dl className="mt-6 space-y-4" aria-label={t("home.quick_actions")}>
                {publicStats.map((stat) => (
                  <div key={stat.label} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0 dark:border-slate-700">
                    <dt className="text-sm font-medium text-slate-700">{stat.label}</dt>
                    <dd className="mt-1 flex items-baseline justify-between gap-3">
                      <span className="text-2xl font-semibold text-slate-950">{stat.value}</span>
                      <span className="text-xs text-slate-500">{stat.helper}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>

            <div className="p-5 sm:p-7 lg:p-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-slate-700">{t("home.start_here")}</p>
                <h1 id="home-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {t("home.title")}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  {t("home.subtitle")}
                </p>
              </div>

              <form onSubmit={handleHomeSearch} className="mt-7 max-w-4xl">
                <label className="block text-sm font-semibold text-slate-900" htmlFor="home-search">
                  {t("home.search_inventory")}
                </label>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t("home.search_help")}</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="home-search"
                      value={homeSearchQuery}
                      onChange={(event) => setHomeSearchQuery(event.target.value)}
                      className="h-14 border-slate-300 bg-white pl-12 text-base"
                      placeholder={t("home.search_placeholder")}
                      aria-label={t("home.search_aria")}
                    />
                  </div>

                  <Button type="submit" size="lg" className="h-14 px-6">
                    <Search className="h-4 w-4" />
                    {t("common.search_found_items")}
                  </Button>
                </div>
              </form>

              <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="max-w-2xl">
                  <h2 className="section-heading">{t("home.next_step_title")}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t("home.next_step_helper")}</p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {reportActions.map((card) => (
                    <Link
                      key={card.title}
                      to={card.to}
                      className="group flex h-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                    >
                      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 ${card.iconClassName}`}>
                        <card.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-950">{card.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          {card.action}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="surface-card">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <h2 className="section-heading">{t("home.recently_approved_items")}</h2>
                <p className="mt-1 text-sm text-slate-600">{t("home.recently_approved_subtitle")}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/Search">{t("home.open_search")}</Link>
              </Button>
            </div>

            {recentApprovedItems.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentApprovedItems.map((item) => (
                  <Link key={item.id} to={`/ItemDetails?id=${item.id}`} className="group block px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getItemPhoto(item) ? (
                          <img
                            src={getItemPhoto(item)}
                            alt={t("home.photo_alt", { item: item.title })}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950 group-hover:underline">{item.title}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {translateLocation(t, item.location_found) || t("common.unknown_location")}
                        </p>
                        {item.category && (
                          <Badge variant="outline" className="mt-2">
                            {translateCategory(t, item.category)}
                          </Badge>
                        )}
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500">{t("home.no_approved_items")}</div>
            )}
          </div>

          {isAdminWorkspace ? (
            <div className="space-y-6">
              <div className="surface-card">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                  <h2 className="section-heading">{t("home.admin_summary")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t("home.admin_summary_subtitle")}</p>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-700">{t("home.pending_found_item_submissions")}</span>
                    <span className="font-semibold text-slate-950">{pendingItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-700">{t("home.claims_awaiting_review")}</span>
                    <span className="font-semibold text-slate-950">{activeClaims.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-700">{t("home.open_lost_item_reports")}</span>
                    <span className="font-semibold text-slate-950">{openReports.length}</span>
                  </div>
                </div>
              </div>

              <div className="surface-card">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                  <h2 className="section-heading">{t("home.recent_admin_activity")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t("home.recent_admin_activity_subtitle")}</p>
                </div>
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {recentActivity.map((log) => (
                      <div key={log.id} className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-950">{log.action}</p>
                        <p className="mt-1 text-sm text-slate-600">{log.details}</p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{log.performed_by}</span>
                          <span>{log.created_date ? formatLocalizedDate(log.created_date, "MMM d, h:mm a") : t("home.no_date")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500">{t("home.no_activity_logged")}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="surface-card p-5">
              <h2 className="section-heading">{t("home.my_dashboard_title")}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {user ? t("home.my_dashboard_description") : t("home.project_documentation_description")}
              </p>
              <Button asChild variant="outline" className="mt-5">
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
