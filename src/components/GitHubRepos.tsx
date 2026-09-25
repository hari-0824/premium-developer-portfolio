/**
 * GitHub — real public repositories, read live from the GitHub REST API.
 *
 * Distinct from the Projects section: Projects is the curated, CMS-managed
 * case-study list; this is the raw public repository feed. Nothing here is
 * editable, invented or padded — every value comes from the API response.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, GitFork, Loader2, RefreshCw, Star } from "lucide-react";
import { Engraved, Reveal, Section } from "@/components/ui";
import { GithubIcon } from "@/components/BrandIcons";
import {
  GITHUB_PROFILE_URL,
  GITHUB_REPOS_URL,
  GITHUB_USER,
  fetchRepos,
  formatUpdated,
  languageColor,
  relativeUpdated,
  type Repo,
  type RepoError,
} from "@/lib/github";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; repos: Repo[] }
  | { phase: "error"; error: RepoError };

export function GitHubRepos() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const sectionRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const abort = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState({ phase: "loading" });
    const res = await fetchRepos(ctrl.signal);
    if (ctrl.signal.aborted) return;
    setState(res.ok ? { phase: "ready", repos: res.repos } : { phase: "error", error: res.error });
  }, []);

  /* Fetch lazily: only once this section is close to the viewport. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true;
          io.disconnect();
          void load();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      abort.current?.abort();
    };
  }, [load]);

  const retry = () => {
    started.current = true;
    void load();
  };

  return (
    <Section id="github" index="04.1" label="GitHub">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Engraved index="04.1" tone="brand">
              GitHub
            </Engraved>
            <h2
              id="github-heading"
              className="display heading-accent mt-5 font-bold"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}
            >
              Straight from the source
            </h2>
          </div>
          <p className="max-w-sm text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Public repositories pulled live from{" "}
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mono inline-block py-3 -my-3 text-[12.5px]"
              style={{ color: "var(--brand-light)" }}
              aria-label={`GitHub profile @${GITHUB_USER} (opens in a new tab)`}
            >
              @{GITHUB_USER}
            </a>
            , newest activity first. The curated write-ups live in Projects above.
          </p>
        </div>
      </Reveal>

      <div ref={sectionRef} className="mt-10">
        {(state.phase === "idle" || state.phase === "loading") && <LoadingGrid />}
        {state.phase === "error" && <ErrorPanel error={state.error} onRetry={retry} />}
        {state.phase === "ready" && state.repos.length === 0 && <EmptyPanel />}
        {state.phase === "ready" && state.repos.length > 0 && (
          <>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Public GitHub repositories">
              {state.repos.map((r, i) => (
                <Reveal key={r.id} as="li" delay={Math.min(i * 0.05, 0.3)} className="h-full">
                  <RepoCard repo={r} />
                </Reveal>
              ))}
            </ul>

            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <p className="mono text-[11px]" style={{ color: "var(--dim)" }}>
                  {state.repos.length} public {state.repos.length === 1 ? "repository" : "repositories"}
                </p>
                <a
                  href={GITHUB_REPOS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View all repositories for @${GITHUB_USER} on GitHub (opens in a new tab)`}
                  className="btn-outline btn-press group inline-flex h-12 items-center gap-2.5 rounded-xl px-6 text-[13px] font-medium hover:-translate-y-0.5"
                  style={{ border: "1px solid var(--line-strong)", background: "var(--brand-wash)", color: "var(--text)" }}
                >
                  <GithubIcon className="h-4 w-4" />
                  View all repositories on GitHub
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    style={{ color: "var(--brand-light)" }}
                    aria-hidden="true"
                  />
                </a>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Repository card                                                    */
/* ------------------------------------------------------------------ */

function RepoCard({ repo: r }: { repo: Repo }) {
  return (
    <article
      className="card-lift panel-edge group relative flex h-full flex-col rounded-2xl p-5 sm:p-6"
      style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5"
          style={{ border: "1px solid var(--line)", background: "var(--brand-wash)", color: "var(--brand-light)" }}
          aria-hidden="true"
        >
          <GithubIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="display text-[17px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline inline-block break-words py-3 -my-3"
              aria-label={`${r.name} repository on GitHub (opens in a new tab)`}
            >
              {r.name}
            </a>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {r.isFork && <Tag label="Fork" />}
            {r.isArchived && <Tag label="Archived" />}
          </div>
        </div>
      </div>

      <p
        className="mt-4 flex-1 text-[14px] leading-relaxed"
        style={{ color: r.description ? "var(--muted)" : "var(--dim)", fontStyle: r.description ? undefined : "italic" }}
      >
        {r.description ?? "No description provided."}
      </p>

      {r.topics.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {r.topics.map((t) => (
            <li key={t} className="chip rounded-md px-2 py-1 text-[10px] tracking-[0.06em]">
              {t}
            </li>
          ))}
        </ul>
      )}

      {/* facts row — every value is straight from the API */}
      <dl className="mono mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]" style={{ color: "var(--muted)" }}>
        {r.language && (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Primary language</dt>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: languageColor(r.language) }}
              aria-hidden="true"
            />
            <dd>{r.language}</dd>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Stars</dt>
          <Star className="h-3.5 w-3.5" aria-hidden="true" style={{ color: "var(--dim)" }} />
          <dd className="tabular-nums">{r.stars}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Forks</dt>
          <GitFork className="h-3.5 w-3.5" aria-hidden="true" style={{ color: "var(--dim)" }} />
          <dd className="tabular-nums">{r.forks}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <p className="mono text-[10.5px]" style={{ color: "var(--dim)" }}>
          <span className="sr-only">Last updated </span>
          <time dateTime={r.updatedAt}>{formatUpdated(r.updatedAt)}</time>
          <span aria-hidden="true"> · {relativeUpdated(r.updatedAt)}</span>
        </p>
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View the ${r.name} repository on GitHub (opens in a new tab)`}
          className="btn-outline btn-press inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12px] font-medium"
          style={{ border: "1px solid var(--line-strong)", background: "var(--raised)", color: "var(--text)" }}
        >
          View Repository
          <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "var(--brand-light)" }} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em]"
      style={{ border: "1px solid var(--line-strong)", color: "var(--dim)" }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  States                                                             */
/* ------------------------------------------------------------------ */

function LoadingGrid() {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading public repositories from GitHub…</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5 sm:p-6"
          style={{ border: "1px solid var(--line)", background: "var(--panel)", opacity: 1 - i * 0.18 }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ border: "1px solid var(--line)", background: "var(--brand-wash)" }}>
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--brand-light)" }} />
            </span>
            <span className="h-3 w-32 rounded-full" style={{ background: "var(--line-strong)" }} />
          </div>
          <div className="mt-5 space-y-2.5">
            <span className="block h-2.5 w-full rounded-full" style={{ background: "var(--line)" }} />
            <span className="block h-2.5 w-4/5 rounded-full" style={{ background: "var(--line)" }} />
          </div>
          <div className="mt-6 flex gap-3">
            <span className="h-2.5 w-16 rounded-full" style={{ background: "var(--line)" }} />
            <span className="h-2.5 w-10 rounded-full" style={{ background: "var(--line)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-6 py-12 text-center"
      style={{ border: "1px dashed var(--line-strong)", background: "var(--panel)" }}
    >
      {children}
    </div>
  );
}

function EmptyPanel() {
  return (
    <Shell>
      <p className="mono text-[12px] uppercase tracking-[0.16em]" style={{ color: "var(--dim)" }}>
        No public repositories yet
      </p>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
        Nothing is published on this GitHub account right now.
      </p>
      <a
        href={GITHUB_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open the GitHub profile @${GITHUB_USER} (opens in a new tab)`}
        className="btn-outline btn-press mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12.5px] font-medium"
        style={{ border: "1px solid var(--line-strong)", color: "var(--text)" }}
      >
        <GithubIcon className="h-4 w-4" />
        Open GitHub profile
      </a>
    </Shell>
  );
}

function ErrorPanel({ error, onRetry }: { error: RepoError; onRetry: () => void }) {
  const copy: Record<RepoError["kind"], { title: string; body: string }> = {
    "rate-limit": {
      title: "GitHub rate limit reached",
      body: "GitHub allows a limited number of anonymous requests per hour from one network. The list will load again shortly.",
    },
    "not-found": {
      title: "Profile not reachable",
      body: "GitHub did not return a repository list for this account.",
    },
    network: {
      title: "Couldn't reach GitHub",
      body: "The request failed — this is usually a dropped connection or an offline browser.",
    },
    unknown: {
      title: "Couldn't load repositories",
      body: "GitHub returned an unexpected response.",
    },
  };
  const { title, body } = copy[error.kind];
  const resetAt = error.kind === "rate-limit" ? error.resetAt : null;

  return (
    <div
      role="alert"
      className="rounded-2xl px-6 py-10 text-center"
      style={{ border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)", background: "var(--amber-wash)" }}
    >
      <span
        className="mx-auto grid h-11 w-11 place-items-center rounded-full"
        style={{ border: "1px solid var(--amber)", color: "var(--amber)" }}
        aria-hidden="true"
      >
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="display mt-4 text-[18px] font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {body}
        {resetAt && (
          <>
            {" "}
            Resets around{" "}
            <span className="mono" style={{ color: "var(--text)" }}>
              {resetAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            .
          </>
        )}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="btn-outline btn-press inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12.5px] font-medium"
          style={{ border: "1px solid var(--line-strong)", background: "var(--panel)", color: "var(--text)" }}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <a
          href={GITHUB_REPOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View repositories for @${GITHUB_USER} on GitHub (opens in a new tab)`}
          className="btn-outline btn-press inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12.5px] font-medium"
          style={{ border: "1px solid var(--line-strong)", background: "var(--panel)", color: "var(--text)" }}
        >
          <GithubIcon className="h-4 w-4" />
          Browse on GitHub
        </a>
      </div>
    </div>
  );
}
