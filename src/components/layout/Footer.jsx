import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND_NAME, SCHOOL_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_LOCATION } from "@/lib/constants";
import schoolMark from "@/assets/Spartan_Head.png";

export default function Footer() {
  const { t } = useTranslation();
  const links = [
    { to: "/Documentation", label: t("footer.project_documentation") },
    { to: "/Accessibility", label: t("footer.accessibility_statement") },
    { to: "/FAQ", label: t("footer.faq", "FAQ") },
    { to: "/Sources", label: t("footer.sources_and_citations") },
    { to: "/Privacy", label: t("footer.privacy_policy", "Privacy") },
    { to: "/Terms", label: t("footer.terms_of_use", "Terms") },
  ];

  return (
    <footer className="mt-16 border-t bg-background" role="contentinfo">
      <div className="page-shell py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <img src={schoolMark} alt="" className="h-5 w-5 object-contain" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{BRAND_NAME}</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("footer.summary")}</p>
            <p className="text-xs text-muted-foreground">{t("footer.built_for", "Built for {{school}}").replace("{{school}}", SCHOOL_NAME)}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t("footer.links", "Resources")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t("footer.contact")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("footer.contact_email_label", "Email")}</span>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-foreground">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("footer.contact_phone_label", "Phone")}</span>
                <span>{SUPPORT_PHONE}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("footer.contact_location_label", "Location")}</span>
                <span>{SUPPORT_LOCATION}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("footer.copyright", {
              year: new Date().getFullYear(),
              brand: BRAND_NAME,
              school: SCHOOL_NAME,
            })}
          </p>
          <p>{t("footer.local_storage_notice")}</p>
        </div>
      </div>
    </footer>
  );
}
