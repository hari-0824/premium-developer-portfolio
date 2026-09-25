/**
 * Project case-study view.
 *
 * Data: the `projects` rows already loaded by PortfolioProvider (Supabase →
 * portfolioData.projects). No extra queries. Every section renders only when
 * its field has content — nothing is invented or padded.
 *
 * Navigation: opening pushes `#project/<slug>` onto history, so the browser
 * Back button closes the view and Forward reopens it. Deep links work, and the
 * admin hash routes (#/admin…) are untouched.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { type Project } from "@/data/portfolioData";
import { Engraved, Reveal } from "@/components/ui";
import { GithubIcon } from "@/components/BrandIcons";
import { parentWindow } from "@/lib/entry";
import { mailtoHref } from "@/lib/contact";

/* ───────────────────────────── routing helpers ───────────────────────────── */

const HASH_PREFIX = "#project/";

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Readable, stable-enough key: slug of the title, falling back to the row id. */
export const projectKey = (pr: Project) => slugify(pr.title) || String(pr.id);
export const projectHref = (pr: Project) => HASH_PREFIX + encodeURIComponent(projectKey(pr));

function keyFromHash(hash: string): string | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  try {
    return decodeURIComponent(hash.slice(HASH_PREFIX.length)) || null;
  } catch {
    return null;
  }
}

function findProject(list: Project[], key: string | null): Project | null {
  if (!key) return null;
  return list.find((pr) => projectKey(pr) === key) ?? list.find((pr) => String(pr.id) === key) ?? null;
}

const baseUrl = () => window.location.pathname + window.location.search;

/** Keep a same-origin wrapper page's address bar (Arena preview) in step. */
function mirrorParent(hash: string | null) {
  const parent = parentWindow();
  if (!parent) return;
  try {
    const cur = parent.location.hash;
    if (hash && cur !== hash) parent.history.replaceState(parent.history.state, "", parent.location.pathname + parent.location.search + hash);
    if (!hash && keyFromHash(cur)) parent.history.replaceState(parent.history.state, "", parent.location.pathname + parent.location.search);
  } catch {
    /* parent refused — address bar just won't mirror */
  }
}

/**
 * URL-driven open/close state for the details view.
 * @param list  current projects (may still be the built-in list until Supabase loads)
 * @param ready true once the first Supabase load has finished
 */
export function useProjectRoute(list: Project[], ready: boolean) {
  const [key, setKey] = useState<string | null>(() => {
    const own = keyFromHash(window.location.hash);
    if (own) return own;
    const parent = parentWindow();
    const fromParent = parent ? keyFromHash(parent.location.hash) : null;
    if (fromParent) history.replaceState(history.state, "", baseUrl() + parent!.location.hash);
    return fromParent;
  });
  const pushed = useRef(false); // true when WE added the history entry (→ Back = history.back())
  const trigger = useRef<HTMLElement | null>(null);
  const savedY = useRef<number | null>(null); // list scroll position to return to
  const lastKey = useRef<string | null>(null);
  const prevRestoration = useRef<ScrollRestoration | null>(null);
  /* while the view is open the browser must not auto-restore scroll on Back —
     we restore the exact list position ourselves */
  const manualScroll = () => {
    if (prevRestoration.current === null && "scrollRestoration" in history) {
      prevRestoration.current = history.scrollRestoration;
      history.scrollRestoration = "manual";
    }
  };

  useEffect(() => {
    const sync = () => {
      const k = keyFromHash(window.location.hash);
      if (!k) pushed.current = false;
      else {
        if (savedY.current === null) savedY.current = window.scrollY;
        manualScroll();
      }
      setKey(k);
      mirrorParent(k ? window.location.hash : null);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    const parent = parentWindow();
    const onParent = () => {
      const k = parent ? keyFromHash(parent.location.hash) : null;
      if (k && k !== keyFromHash(window.location.hash)) {
        history.replaceState(history.state, "", baseUrl() + parent!.location.hash);
        setKey(k);
      }
    };
    parent?.addEventListener("hashchange", onParent);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
      parent?.removeEventListener("hashchange", onParent);
    };
  }, []);

  const project = findProject(list, key);

  /* unknown / deleted / unpublished project in the URL → quietly drop the hash */
  useEffect(() => {
    if (ready && key && !project) {
      history.replaceState(history.state, "", baseUrl());
      mirrorParent(null);
      pushed.current = false;
      setKey(null);
    }
  }, [ready, key, project]);

  const open = useCallback((pr: Project, from?: HTMLElement | null) => {
    trigger.current = from ?? null;
    if (!keyFromHash(window.location.hash)) savedY.current = window.scrollY;
    manualScroll();
    const href = projectHref(pr);
    if (keyFromHash(window.location.hash)) history.replaceState(history.state, "", baseUrl() + href);
    else {
      history.pushState(history.state, "", baseUrl() + href);
      pushed.current = true;
    }
    mirrorParent(href);
    setKey(projectKey(pr));
  }, []);

  /** Switch project inside the view without adding history entries. */
  const go = useCallback((pr: Project) => {
    const href = projectHref(pr);
    history.replaceState(history.state, "", baseUrl() + href);
    mirrorParent(href);
    setKey(projectKey(pr));
  }, []);

  const close = useCallback(() => {
    if (pushed.current && keyFromHash(window.location.hash)) {
      history.back(); // popstate → sync() clears the key
      return;
    }
    /* opened from a shared link: no entry of ours to pop */
    history.replaceState(history.state, "", baseUrl());
    mirrorParent(null);
    pushed.current = false;
    if (savedY.current === null) {
      requestAnimationFrame(() => {
        const el = document.getElementById("projects");
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76 });
      });
    }
    setKey(null);
  }, []);

  /* return focus to whatever opened the view */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (project) {
      wasOpen.current = true;
      lastKey.current = projectKey(project);
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const y = savedY.current;
    savedY.current = null;
    /* the browser's own restoration + re-layout can drift a few px; pin it */
    const restore = () => { if (y !== null) window.scrollTo({ top: y }); };
    restore();
    requestAnimationFrame(() => {
      restore();
      window.setTimeout(() => {
        restore();
        if (prevRestoration.current !== null) {
          history.scrollRestoration = prevRestoration.current;
          prevRestoration.current = null;
        }
      }, 120);
    });
    const el =
      (trigger.current?.isConnected ? trigger.current : null) ??
      (lastKey.current
        ? document.querySelector<HTMLElement>(`#projects h3 a[href="${HASH_PREFIX}${CSS.escape(encodeURIComponent(lastKey.current))}"]`)
        : null);
    trigger.current = null;
    el?.focus({ preventScroll: true });
  }, [project]);

  return { project, open, close, go };
}

/* ───────────────────────────────── helpers ───────────────────────────────── */

const has = (s: string | null | undefined) => typeof s === "string" && s.trim().length > 0;
const items = (a: string[] | null | undefined) => (Array.isArray(a) ? a.filter(has) : []);
const hasImage = (src: string) => has(src) && src !== "data:,";
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ───────────────────────────────── the view ───────────────────────────────── */

export function ProjectDetails({
  project,
  list,
  onClose,
  onNavigate,
}: {
  project: Project | null;
  list: Project[];
  onClose: () => void;
  onNavigate: (pr: Project) => void;
}) {
  const reduce = useReducedMotion();
  const dialog = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstOpen = useRef(true);
  const [imgFailed, setImgFailed] = useState(false);

  const isOpen = !!project;

  /* body scroll lock + keyboard (Esc, focus trap) */
  useEffect(() => {
    if (!isOpen) {
      firstOpen.current = true;
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog.current) return;
      const nodes = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!dialog.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  /* new project → top of the page; focus Back on open, the title on prev/next */
  useLayoutEffect(() => {
    if (!project) return;
    setImgFailed(false);
    scroller.current?.scrollTo({ top: 0 });
    const t = window.setTimeout(() => {
      if (firstOpen.current) backBtn.current?.focus({ preventScroll: true });
      else titleRef.current?.focus({ preventScroll: true });
      firstOpen.current = false;
    }, 40);
    return () => window.clearTimeout(t);
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="project-details"
          ref={dialog}
          className="fixed inset-0 z-[90]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-details-title"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: reduce ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            ref={scroller}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ background: "var(--bg)" }}
          >
            <CaseStudy
              project={project}
              list={list}
              imgFailed={imgFailed}
              onImgError={() => setImgFailed(true)}
              onClose={onClose}
              onNavigate={onNavigate}
              backBtn={backBtn}
              titleRef={titleRef}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CaseStudy({
  project: pr,
  list,
  imgFailed,
  onImgError,
  onClose,
  onNavigate,
  backBtn,
  titleRef,
}: {
  project: Project;
  list: Project[];
  imgFailed: boolean;
  onImgError: () => void;
  onClose: () => void;
  onNavigate: (pr: Project) => void;
  backBtn: React.RefObject<HTMLButtonElement | null>;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const d = pr.detail ?? ({} as Project["detail"]);
  const pos = list.findIndex((x) => x.id === pr.id);
  const prev = pos > 0 ? list[pos - 1] : null;
  const next = pos >= 0 && pos < list.length - 1 ? list[pos + 1] : null;

  const github = has(pr.links?.github) ? pr.links.github.trim() : "";
  const live = has(pr.links?.live) ? pr.links.live.trim() : "";
  const tags = items(pr.tags);
  /* Technologies (tech) + Stack (stack), each item shown once, original order */
  const techStack = [...new Set([...items(pr.tech), ...items(d.stack)])];
  const features = items(d.features);
  const future = items(d.future);
  const showImage = hasImage(pr.image) && !imgFailed;
  const askHref = mailtoHref(`About ${pr.title}`);

  /* narrative sections — only those with content, numbered contiguously */
  const sections = [
    has(d.problem) && { id: "problem", label: "Problem", body: <Prose text={d.problem} /> },
    has(d.solution) && { id: "solution", label: "Solution", body: <Prose text={d.solution} /> },
    features.length > 0 && {
      id: "features",
      label: "Key Features",
      body: (
        <ul className="grid gap-3 sm:grid-cols-2">
          {features.map((f, i) => (
            <li
              key={f + i}
              className="card-lift flex gap-3 rounded-2xl p-4"
              style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
            >
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--brand-wash)", color: "var(--brand-light)" }}
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="text-[14.5px] leading-relaxed" style={{ color: "var(--text)" }}>
                {f}
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    /* mobile only: keeps the requested Problem → Solution → Features → Tech Stack
       → Contribution → Future reading order. The desktop sidebar holds the
       same panel and is hidden below lg, so it is never shown twice. */
    techStack.length > 0 && {
      id: "stack",
      label: "Technologies & Stack",
      className: "lg:hidden",
      body: (
        <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
          {techStack.map((t) => (
            <li key={t} className="chip rounded-lg px-2.5 py-1.5 text-[11px] tracking-[0.04em]">
              {t}
            </li>
          ))}
        </ul>
      ),
    },
    has(d.contribution) && { id: "contribution", label: "My Contribution", body: <Prose text={d.contribution} strong /> },
    future.length > 0 && {
      id: "future",
      label: "Future Improvements",
      tone: "amber" as const,
      body: (
        <ul className="space-y-3">
          {future.map((f, i) => (
            <li key={f + i} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
              <ArrowRight className="mt-[5px] h-4 w-4 shrink-0" style={{ color: "var(--amber)" }} aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ].filter(Boolean) as { id: string; label: string; body: React.ReactNode; tone?: "amber"; className?: string }[];

  const hasAside = techStack.length > 0 || tags.length > 0 || !!github || !!live;

  return (
    <>
      {/* ambient backdrop (clipped so it never widens the page) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden" aria-hidden="true">
        <div className="grid-fade absolute inset-0" />
        <div
          className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--brand) 18%, transparent), transparent 65%)" }}
        />
      </div>

      {/* sticky bar */}
      <div className="glass sticky top-0 z-20 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
          <button
            ref={backBtn}
            type="button"
            onClick={onClose}
            className="btn-outline btn-press group inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[13px] font-medium"
            style={{ border: "1px solid var(--line-strong)", background: "var(--panel)", color: "var(--text)" }}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" />
            Back to Projects
          </button>
          {pos >= 0 && (
            <span className="mono text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
              Project {pr.index}
              <span style={{ color: "var(--dim)" }}> / {String(list.length).padStart(2, "0")}</span>
            </span>
          )}
        </div>
      </div>

      <article className="relative mx-auto w-full max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12 lg:pb-28">
        {/* ── hero ── */}
        <Reveal>
          <Engraved index={pr.index} tone="brand">
            Case Study
          </Engraved>
          {has(pr.kicker) && (
            <p className="mono mt-6 text-[12px] uppercase tracking-[0.16em]" style={{ color: "var(--amber)" }}>
              {pr.kicker}
            </p>
          )}
          <h2
            id="project-details-title"
            ref={titleRef}
            tabIndex={-1}
            className="display mt-3 font-bold outline-none"
            style={{ fontSize: "clamp(2.1rem, 5.6vw, 4.1rem)", lineHeight: 1.04, color: "var(--text)" }}
          >
            {pr.title}
          </h2>
          {has(pr.summary) && (
            <p className="mt-6 max-w-3xl text-[16.5px] leading-[1.7] sm:text-[18px]" style={{ color: "var(--muted)" }}>
              {pr.summary}
            </p>
          )}
          {(github || live) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {github && <GithubLink href={github} title={pr.title} primary />}
              {live && <LiveLink href={live} title={pr.title} />}
            </div>
          )}
        </Reveal>

        {/* ── image ── */}
        {showImage && (
          <Reveal delay={0.08} className="mt-10 sm:mt-12">
            <figure className="group glass edge-glow rounded-[28px] p-1.5 sm:p-2" style={{ border: "1px solid var(--line)" }}>
              <div
                className="plate relative aspect-[16/10] overflow-hidden rounded-[22px] sm:aspect-[16/9]"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset" }}
              >
                <img
                  src={pr.image}
                  alt={has(pr.imageAlt) ? pr.imageAlt : `${pr.title} project screenshot`}
                  decoding="async"
                  className="proj-img absolute inset-0 h-full w-full object-cover"
                  onError={onImgError}
                />
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(0deg, color-mix(in srgb, var(--bg) 35%, transparent), transparent 40%)" }}
                  aria-hidden="true"
                />
              </div>
            </figure>
          </Reveal>
        )}

        {/* ── body ── */}
        {(sections.length > 0 || hasAside) && (
          <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
            <div className="min-w-0 space-y-14 lg:space-y-16">
              {sections.map((s, i) => (
                <Reveal key={s.id} as="section" className={s.className}>
                  <section aria-labelledby={`pd-${s.id}`}>
                    <Engraved index={String(i + 1).padStart(2, "0")} tone={s.tone === "amber" ? "amber" : "brand"}>
                      {s.label}
                    </Engraved>
                    <h3 id={`pd-${s.id}`} className="display mt-4 text-[24px] font-semibold sm:text-[28px]" style={{ color: "var(--text)" }}>
                      {s.label}
                    </h3>
                    <div className="mt-5">{s.body}</div>
                  </section>
                </Reveal>
              ))}
            </div>

            {hasAside && (
              <aside className="min-w-0" aria-label="Project facts">
                <div className="space-y-4 lg:sticky lg:top-24">
                  {techStack.length > 0 && (
                    <Reveal className="hidden lg:block">
                      <Panel label="Technologies & Stack">
                        <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
                          {techStack.map((t) => (
                            <li key={t} className="chip rounded-lg px-2.5 py-1.5 text-[11px] tracking-[0.04em]">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </Panel>
                    </Reveal>
                  )}
                  {tags.length > 0 && (
                    <Reveal delay={0.05}>
                      <Panel label="Category">
                        <ul className="flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <li
                              key={t}
                              className="mono rounded-md px-2 py-1 text-[10px] tracking-[0.14em]"
                              style={{ border: "1px solid var(--line-strong)", color: "var(--muted)" }}
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      </Panel>
                    </Reveal>
                  )}
                  {(github || live) && (
                    <Reveal delay={0.1}>
                      <Panel label="Links">
                        <div className="flex flex-col gap-2.5">
                          {github && <GithubLink href={github} title={pr.title} block />}
                          {live && <LiveLink href={live} title={pr.title} block />}
                        </div>
                      </Panel>
                    </Reveal>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ── footer: next / previous + existing "ask me" action ── */}
        <Reveal className="mt-20">
          <div className="border-t pt-10" style={{ borderColor: "var(--line)" }}>
            {(prev || next) && (
              <nav aria-label="More projects" className="grid gap-3 sm:grid-cols-2">
                {prev ? <SiblingLink project={prev} dir="prev" onClick={() => onNavigate(prev)} /> : <span className="hidden sm:block" />}
                {next && <SiblingLink project={next} dir="next" onClick={() => onNavigate(next)} />}
              </nav>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline btn-press inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-medium"
                style={{ border: "1px solid var(--line-strong)", color: "var(--text)" }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to all projects
              </button>
              {askHref && (
                <a
                  href={askHref}
                  className="btn-outline btn-press inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-medium"
                  style={{ border: "1px solid var(--line)", background: "var(--brand-wash)", color: "var(--text)" }}
                  aria-label={`Email me about ${pr.title}`}
                >
                  <Mail className="h-4 w-4" style={{ color: "var(--brand-light)" }} aria-hidden="true" />
                  Ask me about this project
                </a>
              )}
            </div>
            <p className="mono mt-6 hidden text-[10.5px] sm:block" style={{ color: "var(--dim)" }}>
              Esc or the browser Back button returns to the projects list.
            </p>
          </div>
        </Reveal>
      </article>
    </>
  );
}

/* ─────────────────────────────── small parts ─────────────────────────────── */

function Prose({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <div className="max-w-3xl space-y-4">
      {text
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="text-[15.5px] leading-[1.8] sm:text-[16px]" style={{ color: strong ? "var(--text)" : "var(--muted)" }}>
            {para}
          </p>
        ))}
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel-edge rounded-2xl p-5" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
      <div className="engraved mb-4">{label}</div>
      {children}
    </div>
  );
}

function GithubLink({ href, title, primary, block }: { href: string; title: string; primary?: boolean; block?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} source code on GitHub (opens in a new tab)`}
      className={`${primary ? "btn-sheen text-white" : "btn-outline"} btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[13px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${block ? "w-full" : ""}`}
      style={
        primary
          ? { background: "linear-gradient(180deg, var(--brand), var(--brand-deep))", boxShadow: "0 12px 34px -16px var(--brand)" }
          : { border: "1px solid var(--line-strong)", background: "var(--raised)", color: "var(--text)" }
      }
    >
      <GithubIcon className="h-4 w-4" />
      View on GitHub
      <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  );
}

function LiveLink({ href, title, block }: { href: string; title: string; block?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} live demo (opens in a new tab)`}
      className={`btn-outline btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[13px] font-medium hover:-translate-y-0.5 ${block ? "w-full" : ""}`}
      style={{ border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)", background: "var(--amber-wash)", color: "var(--text)" }}
    >
      Live Demo
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" style={{ color: "var(--amber)" }} aria-hidden="true" />
    </a>
  );
}

function SiblingLink({ project, dir, onClick }: { project: Project; dir: "prev" | "next"; onClick: () => void }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <a
      href={projectHref(project)}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`card-lift group flex min-h-[72px] items-center gap-4 rounded-2xl p-4 sm:p-5 ${dir === "next" ? "sm:flex-row-reverse sm:text-right" : ""}`}
      style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
      aria-label={`${dir === "prev" ? "Previous" : "Next"} project: ${project.title}`}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ border: "1px solid var(--line)", background: "var(--brand-wash)", color: "var(--brand-light)" }}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="engraved block">{dir === "prev" ? "Previous project" : "Next project"}</span>
        <span className="mt-1 block truncate text-[15px] font-medium" style={{ color: "var(--text)" }}>
          {project.title}
        </span>
      </span>
    </a>
  );
}
