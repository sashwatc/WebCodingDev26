import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  BRAND_NAME,
  SCHOOL_NAME,
  SUPPORT_EMAIL,
  SUPPORT_LOCATION,
  SUPPORT_PHONE,
} from "@/lib/constants";

export default function Footer() {
  const { t } = useTranslation();
  const links = [
    { to: "/Search", label: t("common.search_items") },
    { to: "/ReportFound", label: t("common.report_found_item") },
    { to: "/ReportLost", label: t("common.report_lost_item") },
    { to: "/Documentation", label: t("footer.project_documentation") },
    { to: "/Accessibility", label: t("footer.accessibility_statement") },
    { to: "/Sources", label: t("footer.sources_and_citations") },
  ];

  return (
    <footer className="mt-16 border-t bg-background" role="contentinfo">
      <div className="page-shell py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">{BRAND_NAME}</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {t("footer.summary")}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("footer.built_for")}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">{t("footer.links")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">{t("footer.contact")}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                {SUPPORT_EMAIL}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                {SUPPORT_PHONE}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                {SUPPORT_LOCATION}
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
          <p>
            {t("footer.local_storage_notice")}
          </p>
        </div>
      </div>
    </footer>
  );
}
