import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Moon,
  PlusCircle,
  Search,
  Shield,
  Sun,
  User,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMode } from "@/lib/ModeContext";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { BRAND_NAME, SCHOOL_NAME } from "@/lib/constants";
import schoolMark from "@/assets/Spartan_Head.png";

export default function Navbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useMode();
  const {
    user,
    isAdmin,
    isStaff,
    isAuthenticated,
    isLoadingAuth,
    navigateToLogin,
    setIsSignInOpen,
    logout,
  } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const {
    data: allNotifications,
    error: notifError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => appClient.recoveryPulse.notifications(),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });
  const notifications   = allNotifications || [];
  const unreadCount     = notifications.filter((n) => !n.is_read).length;
  const recentNotifs    = notifications.slice(0, 5);
  const showBell        = isAuthenticated && !notifError;

  const handleNotifClick = async (notif) => {
    try { await appClient.recoveryPulse.markNotificationRead(notif.id); } catch { /* ignore */ }
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    if (notif.link) navigate(notif.link);
  };

  const isActive = (path) => location.pathname === path;
  const isStaffOrAdmin = !isLoadingAuth && (isAdmin || isStaff);
  const isStudentNav = !isLoadingAuth && isAuthenticated && !isAdmin && !isStaff;

  const handleSignIn = async () => {
    try {
      await navigateToLogin();
    } catch (error) {
      toast({ title: t("navbar.sign_in_unavailable"), description: error.message, variant: "destructive" });
    }
  };

  const handleGetStarted = () => {
    setIsSignInOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      toast({ title: t("navbar.sign_out_failed"), description: error.message || t("navbar.please_try_again"), variant: "destructive" });
    }
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active ? "text-foreground nav-active-dot" : "text-foreground/70 hover:text-foreground"
        }`}
      >
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
        <span>{children}</span>
      </Link>
    );
  };

  const MobileNavLink = ({ to, icon: Icon, children, accent }) => {
    const active = isActive(to);
    if (accent) {
      return (
        <Link to={to} className="mt-2 flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground">
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </Link>
      );
    }
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-muted text-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"
        }`}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </Link>
    );
  };

  return (
    <header
      role="banner"
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-archive-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/90"
    >
      <nav className="page-shell" aria-label={t("navbar.main_navigation")}>
        <div className="flex min-h-16 items-center gap-3 py-2">

          {/* Brand */}
          <Link to="/Home" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90" aria-label={t("navbar.brand_home", { brand: BRAND_NAME })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
              <img src={schoolMark} alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm font-semibold leading-none text-foreground">{BRAND_NAME}</p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground">{SCHOOL_NAME}</p>
            </div>
          </Link>

          {/* Desktop center nav */}
          <div className="hidden xl:flex flex-1 items-center justify-center gap-1">
            {isStudentNav && (
              <>
                <NavLink to="/Search" icon={Search}>Find Items</NavLink>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      <span>Report</span>
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/ReportLost" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Report Lost
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/ReportFound" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Report Found
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <NavLink to="/UserDashboard" icon={LayoutDashboard}>My Recovery</NavLink>
                <NavLink to="/FAQ">Support</NavLink>
              </>
            )}
            {isStaffOrAdmin && (
              <>
                <NavLink to="/AdminDashboard" icon={Shield}>Work Queue</NavLink>
                <NavLink to="/PickupStation" icon={LayoutDashboard}>Pickup Desk</NavLink>
                <NavLink to="/FAQ">Support</NavLink>
              </>
            )}
          </div>

          {/* Desktop right */}
          <div className="hidden xl:flex flex-1 items-center justify-end gap-2">
            {/* Display settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hidden sm:inline-flex" aria-label={t("navbar.display_settings", "Display settings")}>
                  <MonitorCog className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("navbar.appearance")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light" className="gap-2">
                    <Sun className="w-4 h-4" />
                    {t("navbar.light_mode")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark" className="gap-2">
                    <Moon className="w-4 h-4" />
                    {t("navbar.dark_mode")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("navbar.language")}
                </DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <LanguageSwitcher />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Authenticated: notifications bell */}
            {showBell && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative" aria-label={t("navbar.notifications")}>
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount <= 9 ? unreadCount : "9+"}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                  </div>
                  {recentNotifs.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
                  ) : (
                    <ul>
                      {recentNotifs.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                            onClick={() => handleNotifClick(n)}
                          >
                            {!n.is_read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />
                            )}
                            <div className={`min-w-0 flex-1 ${n.is_read ? "pl-5" : ""}`}>
                              <p className="truncate text-xs font-semibold text-foreground">{n.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {n.message?.length > 80 ? n.message.slice(0, 80) + "…" : n.message}
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {n.created_date
                                  ? formatDistanceToNow(new Date(n.created_date)) + " ago"
                                  : ""}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-border px-4 py-2">
                    <Link to="/UserDashboard" className="text-xs font-medium text-primary hover:underline">
                      View all notifications
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Authenticated: profile dropdown */}
            {isAuthenticated && user && (
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
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {user.full_name || user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/Settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    {t("common.sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Signed out: Sign In + Get Started */}
            {!isAuthenticated && !isLoadingAuth && (
              <>
                <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={handleSignIn} aria-haspopup="dialog">
                  {t("common.sign_in")}
                </Button>
                <Button size="sm" className="hidden sm:inline-flex" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger + Sheet drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="ml-auto xl:hidden"
                aria-label={t("navbar.open_menu")}
                aria-expanded={mobileOpen}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs overflow-y-auto p-0">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle>{t("navbar.menu", "Menu")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 p-4">
                <div className="grid gap-1">
                  {isStudentNav && (
                    <>
                      <MobileNavLink to="/Search" icon={Search}>Find Items</MobileNavLink>
                      <MobileNavLink to="/ReportLost" icon={AlertTriangle}>Report Lost</MobileNavLink>
                      <MobileNavLink to="/ReportFound" icon={PlusCircle} accent>Report Found</MobileNavLink>
                      <MobileNavLink to="/UserDashboard" icon={LayoutDashboard}>My Recovery</MobileNavLink>
                      <MobileNavLink to="/FAQ">Support</MobileNavLink>
                      <MobileNavLink to="/Settings" icon={User}>Settings</MobileNavLink>
                    </>
                  )}
                  {isStaffOrAdmin && (
                    <>
                      <MobileNavLink to="/AdminDashboard" icon={Shield}>Work Queue</MobileNavLink>
                      <MobileNavLink to="/PickupStation" icon={LayoutDashboard}>Pickup Desk</MobileNavLink>
                      <MobileNavLink to="/FAQ">Support</MobileNavLink>
                      <MobileNavLink to="/Settings" icon={User}>Settings</MobileNavLink>
                    </>
                  )}
                </div>

                <div className="rounded-md border border-border p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("navbar.display_settings")}</p>
                  <div className="mt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("navbar.language")}
                    </p>
                    <LanguageSwitcher />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${theme === "light" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      {t("navbar.light")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${theme === "dark" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      {t("navbar.dark")}
                    </button>
                  </div>
                </div>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
                  >
                    <User className="h-4 w-4" />
                    {t("common.sign_out")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
                  >
                    <User className="h-4 w-4" />
                    {t("common.sign_in")}
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
