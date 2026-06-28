/**
 * ConstellationCanvas.jsx
 * --------------------------------------------------------------------------
 * A decorative full-bleed background canvas that renders a slowly drifting
 * field of white "stars". Nearby stars are joined by faint amber lines, and
 * each star gently pulses its opacity, producing a living "constellation"
 * effect. The canvas sizes itself to its parent, is purely decorative
 * (aria-hidden, pointer-events: none), and honors prefers-reduced-motion by
 * drawing a single static frame instead of animating.
 */

import { useEffect, useRef } from "react";

// ── Tunable constants ──────────────────────────────────────────────────────
const COUNT       = 40;    // number of stars
const CONNECT_R   = 80;    // max distance (px) at which two stars are linked
const R_MIN       = 0.8;   // smallest star radius (px)
const R_MAX       = 2.3;   // largest star radius (px)
const OP_MIN      = 0.05;  // dimmest star opacity (pulse floor)
const OP_MAX      = 0.50;  // brightest star opacity (pulse ceiling)

// Uniform random float in [a, b).
function randBetween(a, b) { return a + Math.random() * (b - a); }

// Create one star with randomized position, velocity, radius, opacity, and
// opacity-pulse direction. W/H are the current canvas dimensions.
function makeStar(W, H) {
  return {
    x:  randBetween(0, W),          // start anywhere in the canvas
    y:  randBetween(0, H),
    vx: randBetween(-0.12, 0.12),   // slow horizontal drift (px/frame)
    vy: randBetween(-0.08, 0.08),   // slow vertical drift (px/frame)
    r:  randBetween(R_MIN, R_MAX),  // dot radius
    op: randBetween(OP_MIN, OP_MAX),// current opacity (animated)
    va: Math.random() < 0.5 ? 0.008 : -0.008, // opacity velocity: random initial pulse direction
  };
}

export default function ConstellationCanvas() {
  const canvasRef = useRef(null); // ref to the <canvas> element

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Animation state held in the effect closure (not React state, to avoid
    // re-renders): canvas size, the star array, and the RAF handle.
    let W = 0, H = 0, stars = [], raf = null;

    // Sync the canvas backing-store size to the measured CSS size.
    const resize = (w, h) => {
      W = w; H = h;
      canvas.width  = W;
      canvas.height = H;
    };

    // Track the parent's size; on each change, resize and regenerate the stars
    // so they're distributed across the new dimensions.
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      resize(width, height);
      stars = Array.from({ length: COUNT }, () => makeStar(W, H));
    });
    ro.observe(canvas.parentElement);

    /* ── Reduced-motion: static snapshot, no RAF ── */
    // If the user prefers reduced motion, draw a single non-animated frame of
    // stars (no connection lines, no looping) and bail out of the render loop.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const drawStatic = () => {
        // Wait (via RAF) until the ResizeObserver has reported a real size.
        if (!W || !H) { requestAnimationFrame(drawStatic); return; }
        stars = Array.from({ length: COUNT }, () => makeStar(W, H));
        ctx.clearRect(0, 0, W, H);
        for (const s of stars) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${s.op})`;
          ctx.fill();
        }
      };
      requestAnimationFrame(drawStatic);
      return () => ro.disconnect();
    }

    /* ── Full animation loop ── */
    // Called once per frame: clear, draw connection lines, then draw + advance
    // each star. Re-schedules itself via requestAnimationFrame.
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!W || !H) return; // skip until we have a measured size

      ctx.clearRect(0, 0, W, H); // wipe the previous frame

      /* Connection lines — drawn first so they appear under stars */
      ctx.lineWidth = 0.6;
      // O(n^2) over unique star pairs (j starts at i+1 to avoid duplicates).
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j];
          // Euclidean distance between the two stars.
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_R) {
            // Line opacity: fades linearly from full to 0 as dist → CONNECT_R
            // (the 0.3 - dist/CONNECT_R*0.3 term), scaled by the dimmer of the
            // two stars' opacities (×2) so links track the stars' pulsing.
            const lineOp = (0.3 - (dist / CONNECT_R) * 0.3) * Math.min(a.op, b.op) * 2;
            if (lineOp > 0) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(232,160,48,${lineOp.toFixed(3)})`;
              ctx.stroke();
            }
          }
        }
      }

      /* Stars */
      for (const s of stars) {
        // Draw the star as a filled white circle at its current opacity.
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.op.toFixed(3)})`;
        ctx.fill();

        /* Update position */
        s.x += s.vx; s.y += s.vy; // integrate velocity

        /* Wrap edges */
        // Teleport a star to the opposite edge when it drifts off-canvas,
        // giving an endless seamless field.
        if (s.x < 0)  s.x = W;
        if (s.x > W)  s.x = 0;
        if (s.y < 0)  s.y = H;
        if (s.y > H)  s.y = 0;

        /* Pulse opacity */
        // Advance opacity by its velocity, then bounce at the OP_MIN/OP_MAX
        // bounds (flip the sign) to create a smooth twinkle.
        s.op += s.va;
        if (s.op >= OP_MAX) { s.op = OP_MAX; s.va = -Math.abs(s.va); }
        if (s.op <= OP_MIN) { s.op = OP_MIN; s.va =  Math.abs(s.va); }
      }
    };

    raf = requestAnimationFrame(tick); // start the loop

    // Cleanup on unmount: stop the loop and disconnect the observer.
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    // Absolutely-positioned, non-interactive decorative layer (z-index 0).
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
