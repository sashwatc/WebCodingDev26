import { useEffect, useRef } from "react";

const COUNT       = 40;
const CONNECT_R   = 80;    // max distance for connection lines
const R_MIN       = 0.8;
const R_MAX       = 2.3;
const OP_MIN      = 0.05;
const OP_MAX      = 0.50;

function randBetween(a, b) { return a + Math.random() * (b - a); }

function makeStar(W, H) {
  return {
    x:  randBetween(0, W),
    y:  randBetween(0, H),
    vx: randBetween(-0.12, 0.12),
    vy: randBetween(-0.08, 0.08),
    r:  randBetween(R_MIN, R_MAX),
    op: randBetween(OP_MIN, OP_MAX),
    va: Math.random() < 0.5 ? 0.008 : -0.008,
  };
}

export default function ConstellationCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, stars = [], raf = null;

    const resize = (w, h) => {
      W = w; H = h;
      canvas.width  = W;
      canvas.height = H;
    };

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      resize(width, height);
      stars = Array.from({ length: COUNT }, () => makeStar(W, H));
    });
    ro.observe(canvas.parentElement);

    /* ── Reduced-motion: static snapshot, no RAF ── */
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const drawStatic = () => {
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
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!W || !H) return;

      ctx.clearRect(0, 0, W, H);

      /* Connection lines — drawn first so they appear under stars */
      ctx.lineWidth = 0.6;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_R) {
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
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.op.toFixed(3)})`;
        ctx.fill();

        /* Update position */
        s.x += s.vx; s.y += s.vy;

        /* Wrap edges */
        if (s.x < 0)  s.x = W;
        if (s.x > W)  s.x = 0;
        if (s.y < 0)  s.y = H;
        if (s.y > H)  s.y = 0;

        /* Pulse opacity */
        s.op += s.va;
        if (s.op >= OP_MAX) { s.op = OP_MAX; s.va = -Math.abs(s.va); }
        if (s.op <= OP_MIN) { s.op = OP_MIN; s.va =  Math.abs(s.va); }
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
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
