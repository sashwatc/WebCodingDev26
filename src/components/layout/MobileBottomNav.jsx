/**
 * MobileBottomNav.jsx
 * --------------------------------------------------------------------------
 * The fixed, app-style bottom tab bar shown to signed-in students on mobile
 * viewports. It provides one-tap access to the five primary student
 * destinations. It deliberately renders nothing for desktop users and for
 * staff/admin accounts (who use the richer desk-oriented Navbar instead).
 */

import React from "react";
import { NavLink } from "react-router-dom";
import { HelpCircle, Heart, Plus, Search, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/AuthContext";

// The five fixed tabs: route, short label, and lucide icon component.
const TABS = [
  { to: "/Search",        label: "Find",     icon: Search },
  { to: "/ReportFound",   label: "Report",   icon: Plus },
  { to: "/UserDashboard", label: "Recovery", icon: Heart },
  { to: "/FAQ",           label: "Support",  icon: HelpCircle },
  { to: "/Settings",      label: "Profile",  icon: User },
];

export default function MobileBottomNav() {
  const isMobile = useIsMobile();              // true below the mobile breakpoint
  const { isAuthenticated, isAdmin, isStaff } = useAuth();

  // Gate: only render for authenticated students on mobile.
  // Students only — staff/admin use the desk-oriented nav.
  if (!isMobile || !isAuthenticated || isAdmin || isStaff) return null;

  return (
    // Fixed bar pinned to the bottom; safe-area padding clears the iOS home indicator.
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Five equal-width columns, one per tab */}
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            {/* NavLink exposes isActive so the current route highlights in the primary color */}
            <NavLink
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-center transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon thickens (heavier stroke) when its tab is active */}
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.4 : 2}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
