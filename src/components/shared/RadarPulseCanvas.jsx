import { useEffect, useRef } from "react";

const AMBER       = "rgba(232,160,48,";
const SPAWN_EVERY = 90;   // frames between new rings

export default function RadarPulseCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    /* ── Size canvas to its parent via ResizeObserver ── */
    let W = 0, H = 0;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      W = width; H = height;
      canvas.width  = W;
      canvas.height = H;
    });
    ro.observe(canvas.parentElement);

    /* Static-only mode: just draw the origin dot */
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const drawDot = () => {
        if (!W || !H) { requestAnimationFrame(drawDot); return; }
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.arc(W * 0.75, H * 0.5, 5, 0, Math.PI * 2);
        ctx.fillStyle = AMBER + "0.6)";
        ctx.fill();
      };
      requestAnimationFrame(drawDot);
      return () => ro.disconnect();
    }

    /* ── Animation state ── */
    const rings = [];
    let frame = 0, raf = null;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!W || !H) return;

      ctx.clearRect(0, 0, W, H);

      const ox = W * 0.75;
      const oy = H * 0.5;
      const maxR = Math.min(W, H) * 0.70;

      /* Spawn a new ring every SPAWN_EVERY frames */
      if (frame % SPAWN_EVERY === 0) rings.push({ r: 0 });
      frame++;

      /* Draw + update rings */
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        const progress = ring.r / maxR;          // 0 → 1 as ring grows
        const alpha    = (1 - progress) * 0.35;  // fades to 0 at maxR

        if (alpha <= 0) { rings.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(ox, oy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = AMBER + alpha.toFixed(3) + ")";
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        ring.r += 0.9;   // px/frame expansion speed
      }

      /* Static origin dot (always on top) */
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fillStyle = AMBER + "0.6)";
      ctx.fill();
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
