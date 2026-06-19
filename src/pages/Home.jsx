import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { FloatingPaths } from "@/components/ui/background-paths";
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
    <div className="relative min-h-[75vh] w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Paths */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 page-shell pb-12 pt-8 flex flex-col items-center justify-center w-full">
        <section className="surface-card p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden flex flex-col items-center text-center max-w-3xl w-full shadow-sm backdrop-blur-md bg-white/80 dark:bg-slate-900/80" aria-labelledby="home-title">
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
              <Button type="submit" className="px-6 shadow-md">
                {t("home.search_inventory", "Search Inventory")}
              </Button>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/Search?type=lost">
              <Button variant="default" className="flex items-center gap-2 border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-100 hover:bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                {t("home.cant_find_it", "I lost something")}
              </Button>
            </Link>
            <Link to="/ReportFound">
              <Button variant="default" className="flex items-center gap-2 border-sky-500/20 bg-sky-500/5 text-sky-800 dark:text-sky-100 hover:bg-sky-500/10">
                <PlusCircle className="w-4 h-4 text-sky-700" />
                {t("home.found_something", "I found something")}
              </Button>
            </Link>
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
                <Button asChild variant="default" size="sm" className="w-full sm:w-auto flex-shrink-0">
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
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0">
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
