/**
 * FloatingItemsCanvas.jsx
 * --------------------------------------------------------------------------
 * A decorative background canvas that floats outline drawings of common
 * lost-and-found items (AirPods, keys, water bottle, calculator, sunglasses,
 * backpack, hoodie) drifting gently upward. The items react to the mouse:
 * the cursor repels nearby items, which then spring back to their base drift.
 * Items bounce off the canvas edges rather than wrapping. Decorative only
 * (aria-hidden, pointer-events: none) and disabled under prefers-reduced-motion.
 *
 * Each draw function below renders one item as a stroked (outline) glyph,
 * centered at (x, y) and scaled by `s` (roughly the glyph's bounding size in
 * px). All coordinates are expressed as fractions of `s` so the icons scale
 * uniformly. The caller sets translate/rotate/strokeStyle before calling.
 */

import { useEffect, useRef } from "react";

/* ── Icon drawing functions ──────────────────────────────────────────────── */

// AirPods case: a rounded-rectangle body with a small circular button/seam.
function drawAirpods(ctx, x, y, s) {
  const w = s * 0.55, h = s * 0.72, r = s * 0.14;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + r, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r);
  ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r);
  ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + s * 0.08, s * 0.14, 0, Math.PI * 2);
  ctx.stroke();
}

// Key: a circular bow (head ring) on the left, a long shaft to the right,
// and two short teeth hanging off the shaft's end.
function drawKey(ctx, x, y, s) {
  const hr = s * 0.22; // head (bow) radius
  ctx.beginPath();
  ctx.arc(x - s * 0.18, y, hr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.18 + hr, y);
  ctx.lineTo(x + s * 0.42, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.20, y); ctx.lineTo(x + s * 0.20, y + s * 0.14);
  ctx.moveTo(x + s * 0.34, y); ctx.lineTo(x + s * 0.34, y + s * 0.10);
  ctx.stroke();
}

// Water bottle: a tall rounded-rectangle body with a small rectangular cap on top.
function drawBottle(ctx, x, y, s) {
  const bw = s * 0.30, bh = s * 0.68, br = s * 0.08; // body width/height/corner-radius
  ctx.beginPath();
  ctx.moveTo(x - bw / 2 + br, y - bh / 2 + s * 0.12);
  ctx.arcTo(x + bw / 2, y - bh / 2 + s * 0.12, x + bw / 2, y + bh / 2, br);
  ctx.arcTo(x + bw / 2, y + bh / 2, x - bw / 2, y + bh / 2, br);
  ctx.arcTo(x - bw / 2, y + bh / 2, x - bw / 2, y - bh / 2 + s * 0.12, br);
  ctx.lineTo(x - bw / 2, y - bh / 2 + s * 0.12);
  ctx.stroke();
  const cw = bw * 0.55, ch = s * 0.14;
  ctx.beginPath();
  ctx.rect(x - cw / 2, y - bh / 2 + s * 0.12 - ch, cw, ch);
  ctx.stroke();
}

// Calculator: a rounded-rectangle body with a 3x3 grid of small circular buttons.
function drawCalculator(ctx, x, y, s) {
  const w = s * 0.48, h = s * 0.62, r = s * 0.07; // body width/height/corner-radius
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + r, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r);
  ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r);
  ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r);
  ctx.closePath();
  ctx.stroke();
  // 3x3 button grid: (col-1)/(row-1) center the grid on (x, y + small offset).
  const gap = s * 0.13;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      ctx.beginPath();
      ctx.arc(x + (col - 1) * gap, y + s * 0.06 + (row - 1) * gap, s * 0.035, 0, Math.PI * 2);
      ctx.stroke();
    }
}

// Sunglasses: two circular lenses, a bridge line between them, and two arms
// angling outward from the outer edges.
function drawSunglasses(ctx, x, y, s) {
  const lr = s * 0.20; // lens radius
  ctx.beginPath(); ctx.arc(x - s * 0.26, y, lr, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + s * 0.26, y, lr, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.26 + lr, y); ctx.lineTo(x + s * 0.26 - lr, y); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.26 - lr, y); ctx.lineTo(x - s * 0.52, y + s * 0.06); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.26 + lr, y); ctx.lineTo(x + s * 0.52, y + s * 0.06); ctx.stroke();
}

// Backpack: a rounded-rectangle body, a top carry-handle arc, and a front pocket.
function drawBackpack(ctx, x, y, s) {
  const bw = s * 0.52, bh = s * 0.64, br = s * 0.10; // body width/height/corner-radius
  ctx.beginPath();
  ctx.moveTo(x - bw / 2 + br, y - bh / 2);
  ctx.arcTo(x + bw / 2, y - bh / 2, x + bw / 2, y + bh / 2, br);
  ctx.arcTo(x + bw / 2, y + bh / 2, x - bw / 2, y + bh / 2, br);
  ctx.arcTo(x - bw / 2, y + bh / 2, x - bw / 2, y - bh / 2, br);
  ctx.arcTo(x - bw / 2, y - bh / 2, x + bw / 2, y - bh / 2, br);
  ctx.closePath(); ctx.stroke();
  // Carry handle: half-circle arc on top of the body.
  ctx.beginPath(); ctx.arc(x, y - bh / 2, s * 0.13, Math.PI, 0); ctx.stroke();
  // Front pocket: rounded rectangle near the bottom of the body.
  const pw = bw * 0.56, ph = bh * 0.30; // pocket width/height
  ctx.beginPath();
  ctx.roundRect(x - pw / 2, y + bh / 2 - ph - s * 0.06, pw, ph, s * 0.05);
  ctx.stroke();
}

// Hoodie: an outlined shirt silhouette (shoulders → body) with a hood arc at
// the neck and a rounded front pocket.
function drawHoodie(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.32, y - s * 0.20);
  ctx.lineTo(x - s * 0.42, y - s * 0.10);
  ctx.lineTo(x - s * 0.38, y + s * 0.36);
  ctx.lineTo(x + s * 0.38, y + s * 0.36);
  ctx.lineTo(x + s * 0.42, y - s * 0.10);
  ctx.lineTo(x + s * 0.32, y - s * 0.20);
  ctx.lineTo(x + s * 0.14, y - s * 0.30);
  ctx.arc(x, y - s * 0.32, s * 0.16, 0, Math.PI, true);
  ctx.lineTo(x - s * 0.32, y - s * 0.20);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - s * 0.20, y + s * 0.04, s * 0.40, s * 0.18, s * 0.04);
  ctx.stroke();
}

// Parallel arrays: DRAW_FNS[i] is rendered using STROKE_COLORS[i]. A particle's
// `icon` field indexes into both. Colors alternate white and amber at varying alphas.
const DRAW_FNS = [drawAirpods, drawKey, drawBottle, drawCalculator, drawSunglasses, drawBackpack, drawHoodie];
const STROKE_COLORS = [
  "rgba(255,255,255,0.55)", "rgba(232,160,48,0.60)", "rgba(255,255,255,0.42)",
  "rgba(255,255,255,0.38)", "rgba(232,160,48,0.50)", "rgba(255,255,255,0.36)", "rgba(255,255,255,0.32)",
];

// ── Physics tunables ───────────────────────────────────────────────────────
const REPEL_RADIUS   = 110;   // cursor influence radius (px)
const REPEL_STRENGTH = 2.8;   // gentler push
const SPRING         = 0.04;  // how strongly velocity is pulled back to base drift (0..1)
const MAX_SPEED      = 5;     // tight cap keeps things tidy
const PADDING        = 20;    // min distance from canvas edges (boundary)

// Uniform random float in [a, b).
function randBetween(a, b) { return a + Math.random() * (b - a); }

// Create one floating item. It stores both its current velocity (vx/vy) and its
// "base drift" velocity (bvx/bvy) which the spring force restores it toward.
function makeParticle(W, H) {
  const bvx = randBetween(-0.12, 0.12);   // base horizontal drift (slow, either way)
  const bvy = randBetween(-0.18, -0.03);  // base vertical drift (negative = upward)
  return {
    x: randBetween(PADDING, W - PADDING),  // start inside the padded bounds
    y: randBetween(PADDING, H - PADDING),
    vx: bvx, vy: bvy, bvx, bvy,            // current velocity initialized to base drift
    scale:   randBetween(32, 62),          // icon size in px
    opacity: randBetween(0.08, 0.26),      // per-item alpha (faint)
    icon:    Math.floor(Math.random() * DRAW_FNS.length), // which glyph/color to use
    rot:     randBetween(0, Math.PI * 2),  // initial rotation (radians)
    rotV:    randBetween(-0.0025, 0.0025), // rotation speed (radians/frame)
  };
}

// Props:
//   count - number of floating items to spawn (default 22).
export default function FloatingItemsCanvas({ count = 22 }) {
  const canvasRef = useRef(null);
  // Latest mouse position in canvas-local coords; off-screen sentinel when idle.
  const mouseRef  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    // Respect reduced-motion: render nothing and skip all animation/listeners.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Closure-scoped animation state: size, particle array, RAF handle.
    let W = 0, H = 0, particles = [], raf = null;

    // Match the canvas backing store to the parent element's pixel size.
    const resize = () => {
      const parent = canvas.parentElement;
      W = parent ? parent.offsetWidth  : window.innerWidth;
      H = parent ? parent.offsetHeight : window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };

    // Size the canvas, then create `count` randomized particles.
    const init = () => { resize(); particles = Array.from({ length: count }, () => makeParticle(W, H)); };

    // Convert page mouse coords to canvas-local coords (subtract canvas origin).
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    // When the cursor leaves the window, park it far off-screen so it repels nothing.
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", resize);

    // Per-frame update: draw each particle, then apply repulsion → spring →
    // speed cap → integration → edge bounce.
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.x, my = mouseRef.current.y; // current cursor

      for (const p of particles) {
        /* Draw */
        // Use save/restore so the translate+rotate transform and style settings
        // don't leak into the next particle. Draw the glyph at the origin after
        // translating to (x, y) and rotating by `rot`.
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.lineWidth   = 1.2;
        ctx.strokeStyle = STROKE_COLORS[p.icon];
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        DRAW_FNS[p.icon](ctx, 0, 0, p.scale);
        ctx.restore();

        /* Repulsion */
        // Vector from cursor to particle; if within REPEL_RADIUS, push the
        // particle away. Force scales linearly from full (at the cursor) to 0
        // (at the radius edge); (dx/dist, dy/dist) is the unit push direction.
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.5) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        /* Spring toward base drift */
        // Ease current velocity back toward the base drift each frame so items
        // recover their lazy float after being pushed (critically-damped feel).
        p.vx += (p.bvx - p.vx) * SPRING;
        p.vy += (p.bvy - p.vy) * SPRING;

        /* Speed cap */
        // Clamp the velocity magnitude to MAX_SPEED (rescale the vector if over).
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > MAX_SPEED) { p.vx = p.vx / spd * MAX_SPEED; p.vy = p.vy / spd * MAX_SPEED; }

        /* Integrate */
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; // advance position and rotation

        /* ── Boundary: bounce off canvas edges instead of wrapping ── */
        // `half` approximates the glyph's half-extent so it bounces at its edge,
        // not its center. On each wall we clamp the position back inside and
        // flip BOTH the current velocity and the base drift toward the interior,
        // so the particle keeps heading inward afterward.
        const half = p.scale * 0.6;
        if (p.x - half < PADDING)    { p.x = PADDING + half;    p.vx =  Math.abs(p.vx); p.bvx = Math.abs(p.bvx); }
        if (p.x + half > W - PADDING){ p.x = W - PADDING - half; p.vx = -Math.abs(p.vx); p.bvx = -Math.abs(p.bvx); }
        if (p.y - half < PADDING)    { p.y = PADDING + half;    p.vy =  Math.abs(p.vy); p.bvy = Math.abs(p.bvy); }
        if (p.y + half > H - PADDING){ p.y = H - PADDING - half; p.vy = -Math.abs(p.vy); p.bvy = -Math.abs(p.bvy); }
      }

      raf = requestAnimationFrame(tick); // schedule next frame
    };

    init();
    raf = requestAnimationFrame(tick); // start the loop

    // Cleanup: stop the loop and remove all window listeners on unmount/count change.
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    // Absolutely-positioned, non-interactive decorative layer (z-index 0).
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}
