/**
 * FindBack AI - Home Page
 * Leads with search, then surfaces the two main reporting actions.
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
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  Shield,
} from "lucide-react";

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

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

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

  return (
    <div className="relative isolate overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <WebGLShader variant="blue-flow" theme={theme} className={theme === "dark" ? "opacity-60" : "opacity-100"} />
      </div>

      <div className="page-shell relative z-10 pb-10 pt-7">
        <section className="page-header mb-5">
          <span className="page-kicker">{t("home.kicker")}</span>
          <h1 className="page-title">{t("home.title")}</h1>
          <p className="page-subtitle">{t("home.subtitle")}</p>
        </section>

        <section className="mb-8 space-y-4">
          <div className="hero-panel bg-white p-5 sm:p-6">
            <form onSubmit={handleHomeSearch} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t("home.search_inventory")}
              </label>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={homeSearchQuery}
                    onChange={(event) => setHomeSearchQuery(event.target.value)}
                    className="h-14 rounded-xl border-slate-300 bg-white pl-12 text-base"
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

              <p className="text-sm text-slate-600">
                {t("home.search_help")}
              </p>
            </form>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Link to="/ReportLost" className="block">
              <div className="surface-card bg-white p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)] min-h-[220px]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("home.lost_item")}</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{t("home.cant_find_it")}</h2>
                      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                        {t("home.lost_description")}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-500">{t("home.lost_helper")}</span>
                    <Button variant="outline" size="lg" className="shrink-0">
                      {t("common.report_lost_item")}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/ReportFound" className="block">
              <div className="surface-card bg-white p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)] min-h-[220px]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("home.found_item")}</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{t("home.found_something")}</h2>
                      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                        {t("home.found_description")}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-500">{t("home.found_helper")}</span>
                    <Button variant="outline" size="lg" className="shrink-0">
                      {t("common.report_found_item")}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
        {publicStats.map((stat) => (
          <div key={stat.label} className="stat-panel">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-primary">
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{stat.label}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="surface-card">
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
            <div className="divide-y">
              {recentApprovedItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/ItemDetails?id=${item.id}`} className="font-semibold text-slate-900 hover:underline">
                        {item.title}
                      </Link>
                      <StatusBadge status={item.status} />
                      {item.category && <Badge variant="outline">{translateCategory(t, item.category)}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.ai_description || item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {translateLocation(t, item.location_found) || t("common.unknown_location")} • {item.date_found ? formatLocalizedDate(item.date_found, "MMM d, yyyy") : t("common.date_unavailable")}
                    </p>
                  </div>
                  <Link to={`/ItemDetails?id=${item.id}`}>
                    <Button variant="outline" size="sm">{t("common.view")}</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-slate-500">{t("home.no_approved_items")}</div>
          )}
        </div>

        <div className="space-y-6">
              <div className="surface-card">
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
              <div className="surface-card">
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

              <div className="surface-card">
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
