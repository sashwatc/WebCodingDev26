/**
 * Footer.jsx
 * --------------------------------------------------------------------------
 * Site-wide footer rendered at the bottom of every public page (via
 * PublicLayout). It is purely presentational: a branded strip, three columns
 * of navigation links (Resources, App, Contact), and a bottom legal bar.
 * All user-facing text is translated through react-i18next (`t`) and brand /
 * contact constants come from "@/lib/constants" so they stay consistent
 * across the app.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BRAND_NAME, SCHOOL_NAME, SCHOOL_FULL_NAME,
  SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_LOCATION,
} from "@/lib/constants";
import schoolMark from "@/assets/Spartan_Head.png";

export default function Footer() {
  // i18n translation function; second arg to t() is a fallback string.
  const { t } = useTranslation();

  // "Resources" column: static/informational pages (docs, legal, FAQ, etc.).
  // Each entry pairs a router path (`to`) with a translated label.
  const resourceLinks = [
    { to: "/Documentation", label: t("footer.project_documentation") },
    { to: "/Accessibility",  label: t("footer.accessibility_statement") },
    { to: "/FAQ",            label: t("footer.faq", "FAQ") },
    { to: "/Sources",        label: t("footer.sources_and_citations") },
    { to: "/Privacy",        label: t("footer.privacy_policy", "Privacy") },
    { to: "/Terms",          label: t("footer.terms_of_use", "Terms") },
  ];

  // "App" column: the core functional routes (browse, report, dashboard).
  const appLinks = [
    { to: "/Search",     label: "Browse Found Items" },
    { to: "/LostItems",  label: "Lost Reports" },
    { to: "/ReportFound", label: "Report a Found Item" },
    { to: "/ReportLost",  label: "Report a Lost Item" },
    { to: "/UserDashboard", label: "My Dashboard" },
  ];

  return (
    // role="contentinfo" marks this as the page's footer landmark for a11y.
    <footer className="mt-20 border-t border-border" role="contentinfo">

      {/* Brand strip: dark band with the school mark, brand name and a one-line summary */}
      <div className="bg-card border-b border-border">
        <div className="page-shell py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: logo tile + brand name + "Built for <school>" caption */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
                {/* School mark forced to pure white via brightness(0) invert(1) so it reads on the dark strip */}
                <img
                  src={schoolMark}
                  alt=""
                  className="h-[19px] w-[19px] object-contain"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <div>
                <p className="text-[15px] font-bold leading-none text-white">{BRAND_NAME}</p>
                <p className="mt-[3px] text-[11px] font-medium leading-none" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Built for {SCHOOL_FULL_NAME}
                </p>
              </div>
            </div>
            {/* Right: short translated description of what the app does */}
            <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
              {t("footer.summary")}
            </p>
          </div>
        </div>
      </div>

      {/* Link columns: three-column responsive grid of footer navigation */}
      <div className="bg-background">
        <div className="page-shell py-9">
          <div className="grid gap-8 sm:grid-cols-3">

            {/* Resources column — maps over resourceLinks defined above */}
            <div>
              <p className="section-label mb-4">{t("footer.links", "Resources")}</p>
              <ul className="space-y-2.5">
                {resourceLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* App column — maps over appLinks defined above */}
            <div>
              <p className="section-label mb-4">App</p>
              <ul className="space-y-2.5">
                {appLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact column — email (mailto link), phone and location from constants */}
            <div>
              <p className="section-label mb-4">{t("footer.contact")}</p>
              <ul className="space-y-4">
                {/* Email row: clickable mailto link */}
                <li>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("footer.contact_email_label", "Email")}
                  </p>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="mt-0.5 block text-[13.5px] font-medium text-foreground transition-colors hover:text-ring"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                {/* Phone row */}
                <li>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("footer.contact_phone_label", "Phone")}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-foreground">{SUPPORT_PHONE}</p>
                </li>
                {/* Location row */}
                <li>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("footer.contact_location_label", "Location")}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-foreground">{SUPPORT_LOCATION}</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar: copyright (with interpolated current year/brand/school) + storage notice */}
          <div className="mt-9 flex flex-col gap-1.5 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted-foreground">
              {t("footer.copyright", {
                year: new Date().getFullYear(), // dynamically current year
                brand: BRAND_NAME,
                school: SCHOOL_NAME,
              })}
            </p>
            <p className="text-[12px] text-muted-foreground">{t("footer.local_storage_notice")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
