/**
 * GitHub public repository feed.
 *
 * Uses the unauthenticated REST API — no token, no secret, nothing to leak.
 * That endpoint returns only PUBLIC repositories, and allows 60 requests per
 * hour per IP, so results are cached in sessionStorage and fetched lazily
 * (only once the section scrolls into view).
 */

/** The GitHub username the feed is read from. */
export const GITHUB_USER = "hari-0824";
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USER}`;
export const GITHUB_REPOS_URL = `${GITHUB_PROFILE_URL}?tab=repositories`;

const ENDPOINT = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&direction=desc`;
const CACHE_KEY = `gh-repos:${GITHUB_USER}`;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/* ------------------------------------------------------------------ */
/*  Types — the subset of the REST response this UI actually reads.    */
/*  https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user
/* ------------------------------------------------------------------ */

/** Raw shape returned by the GitHub API (only the fields we consume). */
export interface GitHubApiRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  private: boolean;
  homepage: string | null;
}

/** Normalised repository used by the UI. */
export interface Repo {
  id: number;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
  homepage: string | null;
}

export type RepoError =
  | { kind: "rate-limit"; resetAt: Date | null }
  | { kind: "not-found" }
  | { kind: "network" }
  | { kind: "unknown"; status?: number };

interface CacheEntry {
  at: number;
  repos: Repo[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalise(r: GitHubApiRepo): Repo {
  return {
    id: r.id,
    name: r.name,
    url: r.html_url,
    description: r.description?.trim() ? r.description.trim() : null,
    language: r.language,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    updatedAt: r.pushed_at ?? r.updated_at,
    topics: Array.isArray(r.topics) ? r.topics.slice(0, 4) : [],
    isFork: !!r.fork,
    isArchived: !!r.archived,
    homepage: r.homepage?.trim() ? r.homepage.trim() : null,
  };
}

function readCache(): Repo[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry?.at || Date.now() - entry.at > CACHE_TTL) return null;
    return Array.isArray(entry.repos) ? entry.repos : null;
  } catch {
    return null; // private mode / corrupt entry
  }
}

function writeCache(repos: Repo[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos } satisfies CacheEntry));
  } catch {
    /* storage unavailable or full — caching is best-effort */
  }
}

/** "12 Mar 2026" — unambiguous for an international recruiter. */
export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "3 days ago" / "2 months ago" — relative recency at a glance. */
export function relativeUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/* ------------------------------------------------------------------ */
/*  Fetch                                                              */
/* ------------------------------------------------------------------ */

export type FetchResult = { ok: true; repos: Repo[]; cached: boolean } | { ok: false; error: RepoError };

/**
 * Load public repositories, newest activity first.
 * Returns the cached list when it is still fresh, so re-visiting the section
 * costs no extra API call.
 */
export async function fetchRepos(signal?: AbortSignal): Promise<FetchResult> {
  const cached = readCache();
  if (cached) return { ok: true, repos: cached, cached: true };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    });
  } catch {
    return { ok: false, error: { kind: "network" } };
  }

  if (!res.ok) {
    /* For anonymous requests a 403/429 from this endpoint is effectively always
       the hourly rate limit. GitHub CORS-exposes x-ratelimit-*, but a proxy can
       strip it — so treat the status as authoritative and use the header only
       to enrich the message with a reset time. */
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get("x-ratelimit-reset");
      const resetMs = reset ? Number(reset) * 1000 : NaN;
      return {
        ok: false,
        error: { kind: "rate-limit", resetAt: Number.isFinite(resetMs) ? new Date(resetMs) : null },
      };
    }
    if (res.status === 404) return { ok: false, error: { kind: "not-found" } };
    return { ok: false, error: { kind: "unknown", status: res.status } };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: { kind: "unknown" } };
  }
  if (!Array.isArray(data)) return { ok: false, error: { kind: "unknown" } };

  const repos = (data as GitHubApiRepo[])
    .filter((r) => !r.private) // defensive: this endpoint is public-only already
    .map(normalise)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  writeCache(repos);
  return { ok: true, repos, cached: false };
}

/** Brand-ish accent per language, falling back to the portfolio's own palette. */
export function languageColor(lang: string | null): string {
  if (!lang) return "var(--dim)";
  const map: Record<string, string> = {
    Java: "#e76f51",
    TypeScript: "#3178c6",
    JavaScript: "#f0a93b",
    Python: "#4b8bbe",
    HTML: "#e34c26",
    CSS: "#8b99ff",
    "C++": "#9c7bd6",
    C: "#8f9aa8",
    Dart: "#4fc3f7",
    Shell: "#89e051",
    Kotlin: "#a97bff",
  };
  return map[lang] ?? "var(--brand-light)";
}
