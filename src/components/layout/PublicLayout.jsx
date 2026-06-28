/**
 * FindBack AI - Public Layout Wrapper
 * Wraps public-facing pages with the Navbar and Footer.
 * Uses React Router's <Outlet> for clean page rendering.
 *
 * --------------------------------------------------------------------------
 * This is the shared chrome for every public route: it renders a "skip to
 * content" accessibility link, the top Navbar, the active page (via
 * <Outlet/>), and the Footer. Child routes plug into the <Outlet/>.
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout() {
  // Skip-link handler: move keyboard focus (and scroll) to the <main> region,
  // letting keyboard/screen-reader users bypass the navbar. preventDefault
  // avoids the default hash-jump so we control focus + scroll precisely.
  const handleSkipToContent = (event) => {
    event.preventDefault();
    const main = document.getElementById("main-content");
    if (!main) {
      return; // nothing to focus if the main region isn't present
    }

    main.focus();
    main.scrollIntoView({ block: "start" });
  };

  return (
    // Full-height page shell; overflow-x-clip prevents horizontal scroll bleed.
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Visually-hidden skip link (revealed on focus) targeting #main-content */}
      <a href="#main-content" className="skip-link" onClick={handleSkipToContent}>
        Skip to main content
      </a>
      {/* Shared top navigation */}
      <Navbar />
      {/* Main landmark; tabIndex={-1} makes it programmatically focusable for the skip link.
          pt-16 offsets the fixed Navbar so content isn't hidden underneath it. */}
      <main className="flex-1 pt-16" id="main-content" role="main" tabIndex={-1}>
        {/* Active child route renders here */}
        <Outlet />
      </main>
      {/* Shared site footer */}
      <Footer />
    </div>
  );
}
