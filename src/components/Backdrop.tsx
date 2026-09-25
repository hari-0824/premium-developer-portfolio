import { useEffect, useRef, useState } from "react";

/* Fixed ambient layer: hairline grid + panel texture + drifting particles */
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 grid-field" />
      <div
        className="absolute inset-0 opacity-[0.55] dark:block"
        style={{
          backgroundImage: "url(images/panel.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          maskImage:
            "radial-gradient(120% 80% at 70% -10%, rgba(0,0,0,.85), transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 70% -10%, rgba(0,0,0,.85), transparent 70%)",
          mixBlendMode: "screen",
          opacity: 0.22,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(60% 55% at 20% 0%, var(--brand-wash), transparent 70%)",
        }}
      />
      <Particles />
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{ background: "linear-gradient(180deg, transparent, var(--bg))" }}
      />
    </div>
  );
}

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let pts: P[] = [];

    const seed = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(56, (w * h) / 26000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.09,
        vy: (Math.random() - 0.5) * 0.09,
        r: Math.random() * 1.3 + 0.5,
        a: Math.random() * 0.35 + 0.12,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const light = document.documentElement.classList.contains("light");
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        if (p.y < -4) p.y = h + 4;
        if (p.y > h + 4) p.y = -4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = light
          ? `rgba(67,83,232,${p.a * 0.5})`
          : `rgba(160,175,255,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    seed();
    if (reduce) draw();
    else raf = requestAnimationFrame(draw);

    const onResize = () => seed();
    window.addEventListener("resize", onResize);
    const t = window.setInterval(() => {
      // keep particle field correct across theme switches
      if (!document.documentElement.classList.contains("light")) return;
    }, 4000);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearInterval(t);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/* ------------------------------------------------------------------ */
/* Subtle custom cursor — soft glow that swells over interactive stuff */
/* ------------------------------------------------------------------ */
export function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = -200;
    let y = -200;
    let rx = -200;
    let ry = -200;
    let scale = 1;
    let target = 1;
    let raf = 0;
    let visible = false;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        if (dot.current) dot.current.style.opacity = "1";
        if (ring.current) ring.current.style.opacity = "1";
      }
      const el = e.target as HTMLElement | null;
      const hit = el?.closest?.(
        'a, button, [role="button"], input, textarea, select, .cursor-hot'
      );
      target = hit ? 2.15 : 1;
      if (dot.current) dot.current.style.opacity = hit ? "0.9" : "0.55";
    };
    const leave = () => {
      visible = false;
      if (dot.current) dot.current.style.opacity = "0";
      if (ring.current) ring.current.style.opacity = "0";
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      scale += (target - scale) * 0.14;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%,-50%)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%,-50%) scale(${scale.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);
  if (!fine) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block" aria-hidden="true">
      <div
        ref={ring}
        className="absolute left-0 top-0 h-9 w-9 rounded-full opacity-0 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(91,108,255,.42), rgba(91,108,255,0) 68%)",
          boxShadow: "0 0 30px 6px rgba(91,108,255,.18)",
        }}
      />
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full opacity-0 transition-opacity duration-300"
        style={{ background: "var(--brand-light)" }}
      />
    </div>
  );
}
