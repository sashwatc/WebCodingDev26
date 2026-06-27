import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Bell, ChevronDown, FileSearch,
  LayoutDashboard, Menu, Moon, PlusCircle, Search,
  Settings, Shield, Sun, User, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { useMode } from "@/lib/ModeContext";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BRAND_NAME, SCHOOL_NAME } from "@/lib/constants";
import schoolMark from "@/assets/Spartan_Head.png";

export default function Navbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItemsOpen, setSearchItemsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const searchItemsTimer = useRef(null);
  const reportTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { theme, setTheme } = useMode();
  const { user, isAdmin, isStaff, isLoadingAuth, navigateToLogin, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* Hover helpers — 120 ms grace period lets the cursor move to the panel */
  const hoverOpen = (setter, timer) => () => {
    clearTimeout(timer.current);
    setter(true);
  };
  const hoverClose = (setter, timer) => () => {
    timer.current = setTimeout(() => setter(false), 120);
  };

  /* ⌘K / Ctrl+K focuses the search bar */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["navNotifications", user?.email],
    queryFn: async () => {
      const records = await appClient.recoveryPulse.notifications();
      return records.filter((n) => !n.is_read);
    },
    enabled: !!user?.email,
  });

  const showAdminNav = !isLoadingAuth && user && isAdmin;
  // Staff share the dashboard (scoped) with admins, so they get an entry point too.
  const showStaffPanel = !isLoadingAuth && user && (isAdmin || isStaff);
  const panelLabel = isAdmin ? t("navbar.admin_panel") : t("navbar.staff_panel", "Staff Panel");

  const isActive = (path) => location.pathname === path;
  const isSearchActive = isActive("/Search") || isActive("/LostItems");
  const isReportActive = isActive("/ReportLost") || isActive("/ReportFound");

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    /* type=all tells Search.jsx to show both found and lost results */
    navigate(q ? `/Search?q=${encodeURIComponent(q)}&type=all` : "/Search?type=all");
    setSearchQuery("");
    searchRef.current?.blur();
  };

  const handleSignIn = async () => {
    try { await navigateToLogin(); }
    catch (error) {
      toast({ title: t("navbar.sign_in_unavailable"), description: error.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    try { await logout(); }
    catch (error) {
      toast({ title: t("navbar.sign_out_failed"), description: error.message || t("navbar.please_try_again"), variant: "destructive" });
    }
  };

  /* Shared class for all desktop nav trigger/links */
  const navTriggerCls = (active) =>
    `relative flex items-center gap-1.5 px-3.5 py-2 text-[13.5px] font-medium transition-colors outline-none select-none cursor-pointer ${
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  const ActiveBar = () => (
    <span className="absolute bottom-[-1px] left-3 right-3 h-[2px] rounded-full bg-amber-500" aria-hidden="true" />
  );

  return (
    <header role="banner" className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/98 backdrop-blur-sm supports-[backdrop-filter]:bg-background/95">
      <nav className="page-shell" aria-label={t("navbar.main_navigation")}>
        <div className="flex h-[4.25rem] items-center gap-0">

          {/* ── Brand ──────────────────────────────────────────────────────────── */}
          <Link
            to="/Home"
            className="flex shrink-0 items-center gap-2.5 pr-5 mr-3 border-r border-border/60 transition-opacity hover:opacity-90"
            aria-label={t("navbar.brand_home", { brand: BRAND_NAME })}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(217,54%,16%)]">
              <img src={schoolMark} alt="" className="h-[18px] w-[18px] object-contain brightness-0 invert" />
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-bold leading-none tracking-tight text-foreground">{BRAND_NAME}</p>
              <p className="mt-[3px] text-[10.5px] font-medium leading-none text-muted-foreground">{SCHOOL_NAME}</p>
            </div>
          </Link>

          {/* ── Desktop nav links (left) ────────────────────────────────────────── */}
          <div className="hidden items-center xl:flex">

            {/* Home */}
            <Link
              to="/Home"
              aria-current={isActive("/Home") ? "page" : undefined}
              className={navTriggerCls(isActive("/Home"))}
            >
              {t("common.home")}
              {isActive("/Home") && <ActiveBar />}
            </Link>

            {/* Search Items dropdown — hover to open */}
            <DropdownMenu open={searchItemsOpen} onOpenChange={setSearchItemsOpen}>
              <DropdownMenuTrigger
                aria-current={isSearchActive ? "page" : undefined}
                className={navTriggerCls(isSearchActive)}
                onMouseEnter={hoverOpen(setSearchItemsOpen, searchItemsTimer)}
                onMouseLeave={hoverClose(setSearchItemsOpen, searchItemsTimer)}
              >
                {t("common.search_items", "Search Items")}
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                {isSearchActive && <ActiveBar />}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-44"
                onMouseEnter={hoverOpen(setSearchItemsOpen, searchItemsTimer)}
                onMouseLeave={hoverClose(setSearchItemsOpen, searchItemsTimer)}
              >
                <DropdownMenuItem asChild>
                  <Link to="/Search" className="flex items-center gap-2">
                    <FileSearch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Found Items
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/LostItems" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    Lost Items
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Report dropdown — hover to open */}
            <DropdownMenu open={reportOpen} onOpenChange={setReportOpen}>
              <DropdownMenuTrigger
                aria-current={isReportActive ? "page" : undefined}
                className={navTriggerCls(isReportActive)}
                onMouseEnter={hoverOpen(setReportOpen, reportTimer)}
                onMouseLeave={hoverClose(setReportOpen, reportTimer)}
              >
                {t("navbar.report", "Report")}
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                {isReportActive && <ActiveBar />}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48"
                onMouseEnter={hoverOpen(setReportOpen, reportTimer)}
                onMouseLeave={hoverClose(setReportOpen, reportTimer)}
              >
                <DropdownMenuItem asChild>
                  <Link to="/ReportLost" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    {t("common.report_lost_item")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ReportFound" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    {t("common.report_found_item")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          {/* ── Flex spacer pushes right side to the edge ─────────────────────── */}
          <div className="flex-1" />

          {/* ── Desktop right actions ──────────────────────────────────────────── */}
          <div className="hidden items-center gap-1.5 xl:flex">

            {/* Global search bar — covers both found + lost */}
            <form onSubmit={handleSearch} role="search">
              <div className="flex h-8 w-[150px] items-center gap-2 rounded-md border border-border bg-muted/60 px-2.5 transition-[width,border-color,background] duration-200 focus-within:w-[210px] focus-within:border-ring/50 focus-within:bg-background 2xl:w-[210px] 2xl:focus-within:w-[280px]">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search found & lost..."
                  aria-label="Search all items"
                  className="h-full flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden shrink-0 items-center rounded border border-border px-1 py-0.5 text-[10px] font-medium text-muted-foreground 2xl:flex">
                  ⌘K
                </kbd>
              </div>
            </form>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? t("navbar.light_mode") : t("navbar.dark_mode")}
            >
              {theme === "dark"
                ? <Sun className="h-[16px] w-[16px]" />
                : <Moon className="h-[16px] w-[16px]" />}
            </Button>

            {/* Admin / Staff Panel */}
            {showStaffPanel && (
              <Link to="/AdminDashboard">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[13px] px-3">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  {panelLabel}
                </Button>
              </Link>
            )}

            {/* Notification bell */}
            {user && (
              <Link to="/UserDashboard" aria-label={t("navbar.notifications")}>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                  <Bell className="h-[16px] w-[16px]" aria-hidden="true" />
                  {notifications.length > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
                      style={{ background: "hsl(var(--ring))" }}
                      aria-label={`${notifications.length} unread`}
                    >
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 pl-1.5 pr-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                    >
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-[5rem] truncate text-[13px] font-medium">{user.full_name?.split(" ")[0]}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="text-[10.5px] font-black uppercase tracking-[0.13em] text-muted-foreground">
                      {isAdmin ? t("navbar.admin_access_unlocked") : t("navbar.signed_in")}
                    </p>
                    <p className="mt-0.5 truncate text-[13.5px] font-semibold text-foreground">{user.full_name}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/UserDashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      {t("navbar.my_dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  {showStaffPanel && (
                    <DropdownMenuItem asChild>
                      <Link to="/AdminDashboard" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        {panelLabel}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/Settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    {t("common.sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isLoadingAuth ? (
              <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={handleSignIn}>
                {t("common.sign_in")}
              </Button>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-9 w-9 xl:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("navbar.close_menu") : t("navbar.open_menu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-border bg-background xl:hidden">
          <div className="page-shell space-y-1 py-3">

            {/* Mobile search */}
            <form onSubmit={handleSearch} role="search" className="pb-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search found & lost..."
                  aria-label="Search all items"
                  className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </form>

            {/* Home */}
            <Link
              to="/Home"
              aria-current={isActive("/Home") ? "page" : undefined}
              className={`flex items-center rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                isActive("/Home") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t("common.home")}
            </Link>

            {/* Search Items group */}
            <div className="px-3 pt-3 pb-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Search Items</p>
            </div>
            <Link to="/Search" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <FileSearch className="h-4 w-4" aria-hidden="true" /> Found Items
            </Link>
            <Link to="/LostItems" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" /> Lost Items
            </Link>

            {/* Report group */}
            <div className="px-3 pt-3 pb-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Report</p>
            </div>
            <Link to="/ReportLost" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" /> {t("common.report_lost_item")}
            </Link>
            <Link to="/ReportFound" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <PlusCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" /> {t("common.report_found_item")}
            </Link>

            {/* Theme row */}
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 mt-2">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Theme</span>
              <div className="flex gap-1">
                {[
                  { value: "light", icon: Sun, label: t("navbar.light") },
                  { value: "dark",  icon: Moon, label: t("navbar.dark") },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                      theme === value ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* User section */}
            {user ? (
              <div className="border-t border-border pt-2 mt-1 space-y-1">
                <Link to="/UserDashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  {t("navbar.my_dashboard")}
                </Link>
                {showStaffPanel && (
                  <Link to="/AdminDashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    {isAdmin ? t("navbar.admin_dashboard") : t("navbar.staff_panel", "Staff Panel")}
                  </Link>
                )}
                <Link to="/Settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-destructive hover:bg-destructive/8"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {t("common.sign_out")}
                </button>
              </div>
            ) : !isLoadingAuth ? (
              <div className="border-t border-border pt-2 mt-1">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-foreground hover:bg-muted"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {t("common.sign_in")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
