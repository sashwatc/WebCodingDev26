import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { Default as NeonButtonsDemo } from "@/components/ui/demo";
import {
  AlertTriangle,
  PlusCircle,
  Search,
  Shield,
} from "lucide-react";

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
      <div className="page-shell pb-12 pt-8 flex flex-col items-center justify-center min-h-[75vh]">
        <section className="surface-card p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden flex flex-col items-center text-center max-w-3xl w-full shadow-sm" aria-labelledby="home-title">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t("home.kicker")}</span>
            <h1 id="home-title" className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {t("home.title")}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
              {t("home.subtitle")}
            </p>
          </div>

          <div className="mt-8 w-full max-w-xl">
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
            <Link to="/Search?type=lost">
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

          {/* Neon Buttons Demo Section */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 w-full max-w-lg">
            <h3 className="text-sm font-bold text-slate-800 mb-3">{t("home.neon_showcase", "Interactive Neon Buttons")}</h3>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col items-center justify-center">
              <NeonButtonsDemo />
            </div>
          </div>

          {/* Clean Moderator / User Dashboard Shortcut at the bottom */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 w-full max-w-lg">
            {isAdminWorkspace ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary animate-pulse" />
                    {t("home.moderator_active_title", "Moderator Workspace Active")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("home.moderator_active_desc", "Review pending items, claims, and reports.")}
                  </p>
                </div>
                <Button asChild size="sm" className="bg-primary text-white hover:bg-primary/90 font-semibold rounded-lg w-full sm:w-auto flex-shrink-0">
                  <Link to="/AdminDashboard">
                    {t("home.go_to_admin_panel", "Open Admin Dashboard")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{t("home.my_dashboard_title")}</h3>
                  <p className="text-xs text-slate-500">
                    {user ? t("home.my_dashboard_description") : t("home.project_documentation_description")}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-lg w-full sm:w-auto flex-shrink-0">
                  <Link to={user ? "/UserDashboard" : "/Documentation"}>
                    {user ? t("navbar.my_dashboard") : t("footer.project_documentation")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
