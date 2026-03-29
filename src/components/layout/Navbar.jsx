/**
 * Lost Then Found - Main Navigation Bar
 * Keeps primary actions and account controls visible without decorative chrome.
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  Contrast,
  Home,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Moon,
  PlusCircle,
  Search,
  Shield,
  Sun,
  Type,
  User,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { useMode } from "@/lib/ModeContext";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  BRAND_NAME,
  SCHOOL_NAME,
} from "@/lib/constants";
import schoolMark from "@/assets/pvhs-mark.svg";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const {
    isAdminMode,
    setIsAdminMode,
    theme,
    setTheme,
    readingMode,
    setReadingMode,
    contrastMode,
    setContrastMode,
  } = useMode();
  const {
    user,
    hasAdminAccess,
    navigateToLogin,
    openAdminAccess,
    revokeAdminAccess,
    logout,
  } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!hasAdminAccess && isAdminMode) {
      setIsAdminMode(false);
    }
  }, [hasAdminAccess, isAdminMode, setIsAdminMode]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["navNotifications", user?.email],
    queryFn: () => appClient.entities.Notification.filter({ user_email: user.email, is_read: false }),
    enabled: !!user?.email,
  });

  const isAdmin = hasAdminAccess && isAdminMode;
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/Home", label: "Home", icon: Home },
    { to: "/Search", label: "Search Items", icon: Search },
    { to: "/ReportLost", label: "Report Lost", icon: AlertTriangle },
  ];

  const handleSignIn = async () => {
    try {
      await navigateToLogin();
    } catch (error) {
      toast({
        title: "Sign in unavailable",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdminView = async () => {
    if (isAdmin) {
      return;
    }

    if (!user) {
      await handleSignIn();
      return;
    }

    if (hasAdminAccess) {
      setIsAdminMode(true);
      return;
    }

    await openAdminAccess();
  };

  const handleLockAdminAccess = () => {
    setIsAdminMode(false);
    revokeAdminAccess();
    toast({
      title: "Admin access locked",
      description: "Moderation tools were locked for this browser session.",
    });
  };

  return (
    <header
      role="banner"
      className={`fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur ${
        scrolled ? "shadow-[0_18px_36px_rgba(15,23,42,0.08)]" : ""
      }`}
    >
      <nav className="page-shell" aria-label="Main navigation">
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/Home" className="flex items-center gap-3" aria-label={`${BRAND_NAME} Home`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#eef2ff)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_28px_rgba(2,8,23,0.28)]">
              <img src={schoolMark} alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none text-foreground [text-shadow:0_2px_8px_rgba(15,23,42,0.06)]">{BRAND_NAME}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{SCHOOL_NAME}</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isActive(to) ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive(to)
                    ? "bg-[linear-gradient(180deg,#ffffff,#f8fafc)] text-foreground shadow-[0_10px_18px_rgba(15,23,42,0.05)] dark:bg-none dark:bg-slate-800 dark:text-white dark:shadow-[0_12px_24px_rgba(2,8,23,0.22)]"
                    : "text-muted-foreground hover:bg-white/80 hover:text-foreground hover:shadow-[0_10px_18px_rgba(15,23,42,0.04)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:shadow-[0_12px_24px_rgba(2,8,23,0.18)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center rounded-md border border-border bg-muted/70 p-1">
                <button
                  onClick={() => setIsAdminMode(false)}
                  aria-pressed={!isAdmin}
                  className={`rounded px-3 py-1.5 text-xs font-semibold ${
                    !isAdmin ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={handleAdminView}
                  aria-pressed={isAdmin}
                  className={`rounded px-3 py-1.5 text-xs font-semibold ${
                    isAdmin ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Admin
                </button>
            </div>

            <Link to="/ReportFound" className="hidden md:block">
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Report Found Item
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hidden sm:inline-flex">
                  <MonitorCog className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Appearance
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light" className="gap-2">
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark" className="gap-2">
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Reading
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={readingMode} onValueChange={setReadingMode}>
                  <DropdownMenuRadioItem value="default" className="gap-2">
                    <Type className="w-4 h-4" />
                    Standard Reading
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dyslexic" className="gap-2">
                    <Type className="w-4 h-4" />
                    Dyslexic Reading
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Contrast
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={contrastMode} onValueChange={setContrastMode}>
                  <DropdownMenuRadioItem value="default" className="gap-2">
                    <Contrast className="w-4 h-4" />
                    Standard Contrast
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="high" className="gap-2">
                    <Contrast className="w-4 h-4" />
                    High Contrast
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {user && hasAdminAccess && (
              <Link to="/AdminDashboard" className="hidden xl:block">
                <Button size="sm" variant="outline" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            )}

            {user && (
              <Link to="/UserDashboard" aria-label="Notifications">
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden gap-2 sm:flex">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-24 truncate text-sm">{user.full_name?.split(" ")[0]}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    {hasAdminAccess ? "Admin Access Unlocked" : "Signed In"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/UserDashboard" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {hasAdminAccess && (
                    <DropdownMenuItem asChild>
                      <Link to="/AdminDashboard" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasAdminAccess && (
                    <DropdownMenuItem onClick={handleLockAdminAccess} className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Lock Admin Access
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!user && (
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t bg-background lg:hidden">
          <div className="page-shell space-y-3 py-4">
            <div className="flex items-center rounded-md border border-border bg-muted p-1">
                <button
                  onClick={() => setIsAdminMode(false)}
                  aria-pressed={!isAdmin}
                  className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${
                    !isAdmin ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={handleAdminView}
                  aria-pressed={isAdmin}
                  className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${
                    isAdmin ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Admin
                </button>
            </div>

            <div className="grid gap-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  aria-current={isActive(to) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium ${
                    isActive(to)
                      ? "border-border bg-muted text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              <Link
                to="/ReportFound"
                className="flex items-center gap-3 rounded-md border border-border bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                Report Found Item
              </Link>

              {user && (
                <Link
                  to="/UserDashboard"
                  className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  My Dashboard
                </Link>
              )}

              {user && hasAdminAccess && (
                <Link
                  to="/AdminDashboard"
                  className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Display Settings</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                    theme === "light" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                    theme === "dark" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </button>
              </div>
              <button
                type="button"
                onClick={() => setReadingMode(readingMode === "dyslexic" ? "default" : "dyslexic")}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                  readingMode === "dyslexic" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                {readingMode === "dyslexic" ? "Dyslexic Reading On" : "Dyslexic Reading Off"}
              </button>
              <button
                type="button"
                onClick={() => setContrastMode(contrastMode === "high" ? "default" : "high")}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                  contrastMode === "high" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Contrast className="h-3.5 w-3.5" />
                {contrastMode === "high" ? "High Contrast On" : "High Contrast Off"}
              </button>
            </div>

            {user && hasAdminAccess && (
              <button
                type="button"
                onClick={handleLockAdminAccess}
                className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <Shield className="h-4 w-4" />
                Lock Admin Access
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <User className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <User className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
