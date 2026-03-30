/**
 * FindBack AI - Custom 404 Page
 */
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileSearch, Home, Search } from "lucide-react";

export default function PageNotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(213,56%,24%)] to-[hsl(174,60%,40%)] flex items-center justify-center mb-6 shadow-lg">
          <FileSearch className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-7xl font-extrabold text-slate-200 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t("page_not_found.title")}</h2>
        <p className="text-slate-500 mb-8">
          {t("page_not_found.description")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/Home">
            <Button className="gap-2 bg-[hsl(213,56%,24%)] hover:bg-[hsl(213,56%,20%)]">
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
