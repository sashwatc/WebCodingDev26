/**
 * FindBack AI - Public Layout Wrapper
 * Wraps public-facing pages with the Navbar and Footer.
 * Uses React Router's <Outlet> for clean page rendering.
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout() {
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
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link" onClick={handleSkipToContent}>
        Skip to main content
      </a>
      <Navbar />
      <main className="flex-1 pt-16" id="main-content" role="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
