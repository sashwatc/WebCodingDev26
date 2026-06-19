/**
 * FindBack AI - Home Page
 * Leads with search, then surfaces the two main reporting actions.
 */

import React, { useState, useMemo } from "react";
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
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasAdminAccess } = useAuth();
  const { isAdminMode, theme } = useMode();
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [activeMode, setActiveMode] = useState("none"); // "none" | "lost" | "found"
  const [assistantSearchQuery, setAssistantSearchQuery] = useState("");

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

  const assistantLostMatches = useMemo(() => {
    if (!assistantSearchQuery.trim() || activeMode !== "lost") return [];
    const query = assistantSearchQuery.toLowerCase();
    return approvedItems.filter(item => {
      const text = [item.title, item.description, item.ai_description, item.color, item.category].filter(Boolean).join(" ").toLowerCase();
      return text.includes(query);
    }).slice(0, 3);
  }, [assistantSearchQuery, approvedItems, activeMode]);

  const assistantFoundMatches = useMemo(() => {
    if (!assistantSearchQuery.trim() || activeMode !== "found") return [];
    const query = assistantSearchQuery.toLowerCase();
    return openReports.filter(report => {
      const text = [report.item_type, report.description, report.color, report.category, report.brand].filter(Boolean).join(" ").toLowerCase();
      return text.includes(query);
    }).slice(0, 3);
  }, [assistantSearchQuery, openReports, activeMode]);

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
          <div className="hero-panel bg-white p-6 sm:p-8">
            {activeMode === "none" && (
              <div className="space-y-6">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {t("home.how_can_we_help", "How can we help you today?")}
                  </h2>
                  <p className="text-slate-500">
                    {t("home.choose_option_to_start", "Choose an option below to guide you through the process.")}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <button
                    onClick={() => {
                      setActiveMode("lost");
                      setAssistantSearchQuery("");
                    }}
                    className="flex flex-col text-left p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/85 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-4 transition-transform group-hover:scale-110">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {t("home.i_lost_something_title", "I Lost Something")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      {t("home.i_lost_something_desc", "Tell us what went missing to find it in our current inventory or file a report.")}
                    </p>
                    <span className="mt-auto text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 flex items-center gap-1">
                      {t("home.find_or_report", "Find or Report")} →
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMode("found");
                      setAssistantSearchQuery("");
                    }}
                    className="flex flex-col text-left p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/85 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700 mb-4 transition-transform group-hover:scale-110">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {t("home.i_found_something_title", "I Found Something")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      {t("home.i_found_something_desc", "Check if someone reported this item lost, or register it as found.")}
                    </p>
                    <span className="mt-auto text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 flex items-center gap-1">
                      {t("home.check_and_register", "Check & Register")} →
                    </span>
                  </button>
                </div>

                <div className="border-t pt-6">
                  <form onSubmit={handleHomeSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={homeSearchQuery}
                        onChange={(event) => setHomeSearchQuery(event.target.value)}
                        className="h-12 rounded-xl border-slate-300 bg-white pl-12 text-sm"
                        placeholder={t("home.quick_search_placeholder", "Or, search the found items inventory directly...")}
                      />
                    </div>
                    <Button type="submit" size="lg" className="h-12 bg-primary px-6 text-white hover:bg-primary/90">
                      {t("common.search_found_items")}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {activeMode === "lost" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <button
                    onClick={() => setActiveMode("none")}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                  </button>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                    {t("home.mode_lost_item", "Lost Item Mode")}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-600" />
                    {t("home.lost_assistant_title", "Let's find your lost item")}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t("home.lost_assistant_subtitle", "Type a description of your item (e.g. \"black water bottle\", \"red jacket\") to search instantly.")}
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={assistantSearchQuery}
                    onChange={(event) => setAssistantSearchQuery(event.target.value)}
                    className="h-14 rounded-xl border-slate-300 bg-white pl-12 text-base shadow-sm focus-visible:ring-amber-500"
                    placeholder={t("home.lost_assistant_placeholder", "Start typing your item description...")}
                    autoFocus
                  />
                </div>

                {assistantSearchQuery.trim() && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {assistantLostMatches.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                          {t("home.we_found_matches", "We found matching items in our inventory! Do any of these look like yours?")}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {assistantLostMatches.map(item => (
                            <Link
                              key={item.id}
                              to={`/ItemDetails?id=${item.id}`}
                              className="block p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-400 transition-all hover:shadow-md"
                            >
                              <p className="font-semibold text-sm text-slate-900 truncate">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-1 truncate">{translateLocation(t, item.location_found)}</p>
                              <p className="text-[10px] text-slate-400 mt-2">
                                {item.date_found ? formatLocalizedDate(item.date_found, "MMM d") : ""}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600">
                        {t("home.no_matches_found_yet", "No exact matches in the found inventory yet. Type more to search.")}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-900">{t("home.still_cant_find", "Still can't find it?")}</p>
                        <p className="text-xs text-slate-500">{t("home.still_cant_find_helper", "File a lost item report and we will notify you when a match is found.")}</p>
                      </div>
                      <Link to={`/ReportLost?description=${encodeURIComponent(assistantSearchQuery)}`} className="w-full sm:w-auto">
                        <Button className="w-full bg-amber-600 text-white hover:bg-amber-700">
                          {t("common.report_lost_item")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeMode === "found" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <button
                    onClick={() => setActiveMode("none")}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                  </button>
                  <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200">
                    {t("home.mode_found_item", "Found Item Mode")}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                    <Search className="w-5 h-5 text-sky-600" />
                    {t("home.found_assistant_title", "Report a found item")}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t("home.found_assistant_subtitle", "Search active lost reports first to see if a student is already looking for this item.")}
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={assistantSearchQuery}
                    onChange={(event) => setAssistantSearchQuery(event.target.value)}
                    className="h-14 rounded-xl border-slate-300 bg-white pl-12 text-base shadow-sm focus-visible:ring-sky-500"
                    placeholder={t("home.found_assistant_placeholder", "Type item description to check lost reports...")}
                    autoFocus
                  />
                </div>

                {assistantSearchQuery.trim() && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {assistantFoundMatches.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                          {t("home.reported_lost_matches", "We found matching active lost reports! Does it match any of these?")}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {assistantFoundMatches.map(report => (
                            <Link
                              key={report.id}
                              to={`/ItemDetails?type=lost&id=${report.id}`}
                              className="block p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-400 transition-all hover:shadow-md"
                            >
                              <p className="font-semibold text-sm text-slate-900 truncate">{report.title}</p>
                              <p className="text-xs text-slate-500 mt-1 truncate">{translateLocation(t, report.location_found)}</p>
                              <p className="text-[10px] text-slate-400 mt-2">
                                {report.date_found ? formatLocalizedDate(report.date_found, "MMM d") : ""}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600">
                        {t("home.no_matching_lost_reports", "No active lost reports match your description yet.")}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-900">{t("home.ready_to_register", "Ready to submit the found item?")}</p>
                        <p className="text-xs text-slate-500">{t("home.ready_to_register_helper", "Register the item so the owner can search for it in the system.")}</p>
                      </div>
                      <Link to={`/ReportFound?title=${encodeURIComponent(assistantSearchQuery)}`} className="w-full sm:w-auto">
                        <Button className="w-full bg-sky-600 text-white hover:bg-sky-700">
                          {t("common.report_found_item")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
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
