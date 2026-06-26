import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BRAND_NAME, SCHOOL_NAME, SCHOOL_FULL_NAME,
  SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_LOCATION,
} from "@/lib/constants";
import schoolMark from "@/assets/Spartan_Head.png";

export default function Footer() {
  const { t } = useTranslation();

  const resourceLinks = [
    { to: "/Documentation", label: t("footer.project_documentation") },
    { to: "/Accessibility",  label: t("footer.accessibility_statement") },
    { to: "/FAQ",            label: t("footer.faq", "FAQ") },
    { to: "/Sources",        label: t("footer.sources_and_citations") },
    { to: "/Privacy",        label: t("footer.privacy_policy", "Privacy") },
    { to: "/Terms",          label: t("footer.terms_of_use", "Terms") },
  ];

  const appLinks = [
    { to: "/Search",     label: "Browse Found Items" },
    { to: "/LostItems",  label: "Lost Reports" },
    { to: "/ReportFound", label: "Report a Found Item" },
    { to: "/ReportLost",  label: "Report a Lost Item" },
    { to: "/UserDashboard", label: "My Dashboard" },
  ];

  return (
    <footer className="mt-20 border-t border-border" role="contentinfo">

      {/* Navy brand strip */}
      <div style={{ background: "hsl(var(--primary))" }}>
        <div className="page-shell py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
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
            <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
              {t("footer.summary")}
            </p>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="bg-background">
        <div className="page-shell py-9">
          <div className="grid gap-8 sm:grid-cols-3">

            {/* Resources */}
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

            {/* App */}
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

            {/* Contact */}
            <div>
              <p className="section-label mb-4">{t("footer.contact")}</p>
              <ul className="space-y-4">
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
                <li>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("footer.contact_phone_label", "Phone")}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-foreground">{SUPPORT_PHONE}</p>
                </li>
                <li>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("footer.contact_location_label", "Location")}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-foreground">{SUPPORT_LOCATION}</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-9 flex flex-col gap-1.5 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted-foreground">
              {t("footer.copyright", {
                year: new Date().getFullYear(),
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
