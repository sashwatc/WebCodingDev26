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
  FileText, MapPin, Package, PlusCircle, Search, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { isPublicFoundItemStatus } from "@/lib/found-items";
import { getPrimaryRecordPhoto } from "@/lib/media";
import { staggerChildVariants, staggerContainerProps } from "@/lib/motion";

/* ─── Data ──────────────────────────────────────────────────────────────── */
// Formats a date into a short relative label ("Today" / "Yesterday" / "Nd ago")
// used on the recently-found marquee cards.
function daysAgoLabel(dateStr) {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "";
  const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// Three "how it works" steps rendered as cards in Part 2 of the page.
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

// Tuning constants for the cinematic intro:
const VIDEO_SRC      = "/videos/cinematic.mp4";      // background video scrubbed by scroll
const SCROLL_PX      = `${STORY_SCENES.length * 100}vh`; // total scrollable height of the intro
const PARTICLE_COUNT = 46;                           // ambient depth particles
const SCROLL_SMOOTHING = 0.14;                       // lerp factor toward target scroll progress
const PROGRESS_EPSILON = 0.0002;                     // min progress delta worth re-rendering
const VIDEO_SEEK_EPSILON = 0.045;                    // min video time delta worth re-seeking

/* ─── Framer Motion (functional sections) ───────────────────────────────── */
const spring = { type: "spring", stiffness: 380, damping: 22 };

// Clamp a value into the 0..1 range (used throughout the scroll math).
const clamp01 = (value) => Math.max(0, Math.min(1, value));

/* ═══════════════════════════════ Page ══════════════════════════════════ */
export default function Home() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoadingAuth } = useAuth();

  // Real "recently found" inventory for the marquee (same source as Search).
  const { data: recentRaw = [], isLoading: recentLoading } = useQuery({
    queryKey: ["homeRecentFound"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 12),
    enabled: !!user,
    staleTime: 60_000,
  });
  // Keep only publicly visible found items (exclude lost reports/non-public statuses).
  const recentFound = recentRaw.filter((it) => it.record_type !== "lost" && isPublicFoundItemStatus(it.status));

  /* refs — cinematic
     Imperatively-driven DOM/canvas refs so the scroll animation can mutate
     styles directly each frame without triggering React re-renders. */
  const containerRef      = useRef(null);
  const canvasRef         = useRef(null);
  const particleCanvasRef = useRef(null);
  const particlesRef      = useRef([]);
  const particleRafRef    = useRef(null);
  const videoRef          = useRef(null);
  const framesRef         = useRef([]);     // pre-decoded ImageBitmap frames
  const framesReadyRef    = useRef(false);  // true once baking completes
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

  /* state
     isLoaded -> first video frame decoded (hides the loading skeleton);
     homeSearch -> the hero search input value;
     searchFocused -> drives the search box focus ring animation. */
  const [isLoaded,      setIsLoaded]      = useState(false);
  const [homeSearch,    setHomeSearch]    = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Split the localized title on ". " so it can render across two lines.
  const titleParts = t("home.title").split(". ");
  const hasTwoLines = titleParts.length === 2;

  // Submit the hero search: navigate to /Search with the trimmed query (if any).
  const handleHomeSearch = (e) => {
    e.preventDefault();
    const q = homeSearch.trim();
    navigate(q ? `/Search?q=${encodeURIComponent(q)}` : "/Search");
  };

  // Track the reduced-motion preference in a ref the RAF loop reads each frame.
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
      drawFrame(progressRef.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // eslint-disable-line

  /* ── Draw the frame for a scroll progress (cover-fill) ──────────────────────
     Prefers a pre-decoded bitmap (instant); falls back to the live video
     element until baking completes. */
  const drawFrame = useCallback((p) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let src, sw0, sh0;
    if (framesReadyRef.current && framesRef.current.length) {
      const frames = framesRef.current;
      const idx = Math.min(frames.length - 1, Math.max(0, Math.round(p * (frames.length - 1))));
      src = frames[idx]; sw0 = src.width; sh0 = src.height;
    } else {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      src = video; sw0 = video.videoWidth; sh0 = video.videoHeight;
    }
    if (!sw0 || !sh0) return;

    const ctx = canvas.getContext("2d");
    const cw = canvas.width, ch = canvas.height;
    const va = sw0 / sh0, ca = cw / ch;
    let sx, sy, sw, sh;
    if (va > ca) { sh = sh0; sw = sh * ca; sx = (sw0 - sw) / 2; sy = 0; }
    else         { sw = sw0; sh = sw / ca; sx = 0; sy = (sh0 - sh) / 2; }

    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, cw, ch);
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
      drawFrame(progressRef.current);
    };
    const redraw = () => { if (!framesReadyRef.current) drawFrame(progressRef.current); };

    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("seeked", redraw);
    video.addEventListener("error", onReady, { once: true });
    video.load();

    const fallback = setTimeout(onReady, 2500);

    return () => {
      clearTimeout(fallback);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("seeked", redraw);
      video.removeEventListener("error", onReady);
    };
  }, [drawFrame]);

  /* ── Background frame baking ────────────────────────────────────────────────
     Decode N frames into ImageBitmaps off-thread using a dedicated offscreen
     video, so scroll scrubbing becomes instant (no per-frame video seeking).
     Runs in the background; the live video handles scrubbing until this is done. */
  useEffect(() => {
    let cancelled = false;
    const N = 64;
    const ex = document.createElement("video");
    ex.src = VIDEO_SRC;
    ex.muted = true;
    ex.playsInline = true;
    ex.preload = "auto";
    ex.crossOrigin = "anonymous";

    const off = document.createElement("canvas");
    let octx;

    const bake = async () => {
      const scale = 1.5; // ~2/3 resolution keeps bitmaps light but crisp
      off.width  = Math.max(2, Math.round(ex.videoWidth  / scale));
      off.height = Math.max(2, Math.round(ex.videoHeight / scale));
      octx = off.getContext("2d");

      const frames = [];
      for (let i = 0; i < N; i++) {
        if (cancelled) return;
        ex.currentTime = (i / (N - 1)) * (ex.duration || 0);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => {
          const done = () => { ex.removeEventListener("seeked", done); res(); };
          ex.addEventListener("seeked", done);
        });
        if (cancelled) return;
        octx.drawImage(ex, 0, 0, off.width, off.height);
        try {
          // eslint-disable-next-line no-await-in-loop
          frames.push(await createImageBitmap(off));
        } catch {
          return; // bitmap unsupported → keep live-video fallback
        }
      }
      if (cancelled) return;
      framesRef.current = frames;
      framesReadyRef.current = true;
      drawFrame(progressRef.current); // repaint crisp immediately
    };

    ex.addEventListener("loadedmetadata", bake, { once: true });
    ex.load();

    return () => {
      cancelled = true;
      framesReadyRef.current = false;
      framesRef.current.forEach((b) => b.close && b.close());
      framesRef.current = [];
      ex.removeAttribute("src");
      ex.load();
    };
  }, [drawFrame]);

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

          /* Once frames are baked, draw the bitmap directly (instant, smooth).
             Until then, fall back to seeking the live video. */
          if (framesReadyRef.current) {
            drawFrame(p);
          } else {
            if (video && video.duration) {
              const targetTime = p * video.duration;
              if (Math.abs(video.currentTime - targetTime) > VIDEO_SEEK_EPSILON) {
                video.currentTime = targetTime;
              }
            }
            drawFrame(p);
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
  }, [isLoaded, drawFrame, updateScenes]);

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
        ctx.fill();
      }
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
              (over the video) to theme-foreground (over the settled background).
              Search form lives here so it's visually adjacent to the title. */}
          <div ref={sceneRefs.current.platform} style={sceneStyle()}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="text-center w-full" style={{ maxWidth: 600, padding: "0 24px" }}>

              {/* Title block: the two cross-dissolve layers are constrained here */}
              <div className="relative" style={{ marginBottom: 32 }}>
                {/* White layer — readable over dark video */}
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
                </div>
                {/* Foreground layer — fades in as screen settles to page bg */}
                <div
                  ref={platformDarkRef}
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ opacity: 0, pointerEvents: "none" }}
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
                </div>
              </div>

              {/* Search form — right below the title */}
              <form
                onSubmit={handleHomeSearch}
                className="relative mx-auto"
                style={{ maxWidth: 520 }}
                role="search"
                aria-label={t("home.search_aria", "Search the found item inventory")}
              >
                <motion.div
                  animate={{ boxShadow: searchFocused ? "0 0 0 3px hsl(var(--ring) / 0.30), 0 4px 22px rgba(0,0,0,0.18)" : "0 4px 20px rgba(0,0,0,0.18)" }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-center overflow-hidden rounded-[13px] border-[1.5px] bg-card transition-colors ${searchFocused ? "border-ring" : "border-border"}`}
                >
                  <Search className="ml-[18px] mr-[10px] h-[17px] w-[17px] shrink-0 text-muted-foreground" aria-hidden="true" />
                  <input
                    value={homeSearch}
                    onChange={(e) => setHomeSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={t("home.search_placeholder", "AirPods, water bottle, library…")}
                    aria-label={t("home.search_aria", "Search the found item inventory")}
                    className="h-auto flex-1 border-none bg-transparent py-[15px] text-[15.5px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button type="submit" className="m-[5px] shrink-0 rounded-[9px] bg-primary px-[22px] py-[11px] text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80">
                    {t("home.search_button", "Search")} →
                  </button>
                </motion.div>
              </form>
              <p className="mt-2.5 text-[12.5px] font-medium text-muted-foreground">
                {t("home.search_help", "Try item type, brand, color, or where it was found")}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <Link to="/ReportLost" className="flex items-center gap-[7px] rounded-[9px] border border-border bg-card px-[18px] py-[9px] text-[13.5px] font-semibold text-foreground transition-colors hover:bg-muted">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  {t("home.cant_find_it", "I lost something")}
                </Link>
                <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
                <Link to="/ReportFound" className="flex items-center gap-[7px] rounded-[9px] border border-border bg-card px-[18px] py-[9px] text-[13.5px] font-semibold text-foreground transition-colors hover:bg-muted">
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  {t("home.found_something", "I found something")}
                </Link>
              </div>

            </div>{/* /600px block */}

            {/* ── Recently found marquee — full-width, directly below the buttons ── */}
            {user && (
              <div style={{ width: "100%", marginTop: 28, background: "#0b1628", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, paddingBottom: 20, overflow: "hidden" }}>
                {/* Header */}
                <div className="page-shell mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold" style={{ color: "#fff", letterSpacing: "-0.02em" }}>{t("home.recently_found_title")}</h2>
                      <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{t("home.recently_found_helper")}</p>
                    </div>
                    <Link to="/Search" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                    >
                      {t("home.view_all_found")} <ArrowRight style={{ width: 12, height: 12 }} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                {/* Marquee track */}
                <div style={{ overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, background: "linear-gradient(to right, #0b1628 0%, transparent 8%, transparent 92%, #0b1628 100%)" }} aria-hidden="true" />
                  {recentLoading ? (
                    <div className="page-shell" style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, padding: "8px 0" }}>
                      {t("home.loading_recent")}
                    </div>
                  ) : recentFound.length === 0 ? (
                    <div className="page-shell" style={{ fontSize: 12.5, padding: "8px 0" }}>
                      <Link to="/ReportFound" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <PlusCircle style={{ width: 14, height: 14 }} aria-hidden="true" /> {t("home.submit_report")}
                      </Link>
                    </div>
                  ) : (
                  <div className="marquee-track" style={{ display: "flex", gap: 12, width: "max-content" }}>
                    {/* Repeat the item list enough times to fill a seamless scrolling marquee */}
                    {Array(Math.max(2, Math.ceil(8 / recentFound.length))).fill(null).flatMap(() => recentFound).map((item, i) => (
                      <Link key={`${item.id}-${i}`} to={`/ItemDetails?id=${encodeURIComponent(item.id)}`} aria-label={`${item.title}${item.location_found ? `, ${item.location_found}` : ""}`}
                        style={{ display: "flex", flexDirection: "column", width: 160, borderRadius: 11, overflow: "hidden", background: "#111e30", border: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, textDecoration: "none", transition: "border-color 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                      >
                        <div style={{ width: 160, height: 120, background: "linear-gradient(135deg, #0f1f35 0%, #1a2f4a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {getPrimaryRecordPhoto(item) ? (
                            <img src={getPrimaryRecordPhoto(item)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <Package style={{ width: 28, height: 28, color: "rgba(255,255,255,0.12)" }} aria-hidden="true" />
                          )}
                        </div>
                        <div style={{ padding: "10px 12px" }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                            <MapPin style={{ width: 10, height: 10, color: "rgba(255,255,255,0.32)", flexShrink: 0 }} aria-hidden="true" />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{item.location_found || t("common.unknown_location")}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock style={{ width: 10, height: 10, color: "rgba(255,255,255,0.32)", flexShrink: 0 }} aria-hidden="true" />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>{daysAgoLabel(item.created_date)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            )}

            </div>{/* /full-width column */}
          </div>

          {/* Bottom fade into the functional homepage */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to top, hsl(var(--canvas)), transparent)" }}
          />
        </div>
      </div>

      {/* ════════════════ PART 2 · FUNCTIONAL HOMEPAGE ════════════════ */}
      <div>

        {/* marquee moved into the cinematic platform scene */}

        {/* ── How it works + Docs ──────────────────────────────────── */}
        <div className="home-section pb-20">
          <div className="space-y-14 pt-10">

            {/* ── Dashboard / project documentation (placed above How it works) */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-40px" }}
            >
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
            </motion.section>

            {/* ── How it works */}
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
    </div>
  );
}

/* ─── Cinematic scene helper ─────────────────────────────────────────────── */
// Shared base style for each narrative scene: a full-bleed centered overlay that
// starts hidden (opacity 0). The scroll loop animates opacity/transform per scene.
function sceneStyle() {
  return {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    opacity: 0, pointerEvents: "none",
    willChange: "opacity, transform",
  };
}

