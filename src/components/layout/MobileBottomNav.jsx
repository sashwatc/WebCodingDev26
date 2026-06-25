import React from "react";
import { NavLink } from "react-router-dom";
import { HelpCircle, Heart, Plus, Search, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/AuthContext";

const TABS = [
  { to: "/Search",        label: "Find",     icon: Search },
  { to: "/ReportFound",   label: "Report",   icon: Plus },
  { to: "/UserDashboard", label: "Recovery", icon: Heart },
  { to: "/FAQ",           label: "Support",  icon: HelpCircle },
  { to: "/Settings",      label: "Profile",  icon: User },
];

export default function MobileBottomNav() {
  const isMobile = useIsMobile();
  const { isAuthenticated, isAdmin, isStaff } = useAuth();

  // Students only — staff/admin use the desk-oriented nav.
  if (!isMobile || !isAuthenticated || isAdmin || isStaff) return null;

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
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
