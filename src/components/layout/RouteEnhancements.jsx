import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND_NAME } from "@/lib/constants";

export default function RouteEnhancements() {
  const { t } = useTranslation();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
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

    const pageTitle = pageTitles[location.pathname] || BRAND_NAME;
    document.title = pageTitle.includes(BRAND_NAME) ? pageTitle : `${pageTitle} | ${BRAND_NAME}`;
    window.scrollTo(0, 0);
    setAnnouncement(t("route_titles.loaded", { title: pageTitle }));
  }, [location.pathname, t]);

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  );
}
