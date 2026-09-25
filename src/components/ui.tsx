import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Reveal — fast, machined entrance. Slides 12px and stops hard.       */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  );
}

/* ------------------------------------------------------------------ */
/* Engraved panel label: 04 / PROJECTS  ———————                        */
/* ------------------------------------------------------------------ */
export function Engraved({
  index,
  children,
  tone = "default",
  className = "",
}: {
  index?: string;
  children: ReactNode;
  tone?: "default" | "brand" | "amber";
  className?: string;
}) {
  const color =
    tone === "brand" ? "var(--brand-light)" : tone === "amber" ? "var(--amber)" : "var(--dim)";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {index && (
        <span className="mono text-[10.5px] font-semibold tracking-[0.2em]" style={{ color }}>
          {index}
        </span>
      )}
      <span className="engraved" style={{ color }} aria-hidden="true">
        /
      </span>
      <span className="engraved" style={{ color }}>
        {children}
      </span>
      <span
        className="h-px flex-1 min-w-6"
        style={{ background: "linear-gradient(90deg, var(--line-strong), transparent)" }}
        aria-hidden="true"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section shell — sticky numeric rail + content column (layout bet)   */
/* ------------------------------------------------------------------ */
export function Section({
  id,
  index,
  label,
  children,
  className = "",
}: {
  id: string;
  index: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-24 border-t ${className}`}
      style={{ borderColor: "var(--line)" }}
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-[180px_1fr] lg:gap-10">
          {/* sticky numeric rail */}
          <div className="hidden lg:block">
            <div className="sticky top-28 pt-16">
              <div
                className="display text-[64px] leading-none font-bold"
                style={{ color: "transparent", WebkitTextStroke: "1px var(--line-strong)" }}
                aria-hidden="true"
              >
                {index}
              </div>
              <div className="mt-4 h-px w-10" style={{ background: "var(--brand)" }} />
              <div className="engraved mt-4 [writing-mode:vertical-rl] rotate-180 tracking-[0.35em]">
                {label}
              </div>
            </div>
          </div>
          <div className="py-16 sm:py-20 lg:py-24">
            <div className="lg:hidden mb-8">
              <Engraved index={index}>{label}</Engraved>
            </div>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */
export function Counter({
  to,
  suffix,
  duration = 1300,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || to <= 0) return;
    if (reduce) {
      setN(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Hand-drawn geometric icon family (1.5px stroke, 24 grid)           */
/* ------------------------------------------------------------------ */
export function Glyph({ name, className = "" }: { name: string; className?: string }) {
  const p = paths[name] ?? paths.chip;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {p}
    </svg>
  );
}

const paths: Record<string, ReactNode> = {
  code: (
    <>
      <ellipse cx="12" cy="12" rx="5" ry="7.5" transform="rotate(-38 12 12)" />
      <path d="M9.4 8.6c2.6 2.2 2.8 6.4 5.2 8.6" />
    </>
  ),
  python: (
    <>
      <rect x="4" y="4" width="9" height="7" rx="3.2" />
      <rect x="11" y="13" width="9" height="7" rx="3.2" />
      <path d="M7.5 11v2.2c0 .9.7 1.6 1.6 1.6h2" />
    </>
  ),
  js: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M10 9.4v5.2c0 1.5-1 2.4-2.4 2.4" />
      <path d="M17.2 10.6c-.4-.8-1.2-1.2-2.1-1.2-1.2 0-2 .7-2 1.6 0 2.1 4.2 1.3 4.2 3.5 0 1-1 1.8-2.3 1.8-1.1 0-1.9-.4-2.4-1.2" />
    </>
  ),
  markup: (
    <>
      <path d="M8 6.5 3.5 12 8 17.5" />
      <path d="m16 6.5 4.5 5.5-4.5 5.5" />
      <path d="m13.4 5-2.8 14" />
    </>
  ),
  style: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5z" />
      <path d="m4 12.4 8 4.5 8-4.5" />
      <path d="m4 16.6 8 4.4 8-4.4" />
    </>
  ),
  react: (
    <>
      <circle cx="12" cy="12" r="1.9" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
    </>
  ),
  spring: (
    <>
      <path d="M12 20.5c.4-5.6 3.2-9 8-10-.3 5.6-3.4 9.2-8 10z" />
      <path d="M12 20.5c-.4-4.4-2.4-7-6.4-8 .3 4.6 2.6 7.4 6.4 8z" />
      <path d="M12 20.5V9" />
    </>
  ),
  api: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2" />
      <path d="m6.2 6.2 2.3 2.3M15.5 15.5l2.3 2.3M17.8 6.2l-2.3 2.3M8.5 15.5l-2.3 2.3" />
    </>
  ),
  sql: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M5 6v5.6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8V6" />
      <path d="M5 11.6v5.6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-5.6" />
    </>
  ),
  mongo: (
    <>
      <path d="M12 3.2c3.6 3.6 4.6 7.4 4.6 10.2a4.6 4.6 0 0 1-9.2 0C7.4 10.6 8.4 6.8 12 3.2z" />
      <path d="M12 7.5v13" />
    </>
  ),
  git: (
    <>
      <circle cx="6" cy="5.5" r="2" />
      <circle cx="6" cy="18.5" r="2" />
      <circle cx="18" cy="8.5" r="2" />
      <path d="M6 7.5v9" />
      <path d="M18 10.5v1.2a4 4 0 0 1-4 4H8" />
    </>
  ),
  ide: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 9h18" />
      <path d="M6.4 6.6h.01M9 6.6h.01" strokeWidth="2" />
      <path d="m8.5 13 2 2-2 2M13 17h3" />
    </>
  ),
  ai: (
    <>
      <circle cx="5" cy="7" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="5" cy="17" r="1.5" />
      <circle cx="19" cy="9" r="1.5" />
      <circle cx="19" cy="15.5" r="1.5" />
      <path d="M6.5 7 17.5 9M6.5 12 17.5 9M6.5 12l11 3.5M6.5 17l11-1.5" />
    </>
  ),
  vision: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.6 12s2.9-3.8 8.4-3.8S20.4 12 20.4 12" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.6" />
      <path d="M4 10.2h3M4 13.8h3M17 10.2h3M17 13.8h3M10.2 4v3M13.8 4v3M10.2 17v3M13.8 17v3" />
    </>
  ),
  sensor: (
    <>
      <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1.2" />
      <path d="M6.6 6.6a7.6 7.6 0 0 0 0 10.8M17.4 6.6a7.6 7.6 0 0 1 0 10.8" />
      <path d="M3.7 3.7a11.7 11.7 0 0 0 0 16.6M20.3 3.7a11.7 11.7 0 0 1 0 16.6" />
    </>
  ),
};

/* ------------------------------------------------------------------ */
/* HHS monogram — drawn, not rendered from a font                      */
/* ------------------------------------------------------------------ */
export function Monogram({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="HHS monogram"
    >
      <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="var(--line-strong)" />
      <path
        d="M13 18v28M13 32h11M24 18v28"
        stroke="var(--brand)"
        strokeWidth="4.5"
        strokeLinecap="square"
        fill="none"
      />
      <path
        d="M32 18v28M32 32h9M41 18v28"
        stroke="var(--brand-light)"
        strokeWidth="4.5"
        strokeLinecap="square"
        fill="none"
      />
      <path
        d="M49 18v28M49 32h3M52 18v28"
        stroke="var(--dim)"
        strokeWidth="4.5"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
export function Btn({
  children,
  href,
  onClick,
  variant = "solid",
  type = "button",
  download,
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  type?: "button" | "submit";
  download?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const base =
    "group relative inline-flex items-center justify-center gap-2.5 px-6 h-12 rounded-xl text-[13px] font-medium tracking-[0.02em] transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] will-change-transform";
  const styles =
    variant === "solid"
      ? "btn-sheen btn-press text-white hover:-translate-y-0.5"
      : "btn-outline btn-press hover:-translate-y-0.5 hairline hover:border-[var(--brand)]";
  const solid: React.CSSProperties =
    variant === "solid"
      ? {
          background: "linear-gradient(180deg, var(--brand), var(--brand-deep))",
          boxShadow: "0 10px 30px -14px var(--brand)",
        }
      : { background: "var(--brand-wash)" };
  const cls = `${base} ${styles} ${className}`;
  const inner = <span className="relative z-10 flex items-center gap-2.5">{children}</span>;

  if (href) {
    return (
      <a
        href={href}
        className={cls}
        style={solid}
        aria-label={ariaLabel}
        download={download}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} style={solid} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
