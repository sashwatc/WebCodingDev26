/**
 * Lost Then Found - Home page
 * Recovery Archive landing: search-first scanner, minimal hero copy.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, FileText, PlusCircle, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { fadeUp, staggerChildVariants, staggerContainerProps } from "@/lib/motion";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoadingAuth } = useAuth();
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const isAdminWorkspace = !isLoadingAuth && isAdmin;

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

  return (
    <div className="bg-transparent">
      <div className="home-section py-12 sm:py-16">
        <motion.section
          aria-labelledby="home-title"
          className="mx-auto max-w-3xl"
          {...fadeUp}
        >
          <span className="page-kicker">{t("home.kicker")}</span>
          <h1 id="home-title" className="page-title mt-2 text-balance">
            {t("home.title")}
          </h1>
          <p className="page-subtitle mt-3 max-w-2xl">
            {t("home.subtitle")}
          </p>

          <form
            onSubmit={handleHomeSearch}
            className="recovery-scanner recovery-scanner-focus mt-8"
            role="search"
            aria-label={t("home.search_aria", "Search the found item inventory")}
          >
            <span className="recovery-scanner-beam" aria-hidden="true" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={homeSearchQuery}
                  onChange={(event) => setHomeSearchQuery(event.target.value)}
                  className="h-12 rounded-lg border-transparent bg-transparent pl-12 text-base shadow-none focus-visible:border-transparent focus-visible:ring-4 focus-visible:ring-ring/20"
                  placeholder={t("home.search_placeholder", "AirPods, bottle, library")}
                  aria-label={t("home.search_aria", "Search the found item inventory")}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 shrink-0 sm:px-6">
                {t("home.search_inventory", "Search Inventory")}
              </Button>
            </div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("home.search_help", "Use a few words, like the item type, brand, color, or where it was found.")}
          </p>
        </motion.section>

        <motion.section
          aria-labelledby="home-report-title"
          className="mt-14 sm:mt-16"
          {...staggerContainerProps}
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <div className="mb-5">
            <h2 id="home-report-title" className="section-heading">
              {t("home.next_step_title", "Need to file a report?")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.next_step_helper", "Use these only when the public list does not already have the item.")}
            </p>
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
              tone="lost"
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
              tone="found"
            />
          </div>
        </motion.section>

        <motion.section className="mt-14 sm:mt-16" {...fadeUp}>
          {isAdminWorkspace ? (
            <AdminWorkspacePanel />
          ) : (
            <div className="archive-card p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    {user ? <FileText className="h-5 w-5 text-foreground" /> : <Shield className="h-5 w-5 text-foreground" />}
                  </div>
                  <div className="space-y-1.5">
                    <span className="evidence-chip">{t("home.dashboard_kicker", "Your account")}</span>
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
                <Button asChild variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
                  <Link to={user ? "/UserDashboard" : "/Documentation"}>
                    {user ? t("navbar.my_dashboard") : t("footer.project_documentation")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function ReportCard({ to, icon: Icon, title, description, cta, tone = "found" }) {
  return (
    <motion.div variants={staggerChildVariants}>
      <Link
        to={to}
        className="archive-card group flex h-full flex-col gap-3 p-5"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone === "lost" ? "border-status-lost/25 bg-status-lost/10" : "border-status-found/25 bg-status-found/10"}`}>
            <Icon className={`h-4 w-4 ${tone === "lost" ? "text-status-lost" : "text-status-found"}`} />
          </div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors group-hover:underline">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

function AdminWorkspacePanel() {
  const { t } = useTranslation();
  return (
    <div className="archive-card border-primary/20 bg-primary p-6 text-primary-foreground sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <span className="evidence-chip border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              {t("home.admin_badge", "Admin mode")}
            </span>
            <h3 className="text-lg font-semibold tracking-tight">
              {t("home.moderator_active_title", "Moderator Workspace Active")}
            </h3>
            <p className="max-w-md text-sm leading-6 text-primary-foreground/80">
              {t("home.moderator_active_desc", "Review pending items, claims, and reports.")}
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" size="lg" className="w-full gap-2 sm:w-auto">
          <Link to="/AdminDashboard">
            {t("home.go_to_admin_panel", "Open Admin Dashboard")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
