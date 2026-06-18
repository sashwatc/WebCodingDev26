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
import { WebGLShader } from "@/components/ui/web-gl-shader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { formatLocalizedDate, translateCategory, translateLocation } from "@/lib/i18n-helpers";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
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
  const { isAdminMode, theme } = useMode();
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
  const photoItems = approvedItems
    .filter((item) => getItemPhoto(item))
    .sort((itemA, itemB) => {
      const photoA = getItemPhoto(itemA);
      const photoB = getItemPhoto(itemB);
      const isPlaceholderA = photoA.startsWith("data:image/svg");
      const isPlaceholderB = photoB.startsWith("data:image/svg");
      return Number(isPlaceholderA) - Number(isPlaceholderB);
    });
  const visualItems = [...photoItems, ...recentApprovedItems]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 4);
  const featuredItem = visualItems[0] || recentApprovedItems[0];
  const previewItems = visualItems.slice(1, 4);
  const recentActivity = auditLogs.slice(0, 4);
  const isAdminWorkspace = hasAdminAccess && isAdminMode;

  const publicStats = [
    {
      label: t("home.available_items"),
      value: approvedItems.length,
      helper: t("home.available_items_helper"),
      icon: Package,
    },
    {
      label: t("home.matched_reports"),
      value: matchedReports.length,
      helper: t("home.matched_reports_helper"),
      icon: Search,
    },
    {
      label: t("home.returned_items"),
      value: returnedItems.length,
      helper: t("home.returned_items_helper"),
      icon: CheckCircle2,
    },
  ];

  const pathCards = [
    {
      icon: Search,
      title: t("home.search_step_title"),
      description: t("home.search_step_description"),
      className: "bg-sky-50 text-sky-700",
    },
    {
      icon: AlertTriangle,
      title: t("home.cant_find_it"),
      description: t("home.lost_helper"),
      className: "bg-amber-50 text-amber-700",
      to: "/ReportLost",
      action: t("common.report_lost_item"),
    },
    {
      icon: PlusCircle,
      title: t("home.found_something"),
      description: t("home.found_helper"),
      className: "bg-emerald-50 text-emerald-700",
      to: "/ReportFound",
      action: t("common.report_found_item"),
    },
  ];

  const moreTools = [
    user
      ? {
          to: "/UserDashboard",
          title: t("home.my_dashboard_title"),
          description: t("home.my_dashboard_description"),
          icon: LayoutDashboard,
        }
      : {
          to: "/Documentation",
          title: t("home.project_documentation_title"),
          description: t("home.project_documentation_description"),
          icon: ClipboardList,
        },
    hasAdminAccess
      ? {
          to: "/AdminDashboard",
          title: t("home.admin_workspace_title"),
          description: isAdminWorkspace
            ? t("home.admin_workspace_active")
            : t("home.admin_workspace_inactive"),
          icon: Shield,
        }
      : null,
  ].filter(Boolean);

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

  return (
    <div className="relative isolate overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <WebGLShader variant="blue-flow" theme={theme} className={theme === "dark" ? "opacity-45" : "opacity-70"} />
      </div>

      <div className="page-shell relative z-10 pb-10 pt-7">
        <section className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="hero-panel overflow-hidden bg-white p-6 sm:p-8">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
                {t("home.start_here")}
              </span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {t("home.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {t("home.subtitle")}
              </p>
            </div>

            <form onSubmit={handleHomeSearch} className="mt-8 max-w-4xl rounded-lg border border-slate-200 bg-white/90 p-3 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
              <label className="sr-only" htmlFor="home-search">
                {t("home.search_inventory")}
              </label>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="home-search"
                    value={homeSearchQuery}
                    onChange={(event) => setHomeSearchQuery(event.target.value)}
                    className="h-14 rounded-md border-slate-300 bg-white pl-12 text-base"
                    placeholder={t("home.search_placeholder")}
                    aria-label={t("home.search_aria")}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 gap-2 bg-[hsl(222,65%,18%)] px-6 text-white hover:bg-[hsl(222,65%,15%)]"
                >
                  <Search className="h-4 w-4" />
                  {t("common.search_found_items")}
                </Button>
              </div>
            </form>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl">{t("home.search_help")}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/ReportLost"
                  className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-800 hover:bg-amber-100"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t("common.report_lost_item")}
                </Link>
                <Link
                  to="/ReportFound"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("common.report_found_item")}
                </Link>
              </div>
            </div>
          </div>

          <aside className="surface-card overflow-hidden bg-white" aria-label={t("home.preview_label")}>
            <div className="flex h-full min-h-[360px] flex-col justify-between gap-4 bg-[linear-gradient(160deg,#e0f2fe_0%,#ffffff_44%,#fef3c7_100%)] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {t("home.preview_label")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {t("home.preview_title")}
                </h2>
              </div>

              {featuredItem ? (
                <Link to={`/ItemDetails?id=${featuredItem.id}`} className="group block">
                  <div className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-[0_24px_44px_rgba(15,23,42,0.14)]">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {getItemPhoto(featuredItem) ? (
                        <img
                          src={getItemPhoto(featuredItem)}
                          alt={t("home.photo_alt", { item: featuredItem.title })}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{featuredItem.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                          {translateLocation(t, featuredItem.location_found) || t("common.unknown_location")}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-lg border border-white/80 bg-white p-6 text-sm text-slate-600 shadow-[0_24px_44px_rgba(15,23,42,0.14)]">
                  {t("home.no_approved_items")}
                </div>
              )}

              {previewItems.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previewItems.map((item) => (
                    <Link
                      key={item.id}
                      to={`/ItemDetails?id=${item.id}`}
                      className="group overflow-hidden rounded-md border border-white/80 bg-white/85 shadow-[0_12px_26px_rgba(15,23,42,0.1)]"
                      aria-label={item.title}
                    >
                      <div className="aspect-square bg-slate-100">
                        {getItemPhoto(item) ? (
                          <img
                            src={getItemPhoto(item)}
                            alt={t("home.photo_alt", { item: item.title })}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="page-kicker">{t("home.kicker")}</span>
              <h2 className="section-heading mt-2">{t("home.next_step_title")}</h2>
            </div>
            <Link to="/Search" className="text-sm font-semibold text-slate-700 hover:text-slate-950">
              {t("home.open_search")} <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pathCards.map((card) => {
              const CardContent = (
                <div className="surface-card h-full bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(15,23,42,0.08)]">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md ${card.className}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                  {card.action && (
                    <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                      {card.action}
                      <ArrowRight className="h-4 w-4" />
                    </p>
                  )}
                </div>
              );

              return card.to ? (
                <Link key={card.title} to={card.to} className="block">
                  {CardContent}
                </Link>
              ) : (
                <div key={card.title}>{CardContent}</div>
              );
            })}
          </div>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          {publicStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-primary">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{stat.value}</p>
                  <p className="text-sm font-medium text-slate-800">{stat.label}</p>
                </div>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="surface-card bg-white">
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
              <div>
                <h2 className="section-heading">{t("home.recently_approved_items")}</h2>
                <p className="mt-1 text-sm text-slate-600">{t("home.recently_approved_subtitle")}</p>
              </div>
              <Link to="/Search">
                <Button variant="outline" size="sm">{t("home.open_search")}</Button>
              </Link>
            </div>

            {recentApprovedItems.length > 0 ? (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {recentApprovedItems.slice(0, 4).map((item) => (
                  <Link key={item.id} to={`/ItemDetails?id=${item.id}`} className="group rounded-lg border border-slate-200 bg-slate-50/80 p-3 hover:bg-white">
                    <div className="flex gap-3">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {getItemPhoto(item) ? (
                          <img
                            src={getItemPhoto(item)}
                            alt={t("home.photo_alt", { item: item.title })}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 group-hover:underline">{item.title}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                          {translateLocation(t, item.location_found) || t("common.unknown_location")}
                        </p>
                        {item.category && (
                          <Badge variant="outline" className="mt-3">
                            {translateCategory(t, item.category)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500">{t("home.no_approved_items")}</div>
            )}
          </div>

          <div className="space-y-6">
            <div className="surface-card bg-white">
              <div className="border-b px-5 py-4">
                <h2 className="section-heading">{t("home.quick_actions")}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t("home.quick_actions_subtitle")}
                </p>
              </div>
              <div className="divide-y">
                {moreTools.map((tool) => (
                  <Link key={tool.title} to={tool.to} className="block px-5 py-4 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-primary">
                        <tool.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{tool.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{tool.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {isAdminWorkspace && (
              <>
                <div className="surface-card bg-white">
                  <div className="border-b px-5 py-4">
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

                <div className="surface-card bg-white">
                  <div className="border-b px-5 py-4">
                    <h2 className="section-heading">{t("home.recent_admin_activity")}</h2>
                    <p className="mt-1 text-sm text-slate-600">{t("home.recent_admin_activity_subtitle")}</p>
                  </div>
                  {recentActivity.length > 0 ? (
                    <div className="divide-y">
                      {recentActivity.map((log) => (
                        <div key={log.id} className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">{log.action}</p>
                          <p className="mt-1 text-sm text-slate-600">{log.details}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                            {log.performed_by} • {log.created_date ? formatLocalizedDate(log.created_date, "MMM d, h:mm a") : t("home.no_date")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-sm text-slate-500">{t("home.no_activity_logged")}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
