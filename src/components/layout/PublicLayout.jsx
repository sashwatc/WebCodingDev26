/**
 * FindBack AI - Public Layout Wrapper
 * Wraps public-facing pages with the Navbar and Footer.
 * Uses React Router's <Outlet> for clean page rendering.
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/AuthContext";

export default function PublicLayout() {
  const isMobile = useIsMobile();
  const { isAuthenticated, isAdmin, isStaff } = useAuth();
  // Students get a bottom tab bar on mobile — pad the content so it clears the nav.
  const showBottomNav = isMobile && isAuthenticated && !isAdmin && !isStaff;

  const handleSkipToContent = (event) => {
    event.preventDefault();
    const main = document.getElementById("main-content");
    if (!main) {
      return;
    }

    main.focus();
    main.scrollIntoView({ block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        onClick={handleSkipToContent}
      >
        Skip to main content
      </a>
      <Navbar />
      <main
        className={`flex-1 pt-16 ${showBottomNav ? "pb-16" : ""}`}
        id="main-content"
        role="main"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
