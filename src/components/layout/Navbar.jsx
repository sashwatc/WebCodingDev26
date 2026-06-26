import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Bell, ChevronDown, LayoutDashboard, Menu,
  Moon, PlusCircle, Settings, Shield, Sun, User, X,
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
  const location = useLocation();
  const { theme, setTheme } = useMode();
  const { user, isAdmin, isLoadingAuth, navigateToLogin, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["navNotifications", user?.email],
    queryFn: async () => {
      const records = await appClient.recoveryPulse.notifications();
      return records.filter((n) => !n.is_read);
    },
    enabled: !!user?.email,
  });

  const isActive = (path) => location.pathname === path;
  const showAdminNav = !isLoadingAuth && user && isAdmin;

  const navLinks = [
    { to: "/Home",       label: t("common.home") },
    { to: "/Search",     label: t("common.search_items") },
    { to: "/LostItems",  label: t("common.lost_items", "Lost Items") },
    { to: "/ReportLost", label: t("common.report_lost_item") },
  ];

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

  const amberStyle = { background: "hsl(var(--ring))", color: "#fff" };

  return (
    <header role="banner" className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/98 backdrop-blur-sm supports-[backdrop-filter]:bg-background/95">
      <nav className="page-shell" aria-label={t("navbar.main_navigation")}>
        <div className="flex h-[4.25rem] items-center">

          {/* Brand */}
          <Link
            to="/Home"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label={t("navbar.brand_home", { brand: BRAND_NAME })}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "hsl(var(--primary))" }}
            >
              <img src={schoolMark} alt="" className="h-[18px] w-[18px] object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-bold leading-none tracking-tight text-foreground">{BRAND_NAME}</p>
              <p className="mt-[3px] text-[10.5px] font-medium leading-none text-muted-foreground">{SCHOOL_NAME}</p>
            </div>
          </Link>

          {/* Desktop nav — text only, no icons */}
          <div className="ml-5 hidden flex-1 items-center xl:flex" role="list">
            {navLinks.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  role="listitem"
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3.5 py-2 text-[13.5px] transition-colors ${
                    active
                      ? "font-semibold text-foreground nav-active-dot"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop right actions */}
          <div className="ml-auto hidden items-center gap-1.5 xl:flex">
            {/* Amber Log a Find CTA */}
            <Link to="/ReportFound">
              <Button
                size="sm"
                className="gap-1.5 text-[13px] font-semibold shadow-none"
                style={amberStyle}
              >
                <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t("common.report_found_item")}
              </Button>
            </Link>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? t("navbar.light_mode") : t("navbar.dark_mode")}
            >
              {theme === "dark"
                ? <Sun className="h-[17px] w-[17px]" />
                : <Moon className="h-[17px] w-[17px]" />}
            </Button>

            {/* Admin shortcut */}
            {showAdminNav && (
              <Link to="/AdminDashboard">
                <Button size="sm" variant="outline" className="gap-1.5 text-[13px]">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("navbar.admin_panel")}
                </Button>
              </Link>
            )}

            {/* Notification bell */}
            {user && (
              <Link to="/UserDashboard" aria-label={t("navbar.notifications")}>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-[17px] w-[17px]" aria-hidden="true" />
                  {notifications.length > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-9 pl-2 pr-2.5">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                    >
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-[6rem] truncate text-[13px] font-medium">{user.full_name?.split(" ")[0]}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
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
                  {showAdminNav && (
                    <DropdownMenuItem asChild>
                      <Link to="/AdminDashboard" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        {t("navbar.admin_panel")}
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
            )}

            {!user && !isLoadingAuth && (
              <Button size="sm" variant="outline" className="text-[13px]" onClick={handleSignIn}>
                {t("common.sign_in")}
              </Button>
            )}
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-background xl:hidden">
          <div className="page-shell space-y-1 py-3">

            {navLinks.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                    active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <div className="pt-1 pb-0.5">
              <Link
                to="/ReportFound"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-semibold text-white"
                style={amberStyle}
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                {t("common.report_found_item")}
              </Link>
            </div>

            {/* Theme row */}
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
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

            {user ? (
              <div className="border-t border-border pt-1 space-y-1">
                <Link
                  to="/UserDashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  {t("navbar.my_dashboard")}
                </Link>
                {showAdminNav && (
                  <Link
                    to="/AdminDashboard"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    {t("navbar.admin_dashboard")}
                  </Link>
                )}
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
              <div className="border-t border-border pt-1">
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
