/**
 * FindBack AI - Main Navigation Bar
 * Keeps primary actions and account controls visible without decorative chrome.
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Moon,
  PlusCircle,
  FileSearch,
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
  } = useMode();
  const { user, isAdminUser, navigateToLogin, logout } = useAuth();
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
    if (!isAdminUser && isAdminMode) {
      setIsAdminMode(false);
    }
  }, [isAdminMode, isAdminUser, setIsAdminMode]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["navNotifications", user?.email],
    queryFn: () => appClient.entities.Notification.filter({ user_email: user.email, is_read: false }),
    enabled: !!user?.email,
  });

  const isAdmin = isAdminUser && isAdminMode;
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

  return (
    <header
      role="banner"
      className={`fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <nav className="page-shell" aria-label="Main navigation">
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/Home" className="flex items-center gap-3" aria-label="FindBack AI Home">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
              <FileSearch className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none text-foreground">FindBack AI</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Pleasant Valley HS</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isActive(to) ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(to)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAdminUser ? (
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
                  onClick={() => setIsAdminMode(true)}
                  aria-pressed={isAdmin}
                  className={`rounded px-3 py-1.5 text-xs font-semibold ${
                    isAdmin ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Admin
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Student View
              </div>
            )}

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
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdminUser && (
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
                    {isAdminUser ? "Admin Account" : "Student Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/UserDashboard" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isAdminUser && (
                    <DropdownMenuItem asChild>
                      <Link to="/AdminDashboard" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
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
            {isAdminUser ? (
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
                  onClick={() => setIsAdminMode(true)}
                  aria-pressed={isAdmin}
                  className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${
                    isAdmin ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Admin
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                Student view is active. Sign in with the demo admin account to access moderation tools.
              </div>
            )}

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

              {isAdminUser && (
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
            </div>

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
