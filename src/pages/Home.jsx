/**
 * Lost Then Found - Home Page
 * Prioritizes the first user decision: search first, then report only if needed.
 */

import React, { useState, useMemo } from "react";
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
  ArrowLeft,
  ArrowRight,
  Package,
  PlusCircle,
  Search,
  Sparkles,
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
