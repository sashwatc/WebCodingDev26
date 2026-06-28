/**
 * FindBack AI - Custom 404 Page
 * -----------------------------------------------------------------------------
 * Fallback route component rendered when no other route matches. Shows a
 * localized "page not found" message (via react-i18next) and two navigation
 * actions: back to Home and to Search. Purely presentational — no state.
 */
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileSearch, Home, Search } from "lucide-react";

export default function PageNotFound() {
  // `t` resolves i18n keys to the active locale's strings.
  const { t } = useTranslation();

  // Full-screen centered card with the 404 headline and recovery links.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {/* Decorative icon badge */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <FileSearch className="h-10 w-10 text-primary-foreground" />
        </div>
        {/* Large "404" plus localized title and description */}
        <h1 className="mb-2 text-7xl font-extrabold text-muted">404</h1>
        <h2 className="mb-3 text-2xl font-bold text-foreground">{t("page_not_found.title")}</h2>
        <p className="mb-8 text-muted-foreground">
          {t("page_not_found.description")}
        </p>
        {/* Recovery actions: primary -> Home, outline -> Search */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/Home">
            <Button className="gap-2">
              <Home className="w-4 h-4" /> {t("page_not_found.go_home")}
            </Button>
          </Link>
          <Link to="/Search">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" /> {t("common.search_items")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
