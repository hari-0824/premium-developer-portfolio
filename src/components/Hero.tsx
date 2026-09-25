import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText, Mail } from "lucide-react";
import { portfolioData } from "@/data/portfolioData";
import { Monogram } from "@/components/ui";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";
import { useProfilePhoto } from "@/contexts/PortfolioProvider";
import { mailtoHref, resumeUrl } from "@/lib/contact";

const LINES = [
  { cmd: "whoami", out: "hari-hara-sudhan" },
  { cmd: "current_focus", out: "Java Full Stack Development" },
  { cmd: "building", out: "AI + IoT Projects" },
];

/* floating technology cards around the profile photo.
   `sm: true` cards are hidden on very small screens to avoid clutter. */
const TECH_CARDS = [
  { label: "JAVA", pos: "top-0 left-[6%]", sm: false, lift: -4 },
  { label: "SPRING BOOT", pos: "top-[34%] right-0", sm: true, lift: -5 },
  { label: "REACT", pos: "top-[66%] left-0", sm: true, lift: 5 },
  { label: "AI", pos: "bottom-[7%] right-[9%]", sm: true, lift: -5 },
  { label: "IoT", pos: "bottom-0 left-[9%]", sm: false, lift: 4 },
];

/* ------------------------------ terminal ------------------------------ */
function Terminal() {
  const reduce = useReducedMotion();
  const [line, setLine] = useState(reduce ? LINES.length : 0);
  const [typed, setTyped] = useState(reduce ? LINES[LINES.length - 1].cmd.length : 0);
  const [showOut, setShowOut] = useState(!!reduce);
  const [done, setDone] = useState(!!reduce);

  useEffect(() => {
    if (reduce) return;
    let timers: number[] = [];
    let cancelled = false;

    const run = (i: number) => {
      if (cancelled || i >= LINES.length) {
        if (!cancelled) timers.push(window.setTimeout(() => !cancelled && restart(), 4200));
        return;
      }
      setLine(i);
      setTyped(0);
      setShowOut(false);
      setDone(false);
      const cmd = LINES[i].cmd;
      let c = 0;
      const typeChar = () => {
        if (cancelled) return;
        c += 1;
        setTyped(c);
        if (c < cmd.length) timers.push(window.setTimeout(typeChar, 52));
        else {
          timers.push(window.setTimeout(() => !cancelled && setShowOut(true), 340));
          timers.push(window.setTimeout(() => !cancelled && run(i + 1), 1500));
        }
      };
      timers.push(window.setTimeout(typeChar, 260));
    };

    const restart = () => {
      if (cancelled) return;
      setDone(true);
      timers.push(window.setTimeout(() => !cancelled && run(0), 400));
    };

    run(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        border: "1px solid var(--line-strong)",
        background:
          "linear-gradient(160deg, color-mix(in srgb, var(--raised) 88%, transparent), color-mix(in srgb, var(--panel) 92%, transparent))",
        boxShadow: "var(--shadow)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full" style={{ background: "#E06C5A" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#E3B341" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#3FB950" }} />
        </div>
        <span className="mono text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--dim)" }}>
          hhs@dev — bash
        </span>
        <span className="mono text-[10px]" style={{ color: "var(--dim)" }} aria-hidden="true">
          ⌘
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <ul className="mono space-y-3 text-[12.5px] leading-relaxed sm:text-[13px]">
          {LINES.slice(0, Math.min(line + 1, LINES.length)).map((l, i) => {
            const isCurrent = i === line && !done;
            return (
              <li key={l.cmd}>
                <div className="flex gap-2" style={{ color: "var(--muted)" }}>
                  <span style={{ color: "var(--brand-light)" }}>$</span>
                  <span style={{ color: "var(--text)" }}>
                    {l.cmd.slice(0, isCurrent ? typed : l.cmd.length)}
                    {isCurrent && (
                      <span className="caret" style={{ color: "var(--brand-light)" }}>
                        ▌
                      </span>
                    )}
                  </span>
                </div>
                {(isCurrent ? showOut : true) && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="pl-4"
                    style={{ color: "var(--brand-light)" }}
                  >
                    {l.out}
                  </motion.div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mono mt-4 flex items-center gap-2 text-[11px]" style={{ color: "var(--dim)" }}>
          <span style={{ color: "var(--amber)" }}>●</span> session active — open to internships &amp; roles
        </div>
      </div>
    </div>
  );
}

/* ------------------------- profile photo plate ------------------------ */
function PhotoPlaceholder() {
  return (
    <div
      className="plate absolute inset-0 grid place-items-center px-5 text-center"
      role="img"
      aria-label="Profile photo placeholder — add your image at public/images/profile.jpg"
    >
      <div>
        <svg
          viewBox="0 0 120 120"
          className="mx-auto h-20 w-20"
          fill="none"
          stroke="var(--brand-light)"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="60" cy="42" r="21" opacity="0.85" />
          <path d="M22 102c0-21 17.2-38 38-38s38 17 38 38" opacity="0.6" />
          <path d="M60 64v10" opacity="0.35" />
        </svg>
        <div className="engraved mt-4" style={{ color: "var(--brand-light)" }}>
          Profile photo
        </div>
        <div className="mono mt-2 text-[11.5px]" style={{ color: "var(--text)" }}>
          Add your image
        </div>
        <div
          className="mono mt-1 break-all text-[9.5px] leading-relaxed"
          style={{ color: "var(--dim)" }}
        >
          public/images/profile.jpg
        </div>
      </div>
      <span
        className="mono absolute left-4 top-4 rounded-md px-2 py-1 text-[9px] uppercase tracking-[0.16em]"
        style={{ border: "1px dashed var(--line-strong)", color: "var(--dim)" }}
      >
        Placeholder
      </span>
    </div>
  );
}

function ProfileComposition() {
  const reduce = useReducedMotion();
  const alt = portfolioData.personal.profilePhotoAlt;
  /* Supabase profiles.profile_photo_url → static fallback (see PortfolioProvider). */
  const { src: photoSrc, fallbackSrc, loading: photoLoading } = useProfilePhoto();
  /* If the Supabase URL ever fails to load, fall back to the static photo once. */
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = photoSrc && photoSrc === failedSrc ? fallbackSrc : photoSrc;
  const ease = [0.16, 1, 0.3, 1] as const;

  const rise = (delay: number) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" } as const,
    transition: { duration: 0.6, delay, ease },
  });

  return (
    <div className="relative mx-auto w-full max-w-[440px] px-3 pb-11 pt-9">
      {/* ---------- orbital glow behind the photo ---------- */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
        <div className="relative aspect-square w-[86%]">
          {/* soft glow */}
          <motion.div
            className="absolute inset-[-14%] rounded-full"
            style={{
              background: "radial-gradient(circle, var(--brand-wash), transparent 68%)",
            }}
            animate={reduce ? undefined : { opacity: [0.55, 0.95, 0.55] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* outer dashed orbit */}
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed"
            style={{ borderColor: "var(--line-strong)" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
          />
          {/* inner orbit + two satellites */}
          <motion.div
            className="absolute inset-[11%] rounded-full border"
            style={{ borderColor: "var(--line)" }}
            animate={reduce ? undefined : { rotate: -360 }}
            transition={{ duration: 78, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute left-1/2 top-[-4px] h-[7px] w-[7px] -translate-x-1/2 rounded-full"
              style={{ background: "var(--brand-light)" }}
            />
            <span
              className="absolute bottom-[-3px] left-[22%] h-[5px] w-[5px] rounded-full"
              style={{ background: "var(--amber)" }}
            />
          </motion.div>
        </div>
      </div>

      {/* ---------- floating technology cards ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {TECH_CARDS.map((c, i) => (
          <motion.span
            key={c.label}
            {...rise(0.42 + i * 0.07)}
            className={`mono absolute z-20 rounded-lg px-3 py-2 text-[10.5px] font-medium tracking-[0.14em] ${
              c.sm ? "hidden sm:block" : "block"
            } ${c.pos}`}
            style={{
              border: "1px solid color-mix(in srgb, var(--brand) 34%, var(--line-strong))",
              background: "color-mix(in srgb, var(--panel) 90%, transparent)",
              color: "var(--brand-light)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 10px 28px -14px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02) inset",
            }}
          >
            <motion.span
              className="flex items-center gap-2"
              animate={reduce ? undefined : { y: [0, c.lift, 0] }}
              transition={{ duration: 5.5 + i * 0.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-light)", boxShadow: "0 0 8px var(--brand)" }} />
              {c.label}
            </motion.span>
          </motion.span>
        ))}
      </div>

      {/* ---------- profile photo ---------- */}
      <motion.figure
        {...rise(0.2)}
        className="group relative z-10 mx-auto w-[78%] max-w-[300px]"
      >
        {/* subtle animated glow */}
        <motion.span
          className="pointer-events-none absolute -inset-[10px] rounded-[42px]"
          style={{
            background: "radial-gradient(60% 55% at 50% 45%, var(--brand-wash), transparent 72%)",
            boxShadow: "0 0 44px -18px var(--brand)",
          }}
          aria-hidden="true"
          animate={reduce ? undefined : { opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* glassmorphism outer frame */}
        <div
          className="glass edge-glow relative rounded-[30px] p-2 transition-all duration-500"
          style={{
            border: "1px solid var(--line)",
            boxShadow: "0 34px 70px -42px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[23px]"
            style={{ aspectRatio: "4 / 5", background: "var(--raised)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset" }}
          >
            {photoLoading ? (
              /* first Supabase read in flight — empty frame, never a stale photo */
              <span className="absolute inset-0" aria-hidden="true" />
            ) : src ? (
              <img
                key={src}
                src={src}
                alt={alt}
                loading="eager"
                decoding="async"
                data-photo-source={src === photoSrc && photoSrc !== fallbackSrc ? "supabase" : "fallback"}
                className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.02]"
                style={{ filter: "saturate(0.85) contrast(1.04)" }}
                onError={(e) => {
                  if (photoSrc && src === photoSrc && photoSrc !== fallbackSrc) setFailedSrc(photoSrc);
                  else e.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <PhotoPlaceholder />
            )}

            {/* bottom scrim + name plate */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
              style={{ background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg) 88%, transparent))" }}
              aria-hidden="true"
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
              <Monogram size={30} className="shrink-0" />
              <span className="min-w-0">
                <span className="mono block truncate text-[11.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: "var(--text)" }}>
                  {portfolioData.personal.fullName}
                </span>
                <span className="engraved block text-[9px]" style={{ color: "var(--brand-light)" }}>
                  {portfolioData.personal.role}
                </span>
              </span>
            </figcaption>
          </div>
        </div>

        {/* soft glowing border on hover */}
        <span
          className="pointer-events-none absolute inset-0 rounded-[30px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: "inset 0 0 0 1px var(--brand), 0 0 60px -22px var(--brand)" }}
          aria-hidden="true"
        />

      </motion.figure>
    </div>
  );
}

/* -------------------------------- hero -------------------------------- */
export default function Hero() {
  const reduce = useReducedMotion();
  const p = portfolioData;
  const ease = [0.16, 1, 0.3, 1] as const;

  const rise = (delay: number) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease },
  });

  const socials = [
    { href: p.socials.github, label: "GitHub", Icon: GithubIcon },
    { href: p.socials.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    ...(mailtoHref() ? [{ href: mailtoHref()!, label: "Email", Icon: Mail }] : []),
  ];
  /* only offer the resume when a PDF has actually been uploaded via the CMS */
  const resume = resumeUrl();

  return (
    <section
      id="home"
      aria-labelledby="home-heading"
      className="relative scroll-mt-24 pt-[104px] pb-16 sm:pt-[120px] lg:pt-[132px] lg:pb-24"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div
          className="regmark relative overflow-hidden rounded-[26px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14"
          style={{
            border: "1px solid var(--line)",
            background: "color-mix(in srgb, var(--panel) 55%, transparent)",
          }}
        >
          {/* subtle futuristic backdrop: fading grid + two soft glows */}
          <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--brand) 20%, transparent), transparent 65%)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full"
            style={{ background: "radial-gradient(circle, var(--amber-wash), transparent 65%)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand-light) 55%, transparent), transparent)" }}
            aria-hidden="true"
          />

          <div className="relative grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10">
            {/* ---------------- left ---------------- */}
            <div className="lg:col-span-7">
              <motion.div
                {...rise(0)}
                className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5"
                style={{
                  border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)",
                  background: "var(--amber-wash)",
                }}
              >
                <span className="led h-[7px] w-[7px] rounded-full" style={{ background: "var(--amber)" }} />
                <span
                  className="mono text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--amber)" }}
                >
                  {p.personal.badge}
                </span>
              </motion.div>

              <motion.h1
                id="home-heading"
                {...rise(0.08)}
                className="display mt-7 font-bold"
                style={{ fontSize: "clamp(2.35rem, 6vw, 4.6rem)", lineHeight: 1.02 }}
              >
                Hi, I&apos;m <span style={{ color: "var(--text)" }}>{p.personal.fullName}.</span>
                <br />
                <span style={{ color: "var(--brand-light)", fontWeight: 500 }}>{p.personal.role}</span>
              </motion.h1>

              <motion.p
                {...rise(0.18)}
                className="mt-7 max-w-xl text-[16px] leading-relaxed sm:text-[17px]"
                style={{ color: "var(--muted)" }}
              >
                {p.personal.heroLead}
              </motion.p>

              <motion.div
                {...rise(0.26)}
                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2"
              >
                <Meta label="Status" value={p.personal.status} />
                <Meta label="College" value={p.personal.college} />
                <Meta label="Batch" value={p.personal.graduation} />
              </motion.div>

              <motion.div {...rise(0.34)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#projects"
                  className="btn-sheen btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[13px] font-medium text-white transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(180deg, var(--brand), var(--brand-deep))",
                    boxShadow: "0 12px 34px -16px var(--brand)",
                  }}
                >
                  View Projects
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </a>

                {resume && (
                  <a
                    href={resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View resume (PDF, opens in a new tab)"
                    className="btn-outline btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[13px] font-medium hover:-translate-y-0.5"
                    style={{
                      border: "1px solid var(--line-strong)",
                      background: "var(--brand-wash)",
                      color: "var(--text)",
                    }}
                  >
                    <FileText className="h-4 w-4" style={{ color: "var(--brand-light)" }} aria-hidden="true" />
                    View Resume
                  </a>
                )}

                <a
                  href="#contact"
                  className="btn-outline btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[13px] font-medium hover:-translate-y-0.5"
                  style={{ border: "1px solid var(--line-strong)", color: "var(--text)" }}
                >
                  <Mail className="h-4 w-4" style={{ color: "var(--brand-light)" }} aria-hidden="true" />
                  Contact Me
                </a>
              </motion.div>

              <motion.div {...rise(0.42)} className="mt-8 flex items-center gap-3">
                <span className="engraved mr-1">Connect</span>
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="btn-outline btn-press group grid h-11 w-11 place-items-center rounded-xl hover:-translate-y-0.5"
                    style={{ border: "1px solid var(--line)", background: "var(--panel)", color: "var(--muted)" }}
                  >
                    <Icon className="h-[17px] w-[17px] transition-colors group-hover:text-[var(--brand-light)]" />
                  </a>
                ))}
              </motion.div>
            </div>

            {/* -------- right: profile photo + floating stack cards -------- */}
            <div className="lg:col-span-5">
              <ProfileComposition />
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.3, ease }}
                className="mt-10"
              >
                <Terminal />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="engraved text-[9.5px]">{label}</span>
      <span className="text-[13px]" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
