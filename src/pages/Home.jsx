/**
 * Lost Then Found - Home page
 * Calm, official, search-first landing. No decorative animation.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight, PlusCircle, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasAdminAccess } = useAuth();
  const { isAdminMode } = useMode();
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const isAdminWorkspace = hasAdminAccess && isAdminMode;

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

  return (
    <div className="bg-background">
      <div className="home-section py-16 sm:py-24">
        {/* Hero / Search block */}
        <section aria-labelledby="home-title" className="mx-auto max-w-3xl text-center">
          <span className="page-kicker">{t("home.kicker")}</span>
          <h1 id="home-title" className="page-title mt-2">
            {t("home.title")}
          </h1>
          <p className="page-subtitle mx-auto mt-3">
            {t("home.subtitle")}
          </p>

          <form
            onSubmit={handleHomeSearch}
            className="surface-card mt-8 flex flex-col items-stretch gap-2 p-2 sm:flex-row sm:items-center sm:gap-2"
            role="search"
            aria-label={t("home.search_aria", "Search the found item inventory")}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={homeSearchQuery}
                onChange={(event) => setHomeSearchQuery(event.target.value)}
                className="h-12 rounded-lg border-transparent bg-transparent pl-12 text-base shadow-none focus-visible:ring-0"
                placeholder={t("home.search_placeholder", "AirPods, bottle, library")}
                aria-label={t("home.search_aria", "Search the found item inventory")}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 sm:px-6">
              {t("home.search_inventory", "Search Inventory")}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("home.search_help", "Use a few words, like the item type, brand, color, or where it was found.")}
          </p>
        </section>

        {/* Reporting cards */}
        <section aria-labelledby="home-report-title" className="mt-16 sm:mt-20">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="home-report-title" className="section-heading">
                {t("home.next_step_title", "Need to file a report?")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("home.next_step_helper", "Use these only when the public list does not already have the item.")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ReportCard
              to="/ReportLost"
              icon={AlertTriangle}
              title={t("home.cant_find_it", "I lost something")}
              description={t(
                "home.lost_description",
                "Submit a lost-item report, keep the case active, and review suggested matches as new items come in."
              )}
              cta={t("home.submit_report", "Submit report")}
            />
            <ReportCard
              to="/ReportFound"
              icon={PlusCircle}
              title={t("home.found_something", "I found something")}
              description={t(
                "home.found_description",
                "Create a moderated item record with photos and details so the owner can recognize it quickly."
              )}
              cta={t("home.submit_report", "Submit report")}
            />
          </div>
        </section>

        {/* Dashboard / admin card */}
        <section className="mt-16 sm:mt-24">
          {isAdminWorkspace ? (
            <AdminWorkspacePanel />
          ) : (
            <div className="surface-card relative overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.04]" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-primary/[0.03]" aria-hidden="true" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-muted">
                    <Shield className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("home.dashboard_kicker", "Your account")}
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {t("home.my_dashboard_title", "My dashboard")}
                    </h3>
                    <p className="max-w-md text-sm leading-6 text-muted-foreground">
                      {user
                        ? t("home.my_dashboard_description", "View your submissions, claims, and notifications.")
                        : t("home.project_documentation_description", "See how Lost Then Found works.")}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="default"
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                >
                  <Link to={user ? "/UserDashboard" : "/Documentation"}>
                    {user ? t("navbar.my_dashboard") : t("footer.project_documentation")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ReportCard({ to, icon: Icon, title, description, cta }) {
  return (
    <Link
      to={to}
      className="surface-card group flex flex-col gap-3 p-5 transition-colors hover:border-slate-300"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors group-hover:text-foreground">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function AdminWorkspacePanel() {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-6 text-slate-50 sm:p-8 dark:border-slate-800">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-sky-500/10 blur-2xl" aria-hidden="true" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/80">
            <Shield className="h-5 w-5 text-slate-50" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t("home.admin_badge", "Admin mode")}
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-50">
              {t("home.moderator_active_title", "Moderator Workspace Active")}
            </h3>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              {t("home.moderator_active_desc", "Review pending items, claims, and reports.")}
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="default"
          size="lg"
          className="w-full gap-2 bg-slate-50 text-slate-950 hover:bg-white sm:w-auto"
        >
          <Link to="/AdminDashboard">
            {t("home.go_to_admin_panel", "Open Admin Dashboard")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
