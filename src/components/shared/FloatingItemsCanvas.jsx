import { useEffect, useRef } from "react";

/* ── Icon drawing functions ──────────────────────────────────────────────── */

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

function drawKey(ctx, x, y, s) {
  const hr = s * 0.22;
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

function drawBottle(ctx, x, y, s) {
  const bw = s * 0.30, bh = s * 0.68, br = s * 0.08;
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

function drawCalculator(ctx, x, y, s) {
  const w = s * 0.48, h = s * 0.62, r = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + r, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r);
  ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r);
  ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r);
  ctx.closePath();
  ctx.stroke();
  const gap = s * 0.13;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      ctx.beginPath();
      ctx.arc(x + (col - 1) * gap, y + s * 0.06 + (row - 1) * gap, s * 0.035, 0, Math.PI * 2);
      ctx.stroke();
    }
}

function drawSunglasses(ctx, x, y, s) {
  const lr = s * 0.20;
  ctx.beginPath(); ctx.arc(x - s * 0.26, y, lr, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + s * 0.26, y, lr, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.26 + lr, y); ctx.lineTo(x + s * 0.26 - lr, y); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.26 - lr, y); ctx.lineTo(x - s * 0.52, y + s * 0.06); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.26 + lr, y); ctx.lineTo(x + s * 0.52, y + s * 0.06); ctx.stroke();
}

function drawBackpack(ctx, x, y, s) {
  const bw = s * 0.52, bh = s * 0.64, br = s * 0.10;
  ctx.beginPath();
  ctx.moveTo(x - bw / 2 + br, y - bh / 2);
  ctx.arcTo(x + bw / 2, y - bh / 2, x + bw / 2, y + bh / 2, br);
  ctx.arcTo(x + bw / 2, y + bh / 2, x - bw / 2, y + bh / 2, br);
  ctx.arcTo(x - bw / 2, y + bh / 2, x - bw / 2, y - bh / 2, br);
  ctx.arcTo(x - bw / 2, y - bh / 2, x + bw / 2, y - bh / 2, br);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - bh / 2, s * 0.13, Math.PI, 0); ctx.stroke();
  const pw = bw * 0.56, ph = bh * 0.30;
  ctx.beginPath();
  ctx.roundRect(x - pw / 2, y + bh / 2 - ph - s * 0.06, pw, ph, s * 0.05);
  ctx.stroke();
}

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

const DRAW_FNS = [drawAirpods, drawKey, drawBottle, drawCalculator, drawSunglasses, drawBackpack, drawHoodie];
const STROKE_COLORS = [
  "rgba(255,255,255,0.55)", "rgba(232,160,48,0.60)", "rgba(255,255,255,0.42)",
  "rgba(255,255,255,0.38)", "rgba(232,160,48,0.50)", "rgba(255,255,255,0.36)", "rgba(255,255,255,0.32)",
];

const REPEL_RADIUS   = 110;
const REPEL_STRENGTH = 2.8;   // gentler push
const SPRING         = 0.04;
const MAX_SPEED      = 5;     // tight cap keeps things tidy
const PADDING        = 20;    // min distance from canvas edges (boundary)

function randBetween(a, b) { return a + Math.random() * (b - a); }

function makeParticle(W, H) {
  const bvx = randBetween(-0.12, 0.12);
  const bvy = randBetween(-0.18, -0.03);
  return {
    x: randBetween(PADDING, W - PADDING),
    y: randBetween(PADDING, H - PADDING),
    vx: bvx, vy: bvy, bvx, bvy,
    scale:   randBetween(32, 62),
    opacity: randBetween(0.08, 0.26),
    icon:    Math.floor(Math.random() * DRAW_FNS.length),
    rot:     randBetween(0, Math.PI * 2),
    rotV:    randBetween(-0.0025, 0.0025),
  };
}

export default function FloatingItemsCanvas({ count = 22 }) {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, particles = [], raf = null;

    const resize = () => {
      const parent = canvas.parentElement;
      W = parent ? parent.offsetWidth  : window.innerWidth;
      H = parent ? parent.offsetHeight : window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };

    const init = () => { resize(); particles = Array.from({ length: count }, () => makeParticle(W, H)); };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      for (const p of particles) {
        /* Draw */
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.lineWidth   = 1.2;
        ctx.strokeStyle = STROKE_COLORS[p.icon];
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        DRAW_FNS[p.icon](ctx, 0, 0, p.scale);
        ctx.restore();

        /* Repulsion */
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.5) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        /* Spring toward base drift */
        p.vx += (p.bvx - p.vx) * SPRING;
        p.vy += (p.bvy - p.vy) * SPRING;

        /* Speed cap */
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > MAX_SPEED) { p.vx = p.vx / spd * MAX_SPEED; p.vy = p.vy / spd * MAX_SPEED; }

        /* Integrate */
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;

        /* ── Boundary: bounce off canvas edges instead of wrapping ── */
        const half = p.scale * 0.6;
        if (p.x - half < PADDING)    { p.x = PADDING + half;    p.vx =  Math.abs(p.vx); p.bvx = Math.abs(p.bvx); }
        if (p.x + half > W - PADDING){ p.x = W - PADDING - half; p.vx = -Math.abs(p.vx); p.bvx = -Math.abs(p.bvx); }
        if (p.y - half < PADDING)    { p.y = PADDING + half;    p.vy =  Math.abs(p.vy); p.bvy = Math.abs(p.bvy); }
        if (p.y + half > H - PADDING){ p.y = H - PADDING - half; p.vy = -Math.abs(p.vy); p.bvy = -Math.abs(p.bvy); }
      }

      raf = requestAnimationFrame(tick);
    };

    init();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}
