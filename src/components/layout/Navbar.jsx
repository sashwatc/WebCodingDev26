/**
 * FindBack AI - Main Navigation Bar
 * Responsive top navigation with logo, links, mobile menu, and user actions.
 * Uses framer-motion for smooth mobile menu transitions.
 */

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Menu, X, Bell, User, Shield, Home,
  PlusCircle, FileSearch, AlertTriangle, LayoutDashboard,
  Moon, Sun, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useMode } from "@/lib/ModeContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isAdminMode, setIsAdminMode } = useMode();

  // Track scroll position for navbar background effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Fetch unread notification count
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["navNotifications"],
    queryFn: () => base44.entities.Notification.filter({ is_read: false }),
    enabled: !!user,
  });

  const isAdmin = isAdminMode;
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/Home", label: "Home", icon: Home },
    { to: "/Search", label: "Search Items", icon: Search },
    { to: "/ReportFound", label: "Report Found", icon: PlusCircle },
    { to: "/ReportLost", label: "Report Lost", icon: AlertTriangle },
  ];

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
      ? "bg-white shadow-md border-b-2 border-[hsl(222,65%,18%)]"
      : "bg-white border-b border-slate-200"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/Home" className="flex items-center gap-2.5 group" aria-label="FindBack AI Home">
            <div className="w-9 h-9 rounded-xl bg-[hsl(222,65%,18%)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight text-[hsl(222,65%,18%)]">FindBack AI</span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wide">Pleasant Valley HS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant={isActive(to) ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-1.5 text-sm font-medium ${
                    isActive(to)
                      ? "bg-[hsl(222,65%,18%)]/10 text-[hsl(222,65%,18%)]"
                      : "text-slate-600 hover:text-[hsl(222,65%,18%)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setIsAdminMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !isAdminMode
                    ? "bg-[hsl(222,65%,18%)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                onClick={() => setIsAdminMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isAdminMode
                    ? "bg-[hsl(222,65%,18%)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>
            {/* Admin Dashboard Link */}
            {isAdmin && (
              <Link to="/AdminDashboard">
                <Button size="sm" variant="ghost" className="gap-1.5 text-[hsl(222,65%,18%)] font-semibold hidden sm:flex">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            )}

            {/* Notification Bell */}
            {user && (
              <Link to="/UserDashboard" aria-label="Notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4.5 h-4.5 text-slate-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* User Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
                    <div className="w-7 h-7 rounded-full bg-[hsl(222,65%,18%)] flex items-center justify-center text-white text-xs font-bold">
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm text-slate-700 max-w-24 truncate">{user.full_name?.split(" ")[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/UserDashboard" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/AdminDashboard" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="block">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(to) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                </Link>
              ))}
              {user && (
                <Link to="/UserDashboard" className="block">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50">
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    <span className="font-medium text-sm">My Dashboard</span>
                  </div>
                </Link>
              )}
              {isAdmin && (
                <Link to="/AdminDashboard" className="block">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[hsl(213,56%,24%)] bg-blue-50 hover:bg-blue-100">
                    <Shield className="w-4.5 h-4.5" />
                    <span className="font-medium text-sm">Admin Dashboard</span>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}