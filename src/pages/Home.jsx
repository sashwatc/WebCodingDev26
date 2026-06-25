/**
 * Lost Then Found — Home page
 * Design source: claude.ai/design/p/01cc7384-e5c3-420e-ab6c-f3e1e590d292
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Bell, Clock,
  FileText, MapPin, PlusCircle, Search, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { staggerChildVariants, staggerContainerProps } from "@/lib/motion";

/* ─── Static showcase items (links to live Search) ────────────────────── */
const SHOWCASE_ITEMS = [
  { src: "/items/airpods-pro-case.png",  label: "AirPods Pro Case",   location: "Library",     daysAgo: 1 },
  { src: "/items/rayban-sunglasses.png", label: "Ray-Ban Sunglasses", location: "Gymnasium",   daysAgo: 2 },
  { src: "/items/casio-watch.png",       label: "Casio Watch",        location: "Cafeteria",   daysAgo: 3 },
  { src: "/items/black-hydro-flask.jpg", label: "Hydro Flask",        location: "Hallway B",   daysAgo: 4 },
  { src: "/items/nike-hoodie.png",       label: "Nike Hoodie",        location: "Locker Room", daysAgo: 5 },
  { src: "/items/ti-calculator.png",     label: "TI-84 Calculator",   location: "Room 204",    daysAgo: 6 },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Search,   title: "Search the archive", desc: "Browse logged found items by keyword, brand, color, or location." },
  { step: "02", icon: FileText, title: "File a report",      desc: "Submit a lost or found report in under a minute with photos and details." },
  { step: "03", icon: Bell,     title: "Get notified",       desc: "Receive automatic alerts the moment a matching item is logged." },
];

/* ─── Framer Motion variants ──────────────────────────────────────────── */
const spring = { type: "spring", stiffness: 380, damping: 22 };

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.12 } },
};

const heroItem = {
  hidden:   { opacity: 0, y: 22 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const heroTitle = {
  hidden:   { opacity: 0, y: 30 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoadingAuth } = useAuth();
  const [homeSearchQuery, setHomeSearchQuery]   = useState("");
  const [searchFocused,   setSearchFocused]     = useState(false);

  const isAdminWorkspace = !isLoadingAuth && isAdmin;

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

  // Match the design's two-line headline: "Search first." / "Recover securely."
  const titleParts = t("home.title").split(". ");
  const hasTwoLines = titleParts.length === 2;

  return (
    <div className="bg-transparent">

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        className="relative overflow-hidden"
        aria-labelledby="home-title"
        style={{
          backgroundColor: "#0a1228",
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 38%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Sunset-cast overlay — full photo reads through, darkened for legibility */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(4,8,26,0.78) 0%, rgba(12,22,55,0.62) 50%, rgba(4,8,26,0.82) 100%)" }}
        />
        {/* Top edge highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        <div className="home-section relative z-10 py-24 sm:py-32">
          <motion.div
            className="mx-auto max-w-[660px] text-center"
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={heroItem} className="mb-7">
              <span className="inline-flex items-center gap-[6px] rounded-full border border-white/[0.18] bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-white/70 backdrop-blur-sm">
                <span
                  className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400"
                  style={{ boxShadow: "0 0 6px #10b981" }}
                  aria-hidden="true"
                />
                {t("home.kicker")}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              id="home-title"
              variants={heroTitle}
              className="font-extrabold leading-[1.08]"
              style={{
                color: "#ffffff",
                fontSize: "clamp(38px, 5.5vw, 62px)",
                letterSpacing: "-0.035em",
                textShadow: "0 2px 30px rgba(0,0,0,0.75), 0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              {hasTwoLines ? (
                <>
                  {titleParts[0]}.<br />
                  {titleParts[1]}
                </>
              ) : (
                t("home.title")
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={heroItem}
              className="mx-auto mt-4 max-w-[440px] text-base font-normal leading-[1.65]"
              style={{ color: "rgba(255,255,255,0.78)", textShadow: "0 1px 12px rgba(0,0,0,0.55)" }}
            >
              {t("home.subtitle")}
            </motion.p>

            {/* Search form — all original logic preserved */}
            <motion.form
              variants={heroItem}
              onSubmit={handleHomeSearch}
              className="relative mx-auto mt-10 max-w-[560px]"
              role="search"
              aria-label={t("home.search_aria", "Search the found item inventory")}
            >
              <motion.div
                animate={{
                  boxShadow: searchFocused
                    ? "0 0 0 3px rgba(13,31,60,0.2), 0 4px 22px rgba(0,0,0,0.10)"
                    : "0 4px 22px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.05)",
                  borderColor: searchFocused ? "#0d1f3c" : "rgba(0,0,0,0.10)",
                }}
                transition={{ duration: 0.15 }}
                className="flex items-center overflow-hidden rounded-[13px] border-[1.5px]"
                style={{ backgroundColor: "#ffffff" }}
              >
                <Search
                  className="ml-[18px] mr-[10px] h-[17px] w-[17px] shrink-0 text-[#9ca3af]"
                  aria-hidden="true"
                />
                <Input
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="h-auto flex-1 border-none bg-transparent py-[15px] text-[15.5px] font-medium shadow-none placeholder:text-[#b0aaa0] focus-visible:ring-0"
                  style={{ color: "#111827" }}
                  placeholder={t("home.search_placeholder", "AirPods, water bottle, library…")}
                  aria-label={t("home.search_aria", "Search the found item inventory")}
                />
                <button
                  type="submit"
                  className="m-[5px] shrink-0 rounded-[9px] bg-[#0d1f3c] px-[22px] py-[11px] text-[13.5px] font-bold tracking-[0.01em] text-white transition-opacity hover:opacity-90 active:opacity-80"
                >
                  {t("home.search_button", "Search")} →
                </button>
              </motion.div>
            </motion.form>

            <motion.p
              variants={heroItem}
              className="mt-[10px] text-[12.5px] font-medium"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {t("home.search_help", "Try item type, brand, color, or where it was found")}
            </motion.p>

            {/* Quick action pills */}
            <motion.div
              variants={heroItem}
              className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}>
                <Link
                  to="/ReportLost"
                  className="flex items-center gap-[7px] rounded-[9px] border border-white/[0.18] bg-white/10 px-[18px] py-[9px] text-[13.5px] font-semibold backdrop-blur-[10px] transition-colors hover:bg-white/[0.16]"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  {t("home.cant_find_it", "I lost something")}
                </Link>
              </motion.div>

              <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden="true" />

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}>
                <Link
                  to="/ReportFound"
                  className="flex items-center gap-[7px] rounded-[9px] border border-white/[0.18] bg-white/10 px-[18px] py-[9px] text-[13.5px] font-semibold backdrop-blur-[10px] transition-colors hover:bg-white/[0.16]"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  {t("home.found_something", "I found something")}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade into page background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[90px]"
          style={{ background: "linear-gradient(to top, hsl(var(--canvas)), transparent)" }}
        />
      </section>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <div className="home-section pb-16 sm:pb-24">

        {/* Hairline divider */}
        <div className="my-14 h-px bg-border sm:my-16" aria-hidden="true" />

        <div className="space-y-20 sm:space-y-24">

          {/* ── Item Showcase ────────────────────────── */}
          <motion.section
            aria-labelledby="showcase-title"
            {...staggerContainerProps}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 id="showcase-title" className="text-xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                  Recently found nearby
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Items logged and waiting to be claimed</p>
              </div>
              <Link
                to="/Search"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {SHOWCASE_ITEMS.map((item) => (
                <motion.div key={item.label} variants={staggerChildVariants}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={spring}
                  >
                    <Link
                      to={`/Search?q=${encodeURIComponent(item.label)}`}
                      className="archive-card group flex flex-col overflow-hidden"
                      aria-label={`Search for ${item.label}, found at ${item.location}`}
                    >
                      <div className="archive-card-media aspect-square bg-muted">
                        <img
                          src={item.src}
                          alt={item.label}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold text-foreground">{item.label}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          <span>{item.daysAgo === 1 ? "Yesterday" : `${item.daysAgo}d ago`}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── How It Works ─────────────────────────── */}
          <motion.section
            aria-labelledby="how-title"
            {...staggerContainerProps}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="mb-8">
              <h2 id="how-title" className="text-xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                How it works
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Three steps to reuniting you with your belongings</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
                <motion.div
                  key={step}
                  variants={staggerChildVariants}
                  whileHover={{ y: -4 }}
                  transition={spring}
                  className="archive-card p-6"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
                      <Icon className="h-4 w-4 text-foreground" aria-hidden="true" />
                    </div>
                    <span
                      className="font-black tracking-tighter text-border select-none"
                      style={{ fontSize: "2rem", lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      {step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── Report Cards ─────────────────────────── */}
          <motion.section
            aria-labelledby="home-report-title"
            {...staggerContainerProps}
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <div className="mb-7">
              <p className="mb-[7px] text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                File a report
              </p>
              <h2
                id="home-report-title"
                className="text-xl font-bold text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("home.next_step_title", "Need to file a report?")}
              </h2>
              <p className="mt-[5px] text-sm leading-relaxed text-muted-foreground">
                {t("home.next_step_helper", "Use these only when the public list does not already have the item.")}
              </p>
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
              <ReportCard
                to="/ReportLost"
                icon={AlertTriangle}
                title={t("home.cant_find_it", "I lost something")}
                description={t(
                  "home.lost_description",
                  "Submit a lost-item report, keep the case active, and review suggested matches as new items come in.",
                )}
                cta={t("home.submit_report", "Submit report")}
                tone="lost"
              />
              <ReportCard
                to="/ReportFound"
                icon={PlusCircle}
                title={t("home.found_something", "I found something")}
                description={t(
                  "home.found_description",
                  "Create a moderated item record with photos and details so the owner can recognize it quickly.",
                )}
                cta={t("home.submit_report", "Submit report")}
                tone="found"
              />
            </div>
          </motion.section>

          {/* ── Dashboard / Admin ────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-40px" }}
          >
            {isAdminWorkspace ? (
              <AdminWorkspacePanel />
            ) : (
              <div className="archive-card overflow-hidden">
                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                      {user
                        ? <FileText className="h-5 w-5 text-foreground" aria-hidden="true" />
                        : <Shield   className="h-5 w-5 text-foreground" aria-hidden="true" />
                      }
                    </div>
                    <div className="space-y-1.5">
                      <span className="evidence-chip">{t("home.dashboard_kicker", "Your account")}</span>
                      <h3 className="text-lg font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.015em" }}>
                        {t("home.my_dashboard_title", "My dashboard")}
                      </h3>
                      <p className="max-w-md text-sm leading-6 text-muted-foreground">
                        {user
                          ? t("home.my_dashboard_description",      "View your submissions, claims, and notifications.")
                          : t("home.project_documentation_description", "See how Lost Then Found works.")}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
                    <Link to={user ? "/UserDashboard" : "/Documentation"}>
                      {user ? t("navbar.my_dashboard") : t("footer.project_documentation")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.section>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Sub-components ═══════════════════ */

function ReportCard({ to, icon: Icon, title, description, cta, tone = "found" }) {
  const isLost = tone === "lost";

  return (
    <motion.div variants={staggerChildVariants}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 10px 28px rgba(0,0,0,0.09)" }}
        transition={spring}
        className="h-full"
      >
        <Link
          to={to}
          className="flex h-full flex-col rounded-2xl p-7 transition-colors"
          style={{
            background:   isLost ? "linear-gradient(145deg,#fffbeb,#fff 60%)" : "linear-gradient(145deg,#f0fdf4,#fff 60%)",
            border:       isLost ? "1.5px solid #fde68a"                      : "1.5px solid #bbf7d0",
          }}
        >
          {/* Icon */}
          <div
            className="mb-[18px] flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: isLost ? "#fef3c7" : "#dcfce7" }}
          >
            <Icon
              style={{ width: 22, height: 22, stroke: isLost ? "#d97706" : "#059669", strokeWidth: 1.5 }}
              aria-hidden="true"
            />
          </div>

          {/* Text */}
          <h3
            className="mb-2 text-[15.5px] font-bold text-[#111827]"
            style={{ letterSpacing: "-0.01em" }}
          >
            {title}
          </h3>
          <p className="mb-[22px] flex-1 text-[13px] leading-[1.6] text-[#6b7280]">
            {description}
          </p>

          {/* CTA */}
          <span
            className="flex items-center gap-[5px] text-[13px] font-bold"
            style={{ color: isLost ? "#d97706" : "#059669" }}
          >
            {cta}
            <ArrowRight
              style={{ width: 13, height: 13, stroke: isLost ? "#d97706" : "#059669" }}
              aria-hidden="true"
            />
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function AdminWorkspacePanel() {
  const { t } = useTranslation();
  return (
    <motion.div
      whileHover={{ boxShadow: "0 12px 36px rgba(4,8,26,0.28)" }}
      transition={spring}
      className="overflow-hidden rounded-2xl"
      style={{ background: "#0d1f3c" }}
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.07]">
            <Shield className="h-[17px] w-[17px] text-white/55" aria-hidden="true" />
          </div>
          <div>
            <div className="mb-[5px] inline-block rounded-[5px] bg-white/[0.09] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.10em] text-white/50">
              {t("home.admin_badge", "Admin mode")}
            </div>
            <h3
              className="text-[14.5px] font-bold text-white"
              style={{ letterSpacing: "-0.01em" }}
            >
              {t("home.moderator_active_title", "Moderator Workspace Active")}
            </h3>
            <p className="mt-0.5 max-w-md text-[12.5px] text-white/40">
              {t("home.moderator_active_desc", "Review pending items, claims, and reports.")}
            </p>
          </div>
        </div>
        <Button
          asChild
          size="lg"
          variant="ghost"
          className="w-full shrink-0 gap-2 border border-white/15 text-white/90 hover:bg-white/10 hover:text-white sm:w-auto"
        >
          <Link to="/AdminDashboard">
            {t("home.go_to_admin_panel", "Open Admin Dashboard")}
            <ArrowRight className="h-[13px] w-[13px]" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
