/**
 * RouteEnhancements.jsx
 * --------------------------------------------------------------------------
 * A headless, side-effecting component (rendered once near the app root) that
 * reacts to every route change to:
 *   1. Set a localized document.title (so the browser tab + history reflect
 *      the current page).
 *   2. Scroll the window back to the top on navigation.
 *   3. Announce the new page to screen readers via an aria-live region.
 * Its only visible output is a screen-reader-only <p>; everything else is a
 * side effect.
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND_NAME } from "@/lib/constants";

export default function RouteEnhancements() {
  const { t } = useTranslation();
  const location = useLocation();                       // current route
  const [announcement, setAnnouncement] = useState(""); // text read aloud by screen readers

  // Runs on every path change (and language change, since `t` is a dep).
  useEffect(() => {
    // Map of known routes to their translated, human-readable titles.
    const pageTitles = {
      "/Home": t("route_titles.home"),
      "/Search": t("route_titles.search"),
      "/ReportFound": t("route_titles.report_found"),
      "/ReportLost": t("route_titles.report_lost"),
      "/ItemDetails": t("route_titles.item_details"),
      "/ClaimItem": t("route_titles.claim_item"),
      "/UserDashboard": t("route_titles.user_dashboard"),
      "/AdminDashboard": t("route_titles.admin_dashboard"),
      "/About": t("route_titles.about", { brand: BRAND_NAME }),
      "/FAQ": t("route_titles.faq"),
      "/Privacy": t("route_titles.privacy"),
      "/Terms": t("route_titles.terms"),
      "/Accessibility": t("route_titles.accessibility"),
      "/Sources": t("route_titles.sources"),
      "/Documentation": t("route_titles.documentation"),
      "/ShaderDemo": t("route_titles.shader_demo"),
    };

    // Fall back to the brand name for unknown routes.
    const pageTitle = pageTitles[location.pathname] || BRAND_NAME;
    // Avoid duplicating the brand when the title already contains it; otherwise
    // append " | <brand>" for consistent tab titles.
    document.title = pageTitle.includes(BRAND_NAME) ? pageTitle : `${pageTitle} | ${BRAND_NAME}`;
    window.scrollTo(0, 0);  // reset scroll position for the new page
    // Update the live-region text so assistive tech announces the page change.
    setAnnouncement(t("route_titles.loaded", { title: pageTitle }));
  }, [location.pathname, t]);

  return (
    // Visually hidden polite live region; aria-atomic re-reads the full message each update.
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  );
}
