/**
 * Lost Then Found — Home page
 *
 * Part 1: A scroll-driven cinematic animation (video frame scrubbing + narrative
 *         scenes + parallax particle depth) that plays through entirely as an intro.
 * Part 2: The functional homepage that appears after the animation —
 *         search bar + lost/found actions → lost items → how it works →
 *         report cards → project documentation. All original features preserved.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Bell, Clock,
  FileText, MapPin, PlusCircle, Search, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { staggerChildVariants, staggerContainerProps } from "@/lib/motion";

/* ─── Data ──────────────────────────────────────────────────────────────── */
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

/* ─── Cinematic narrative scenes (pure story, 0–1 scroll progress) ───────── */
const STORY_SCENES = [
  { key: "arrival",  range: [0,    0.20] },
  { key: "lost",     range: [0.20, 0.40] },
  { key: "problem",  range: [0.40, 0.60] },
  { key: "connect",  range: [0.60, 0.80] },
  { key: "platform", range: [0.80, 1.0 ] },
];

const VIDEO_SRC      = "/videos/cinematic.mp4";
const SCROLL_PX      = `${STORY_SCENES.length * 100}vh`;
const PARTICLE_COUNT = 46;
const SCROLL_SMOOTHING = 0.14;
const PROGRESS_EPSILON = 0.0002;
const VIDEO_SEEK_EPSILON = 0.045;

/* ─── Framer Motion (functional sections) ───────────────────────────────── */
const spring = { type: "spring", stiffness: 380, damping: 22 };

const clamp01 = (value) => Math.max(0, Math.min(1, value));

/* ═══════════════════════════════ Page ══════════════════════════════════ */
export default function Home() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoadingAuth } = useAuth();

  /* refs — cinematic */
  const containerRef      = useRef(null);
  const canvasRef         = useRef(null);
  const particleCanvasRef = useRef(null);
  const particlesRef      = useRef([]);
  const particleRafRef    = useRef(null);
  const videoRef          = useRef(null);
  const progressBarRef    = useRef(null);
  const exitFadeRef       = useRef(null);
  const platformLightRef  = useRef(null);
  const platformDarkRef   = useRef(null);
  const progressRef       = useRef(0);
  const reducedMotionRef  = useRef(false);
  const rafRef            = useRef(null);
  const dotRefs           = useRef([]);
  const sceneRefs         = useRef(
    Object.fromEntries(STORY_SCENES.map(s => [s.key, React.createRef()]))
  );

  /* state */
  const [isLoaded,      setIsLoaded]      = useState(false);
  const [homeSearch,    setHomeSearch]    = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const isAdminWorkspace = !isLoadingAuth && isAdmin;
  const titleParts = t("home.title").split(". ");
  const hasTwoLines = titleParts.length === 2;

  const handleHomeSearch = (e) => {
    e.preventDefault();
    const q = homeSearch.trim();
    navigate(q ? `/Search?q=${encodeURIComponent(q)}` : "/Search");
  };

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      reducedMotionRef.current = Boolean(query?.matches);
    };

    syncMotionPreference();
    query?.addEventListener?.("change", syncMotionPreference);
    return () => query?.removeEventListener?.("change", syncMotionPreference);
  }, []);

  /* ── Canvas resize ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const c = canvasRef.current;
      if (c) { c.width = w; c.height = h; }
      const p = particleCanvasRef.current;
      if (p) { p.width = w; p.height = h; }
      drawVideoFrame();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // eslint-disable-line

  /* ── Draw current video frame to canvas (cover-fill) ────────────────────── */
  const drawVideoFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    const cw = canvas.width,  ch = canvas.height;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;

    const va = vw / vh, ca = cw / ch;
    let sx, sy, sw, sh;
    if (va > ca) { sh = vh; sw = sh * ca; sx = (vw - sw) / 2; sy = 0; }
    else         { sw = vw; sh = sw / ca; sx = 0; sy = (vh - sh) / 2; }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
  }, []);

  /* ── Narrative scene opacity updater ────────────────────────────────────── */
  const updateScenes = useCallback((p) => {
    STORY_SCENES.forEach(({ key, range: [s, e] }, i) => {
      const el = sceneRefs.current[key]?.current;
      if (!el) return;

      const isFirst = i === 0;
      const isLast  = i === STORY_SCENES.length - 1;
      const fade    = Math.min((e - s) * 0.3, 0.07);
      let op = 0;

      if (p >= s && p <= e) {
        const fadeIn  = !isFirst && p < s + fade;
        const fadeOut = !isLast  && p > e - fade;
        if      (fadeIn)  op = (p - s) / fade;
        else if (fadeOut) op = (e - p) / fade;
        else              op = 1;
      }

      const clamped = Math.max(0, Math.min(1, op));
      el.style.opacity       = String(clamped);
      el.style.pointerEvents = clamped > 0.05 ? "auto" : "none";
      /* subtle rise as a scene comes in */
      el.style.transform = `translateY(${(1 - clamped) * 18}px)`;

      const dot = dotRefs.current[i];
      if (dot) {
        dot.style.background = clamped > 0.4 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)";
        dot.style.transform  = clamped > 0.4 ? "scaleY(1.5)" : "scaleY(1)";
      }
    });
  }, []);

  /* ── Video init — ready as soon as first frame decoded (with safety net) ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let done = false;
    const onReady = () => {
      if (done) return;
      done = true;
      setIsLoaded(true);
      drawVideoFrame();
    };

    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("seeked", drawVideoFrame);
    video.addEventListener("error", onReady, { once: true });
    video.load();

    const fallback = setTimeout(onReady, 2500);

    return () => {
      clearTimeout(fallback);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("seeked", drawVideoFrame);
      video.removeEventListener("error", onReady);
    };
  }, [drawVideoFrame]);

  /* ── RAF scroll loop — scrubs video + drives scenes across the intro ─────── */
  useEffect(() => {
    if (!isLoaded) return;
    const video = videoRef.current;

    const tick = () => {
      const el = containerRef.current;
      if (el) {
        const rect     = el.getBoundingClientRect();
        const total    = Math.max(1, el.scrollHeight - window.innerHeight);
        const scrolled = Math.max(0, -rect.top);
        const targetP  = clamp01(scrolled / total);
        const prefersReduced = reducedMotionRef.current;
        const currentP = progressRef.current;
        const easedP   = prefersReduced
          ? targetP
          : currentP + (targetP - currentP) * SCROLL_SMOOTHING;
        const p        = Math.abs(targetP - easedP) < PROGRESS_EPSILON ? targetP : easedP;

        if (Math.abs(p - currentP) > PROGRESS_EPSILON) {
          progressRef.current = p;

          if (video && video.duration) {
            const targetTime = p * video.duration;
            if (Math.abs(video.currentTime - targetTime) > VIDEO_SEEK_EPSILON) {
              video.currentTime = targetTime;
            }
          }

          updateScenes(p);

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${p})`;
          }

          /* Fade the whole cinematic to the page background near the end so it
             blends into Part 2 — dark navy in dark mode, cream/white in light. */
          const exit = clamp01((p - 0.88) / 0.12);
          if (exitFadeRef.current) {
            exitFadeRef.current.style.opacity = String(exit);
          }
          /* Cross-dissolve the closing headline from white → theme foreground so
             it stays readable once the screen settles (black on white in light). */
          if (platformLightRef.current) platformLightRef.current.style.opacity = String(1 - exit);
          if (platformDarkRef.current)  platformDarkRef.current.style.opacity  = String(exit);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    updateScenes(0);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isLoaded, drawVideoFrame, updateScenes]);

  /* ── Ambient particle depth layer (pure 2D canvas, parallax by scroll) ──── */
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const w = () => canvas.width  || window.innerWidth;
    const h = () => canvas.height || window.innerHeight;

    const seed = () => {
      const arr = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const depth = i % 3;
        arr.push({
          x: Math.random() * w(),
          y: Math.random() * h(),
          r: 0.6 + depth * 0.9 + Math.random() * 0.8,
          depth,
          vy: -(0.06 + depth * 0.05 + Math.random() * 0.04),
          drift: (Math.random() - 0.5) * 0.12,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.10 + depth * 0.06 + Math.random() * 0.05,
        });
      }
      particlesRef.current = arr;
    };
    seed();

    const ctx = canvas.getContext("2d");
    let t = 0;

    const render = () => {
      const W = w(), H = h();
      ctx.clearRect(0, 0, W, H);
      const scroll = progressRef.current;

      for (const p of particlesRef.current) {
        if (!prefersReduced) {
          p.y += p.vy;
          p.x += p.drift + Math.sin(t * 0.0015 + p.phase) * 0.15;
        }
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        if (p.x < -6) p.x = W + 6;
        if (p.x > W + 6) p.x = -6;

        const parY = p.y - scroll * (18 + p.depth * 40);
        ctx.beginPath();
        ctx.arc(p.x, parY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha})`;
        ctx.shadowColor = "rgba(165, 180, 252, 0.5)";
        ctx.shadowBlur = p.depth * 3;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      t += 16;
      particleRafRef.current = requestAnimationFrame(render);
    };

    particleRafRef.current = requestAnimationFrame(render);
    return () => { if (particleRafRef.current) cancelAnimationFrame(particleRafRef.current); };
  }, [isLoaded]);

  /* ═══════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="bg-transparent">
      {/* Hidden video used as the frame source */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        preload="auto"
        muted
        playsInline
        crossOrigin="anonymous"
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, top: -9999 }}
        aria-hidden="true"
      />

      {/* Skeleton while the first video frame decodes */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "#04081a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.08)",
                borderTopColor: "rgba(255,255,255,0.45)",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════ PART 1 · CINEMATIC ANIMATION ════════════════ */}
      <div ref={containerRef} style={{ height: SCROLL_PX, position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

          {/* Video frame canvas */}
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            aria-hidden="true"
          />

          {/* Ambient particle depth layer */}
          <canvas
            ref={particleCanvasRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            aria-hidden="true"
          />

          {/* Cinematic darkening */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(160deg, rgba(4,8,26,0.60) 0%, rgba(4,8,26,0.30) 50%, rgba(4,8,26,0.66) 100%)",
            }}
          />

          {/* Scroll progress bar */}
          <div
            style={{ position: "absolute", top: 0, left: 0, height: 2, width: "100%", background: "rgba(255,255,255,0.06)", zIndex: 10 }}
            aria-hidden="true"
          >
            <div
              ref={progressBarRef}
              style={{
                height: "100%",
                width: "100%",
                transform: "scaleX(0)",
                transformOrigin: "left center",
                background: "linear-gradient(90deg, #34d399 0%, #60a5fa 100%)",
                willChange: "transform",
              }}
            />
          </div>

          {/* Scene dot indicators */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 6, zIndex: 10 }}
          >
            {STORY_SCENES.map((_, i) => (
              <div
                key={i}
                ref={el => { dotRefs.current[i] = el; }}
                style={{ width: 2, height: 14, borderRadius: 2, background: "rgba(255,255,255,0.2)", transition: "background 0.3s ease, transform 0.3s ease", transformOrigin: "center" }}
              />
            ))}
          </div>

          {/* Exit fade — blends the whole cinematic into the page background at the
              end of the animation (dark navy in dark mode, white/cream in light).
              Placed before the scenes so the closing headline renders on top of it. */}
          <div
            ref={exitFadeRef}
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, background: "hsl(var(--canvas))", opacity: 0, pointerEvents: "none" }}
          />

          {/* ── Narrative scenes ── */}

          {/* 1 · Arrival */}
          <div ref={sceneRefs.current.arrival} style={sceneStyle()}>
            <div className="text-center" style={{ maxWidth: 720, padding: "0 24px" }}>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/70 backdrop-blur-sm">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #10b981" }} aria-hidden="true" />
                  {t("home.kicker")}
                </span>
              </div>
              <h1 className="font-extrabold text-white" style={{ fontSize: "clamp(46px, 7vw, 82px)", letterSpacing: "-0.04em", lineHeight: 1.03, textShadow: "0 2px 48px rgba(0,0,0,0.85)" }}>
                Every school.
                <br />
                <span style={{ color: "rgba(255,255,255,0.52)" }}>Every item.</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.62)", maxWidth: 420, margin: "20px auto 0" }}>
                Your school's lost &amp; found — organized, searchable, and always available.
              </p>
              <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.3)" }}>
                Scroll to begin ↓
              </p>
            </div>
          </div>

          {/* 2 · Items get lost */}
          <div ref={sceneRefs.current.lost} style={sceneStyle()}>
            <div className="text-center" style={{ maxWidth: 640, padding: "0 24px" }}>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Every day
              </p>
              <h2 className="font-extrabold text-white" style={{ fontSize: "clamp(34px, 5vw, 64px)", letterSpacing: "-0.04em", lineHeight: 1.08, textShadow: "0 2px 30px rgba(0,0,0,0.75)" }}>
                Things go missing.
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 400, margin: "20px auto 0" }}>
                Phones, water bottles, calculators, jackets — left behind in hallways, gyms, and classrooms.
              </p>
            </div>
          </div>

          {/* 3 · The problem */}
          <div ref={sceneRefs.current.problem} style={sceneStyle()}>
            <div className="text-center" style={{ maxWidth: 640, padding: "0 24px" }}>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                The problem
              </p>
              <h2 className="font-extrabold text-white" style={{ fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.04em", lineHeight: 1.1, textShadow: "0 2px 30px rgba(0,0,0,0.75)" }}>
                Students lose things.
                <br />
                <span style={{ color: "rgba(255,255,255,0.48)" }}>Nobody knows where to look.</span>
              </h2>
            </div>
          </div>

          {/* 4 · Connection */}
          <div ref={sceneRefs.current.connect} style={sceneStyle()}>
            <div className="text-center" style={{ maxWidth: 700, padding: "0 24px" }}>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                The connection
              </p>
              <h2 className="font-extrabold text-white" style={{ fontSize: "clamp(46px, 7vw, 84px)", letterSpacing: "-0.04em", lineHeight: 1.03, textShadow: "0 2px 48px rgba(0,0,0,0.85)" }}>
                Lost.&nbsp;<span style={{ color: "#34d399" }}>Then</span>&nbsp;Found.
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 400, margin: "20px auto 0" }}>
                We bridge the gap between a student who lost something and the one who found it.
              </p>
            </div>
          </div>

          {/* 5 · Platform reveal — two stacked layers cross-dissolve from white
              (over the video) to theme-foreground (over the settled background). */}
          <div ref={sceneRefs.current.platform} style={sceneStyle()}>
            <div className="relative text-center" style={{ maxWidth: 720, padding: "0 24px" }}>
              {/* White layer — readable over the dark video during the animation */}
              <div ref={platformLightRef}>
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  The platform
                </p>
                <h2 className="mb-4 font-bold text-white" style={{ fontSize: "clamp(34px, 5vw, 62px)", letterSpacing: "-0.04em", lineHeight: 1.06, textShadow: "0 2px 40px rgba(0,0,0,0.8)" }}>
                  {hasTwoLines ? (<>{titleParts[0]}.<br />{titleParts[1]}</>) : t("home.title")}
                </h2>
                <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.58)", maxWidth: 420, margin: "0 auto" }}>
                  {t("home.subtitle")}
                </p>
                <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.32)" }}>
                  Continue ↓
                </p>
              </div>

              {/* Foreground layer — fades in as the screen settles (black in light) */}
              <div
                ref={platformDarkRef}
                aria-hidden="true"
                className="absolute inset-0"
                style={{ opacity: 0 }}
              >
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  The platform
                </p>
                <h2 className="mb-4 font-bold text-foreground" style={{ fontSize: "clamp(34px, 5vw, 62px)", letterSpacing: "-0.04em", lineHeight: 1.06 }}>
                  {hasTwoLines ? (<>{titleParts[0]}.<br />{titleParts[1]}</>) : t("home.title")}
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground" style={{ maxWidth: 420, margin: "0 auto" }}>
                  {t("home.subtitle")}
                </p>
                <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Continue ↓
                </p>
              </div>
            </div>
          </div>

          {/* Bottom fade into the functional homepage */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to top, hsl(var(--canvas)), transparent)" }}
          />
        </div>
      </div>

      {/* ════════════════ PART 2 · FUNCTIONAL HOMEPAGE ════════════════ */}
      <div className="home-section pb-16 sm:pb-24">
        <div className="space-y-20 pt-16 sm:space-y-24 sm:pt-20">

          {/* ── Search bar + lost/found actions ───────────── */}
          <motion.section
            aria-labelledby="search-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-60px" }}
            className="text-center"
          >
            <h2
              id="search-title"
              className="font-bold tracking-tight text-foreground"
              style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em" }}
            >
              {hasTwoLines ? (<>{titleParts[0]}. {titleParts[1]}</>) : t("home.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-[440px] text-base text-muted-foreground">
              {t("home.subtitle")}
            </p>

            {/* Search form — all original logic preserved */}
            <form
              onSubmit={handleHomeSearch}
              className="relative mx-auto mt-8 max-w-[560px]"
              role="search"
              aria-label={t("home.search_aria", "Search the found item inventory")}
            >
              <motion.div
                animate={{
                  boxShadow: searchFocused
                    ? "0 0 0 3px hsl(var(--ring) / 0.30), 0 4px 22px rgba(0,0,0,0.10)"
                    : "0 4px 22px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.05)",
                }}
                transition={{ duration: 0.15 }}
                className={`flex items-center overflow-hidden rounded-[13px] border-[1.5px] bg-card transition-colors ${searchFocused ? "border-ring" : "border-border"}`}
              >
                <Search className="ml-[18px] mr-[10px] h-[17px] w-[17px] shrink-0 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="h-auto flex-1 border-none bg-transparent py-[15px] text-[15.5px] font-medium text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                  placeholder={t("home.search_placeholder", "AirPods, water bottle, library…")}
                  aria-label={t("home.search_aria", "Search the found item inventory")}
                />
                <button
                  type="submit"
                  className="m-[5px] shrink-0 rounded-[9px] bg-primary px-[22px] py-[11px] text-[13.5px] font-bold tracking-[0.01em] text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
                >
                  {t("home.search_button", "Search")} →
                </button>
              </motion.div>
            </form>

            <p className="mt-[10px] text-[12.5px] font-medium text-muted-foreground">
              {t("home.search_help", "Try item type, brand, color, or where it was found")}
            </p>

            {/* Lost something / Found something */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}>
                <Link
                  to="/ReportLost"
                  className="flex items-center gap-[7px] rounded-[9px] border border-border bg-card px-[18px] py-[9px] text-[13.5px] font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  {t("home.cant_find_it", "I lost something")}
                </Link>
              </motion.div>

              <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}>
                <Link
                  to="/ReportFound"
                  className="flex items-center gap-[7px] rounded-[9px] border border-border bg-card px-[18px] py-[9px] text-[13.5px] font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  {t("home.found_something", "I found something")}
                </Link>
              </motion.div>
            </div>
          </motion.section>

          {/* Hairline divider */}
          <div className="h-px bg-border" aria-hidden="true" />

          {/* ── Report cards (File a report) ─────────────── */}
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
              <h2 id="home-report-title" className="text-xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
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
                description={t("home.lost_description", "Submit a lost-item report, keep the case active, and review suggested matches as new items come in.")}
                cta={t("home.submit_report", "Submit report")}
                tone="lost"
              />
              <ReportCard
                to="/ReportFound"
                icon={PlusCircle}
                title={t("home.found_something", "I found something")}
                description={t("home.found_description", "Create a moderated item record with photos and details so the owner can recognize it quickly.")}
                cta={t("home.submit_report", "Submit report")}
                tone="found"
              />
            </div>
          </motion.section>

          {/* ── Dashboard / project documentation ────────── */}
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
                        : <Shield   className="h-5 w-5 text-foreground" aria-hidden="true" />}
                    </div>
                    <div className="space-y-1.5">
                      <span className="evidence-chip">{t("home.dashboard_kicker", "Your account")}</span>
                      <h3 className="text-lg font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.015em" }}>
                        {user
                          ? t("home.my_dashboard_title", "My dashboard")
                          : t("footer.project_documentation", "Project documentation")}
                      </h3>
                      <p className="max-w-md text-sm leading-6 text-muted-foreground">
                        {user
                          ? t("home.my_dashboard_description", "View your submissions, claims, and notifications.")
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

          {/* ── Lost items showcase ───────────────────────── */}
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
              <Link to="/Search" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {SHOWCASE_ITEMS.map((item) => (
                <motion.div key={item.label} variants={staggerChildVariants}>
                  <motion.div whileHover={{ y: -4 }} transition={spring}>
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

          {/* ── How it works ─────────────────────────────── */}
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
                    <span className="font-black tracking-tighter text-border select-none" style={{ fontSize: "2rem", lineHeight: 1 }} aria-hidden="true">
                      {step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
}

/* ─── Cinematic scene helper ─────────────────────────────────────────────── */
function sceneStyle() {
  return {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    opacity: 0, pointerEvents: "none",
    willChange: "opacity, transform",
  };
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
          className={`flex h-full flex-col rounded-2xl border-[1.5px] p-7 transition-colors ${
            isLost
              ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
          }`}
        >
          <div
            className={`mb-[18px] flex h-11 w-11 items-center justify-center rounded-xl ${
              isLost ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
            }`}
          >
            <Icon
              className={isLost ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}
              style={{ width: 22, height: 22, strokeWidth: 1.5 }}
              aria-hidden="true"
            />
          </div>
          <h3 className="mb-2 text-[15.5px] font-bold text-foreground" style={{ letterSpacing: "-0.01em" }}>
            {title}
          </h3>
          <p className="mb-[22px] flex-1 text-[13px] leading-[1.6] text-muted-foreground">
            {description}
          </p>
          <span
            className={`flex items-center gap-[5px] text-[13px] font-bold ${
              isLost ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {cta}
            <ArrowRight style={{ width: 13, height: 13 }} aria-hidden="true" />
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
            <h3 className="text-[14.5px] font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
              {t("home.moderator_active_title", "Moderator Workspace Active")}
            </h3>
            <p className="mt-0.5 max-w-md text-[12.5px] text-white/40">
              {t("home.moderator_active_desc", "Review pending items, claims, and reports.")}
            </p>
          </div>
        </div>
        <Button
          asChild size="lg" variant="ghost"
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
