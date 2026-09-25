/**
 * PortfolioProvider — loads portfolio content from Supabase and merges it
 * over the static `portfolioData`.
 *
 * Fallback rules:
 *  • Supabase not configured → static data stays as-is.
 *  • Table empty / query error → that section keeps its static data.
 *  • No blank page is ever produced.
 *
 * Values are written into the shared portfolioData object (typed cast), so the
 * existing public components read the merged result on re-render — no markup,
 * animation or styling changes anywhere in the public site.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onPortfolioChanged } from "@/lib/portfolioSync";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { portfolioData } from "@/data/portfolioData";

type AnyRec = Record<string, unknown>;
const store = portfolioData as unknown as {
  personal: AnyRec;
  socials: AnyRec;
  skills: unknown[];
  projects: unknown[];
  achievements: unknown[];
  journey: unknown[];
};

/* glyph mapping for achievements */
const GLYPH: Record<string, string> = {
  hackathon: "trophy",
  award: "trophy",
  certification: "scroll",
  workshop: "cap",
  achievement: "trophy",
};

/* ────────────────────────────────────────────────────────────────────────
 * PROFILE PHOTO — single source of truth for every public photo slot.
 * Priority:  Supabase profiles.profile_photo_url  →  static fallback.
 * Exposed as React state (not a mutated object) so consumers re-render.
 * ──────────────────────────────────────────────────────────────────────── */

/** Static fallback, captured before anything can change it. */
export const STATIC_PROFILE_PHOTO: string = String(portfolioData.personal.profilePhoto ?? "");

/** Legacy key written by the old public upload button — never read again. */
const LEGACY_PHOTO_KEY = "hhs-profile-photo";

type PhotoStatus = "loading" | "ready";
interface PortfolioCtx {
  photoStatus: PhotoStatus;
  /** Raw URL from Supabase, or null when the row has no photo. */
  profilePhotoUrl: string | null;
  /** Cache-buster derived from profiles.updated_at. */
  photoVersion: string;
  refresh: () => void;
}

const PortfolioContext = createContext<PortfolioCtx>({
  photoStatus: "ready",
  profilePhotoUrl: null,
  photoVersion: "",
  refresh: () => {},
});

function withVersion(url: string, version: string): string {
  if (!version) return url;
  return url + (url.includes("?") ? "&" : "?") + "v=" + encodeURIComponent(version);
}

/**
 * Photo for public components.
 *  • while the first Supabase read is in flight → src = null (no stale flash)
 *  • Supabase has a URL                          → that URL (+ ?v= cache-bust)
 *  • Supabase has none / not configured / error  → fallback
 */
export function useProfilePhoto(fallback: string = STATIC_PROFILE_PHOTO) {
  const { photoStatus, profilePhotoUrl, photoVersion } = useContext(PortfolioContext);
  const loading = photoStatus === "loading";
  const src = loading
    ? null
    : profilePhotoUrl
      ? withVersion(profilePhotoUrl, photoVersion)
      : fallback || null;
  return { src, fallbackSrc: fallback, loading, fromSupabase: !loading && !!profilePhotoUrl };
}

export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [, setTick] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [photo, setPhoto] = useState<{ status: PhotoStatus; url: string | null; version: string }>(
    { status: isSupabaseConfigured ? "loading" : "ready", url: null, version: "" },
  );
  const lastFocusFetch = useRef(0);

  /* One-time cleanup of the legacy localStorage photo (could be up to 5 MB). */
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_PHOTO_KEY);
    } catch {
      /* storage unavailable — nothing to clean */
    }
  }, []);

  /* Re-fetch when the admin saves (same/other tab) or this tab regains focus. */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const reload = () => setReloadKey((k) => k + 1);
    const off = onPortfolioChanged(reload);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastFocusFetch.current < 5000) return; // throttle
      lastFocusFetch.current = now;
      reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      off();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;

    /* Never leave the Hero empty: if Supabase is slow, fall back after 6 s. */
    const guard = window.setTimeout(() => {
      if (alive) setPhoto((p) => (p.status === "loading" ? { ...p, status: "ready" } : p));
    }, 6000);

    async function load() {
      try {
        const [profileRes, skillsRes, projectsRes, achieveRes, journeyRes, aboutRes, resumeRes] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("id", "single").maybeSingle(),
            supabase.from("skills").select("*").eq("published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
            supabase.from("projects").select("*").eq("published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
            supabase.from("achievements").select("*").eq("published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
            supabase.from("journey").select("*").eq("published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
            supabase.from("about").select("*").eq("published", true).order("sort_order", { ascending: true }),
            supabase.from("resume").select("*").eq("is_active", true).limit(1).maybeSingle(),
          ]);

        if (!alive) return;

        /* ── profile photo (state, not a mutated object) ── */
        const pr = profileRes.data;
        if (profileRes.error) {
          /* keep whatever we already show; first load falls back */
          setPhoto((p) => ({ ...p, status: "ready" }));
        } else {
          const url = typeof pr?.profile_photo_url === "string" && pr.profile_photo_url.trim()
            ? pr.profile_photo_url.trim()
            : null;
          const version = pr?.updated_at ? String(new Date(pr.updated_at).getTime()) : "";
          setPhoto({ status: "ready", url, version });
        }

        /* ── profile + socials ── */
        if (pr) {
          if (pr.full_name) {
            store.personal.fullName = pr.full_name;
            store.personal.fullNameWithInitial = pr.full_name;
          }
          if (pr.role) store.personal.role = pr.role;
          if (pr.status) store.personal.status = pr.status;
          if (pr.college) store.personal.college = pr.college;
          if (pr.graduation) store.personal.graduation = pr.graduation;
          if (pr.badge) store.personal.badge = pr.badge;
          if (pr.hero_lead) store.personal.heroLead = pr.hero_lead;
          if (pr.intro) store.personal.intro = pr.intro;
          if (pr.goal) store.personal.goal = pr.goal;
          if (pr.goal_label) store.personal.goalLabel = pr.goal_label;
          if (pr.github_url) store.socials.github = pr.github_url;
          if (pr.linkedin_url) store.socials.linkedin = pr.linkedin_url;
          if (pr.email) store.socials.email = pr.email;
        }

        /* resume: prefer the active resume row, then the profile column */
        const resumeUrl = resumeRes.data?.file_url ?? pr?.resume_url;
        if (resumeUrl) {
          store.socials.resumePdf = resumeUrl;
          /* Hero, Resume and Footer buttons read resume.fileUrl — point them at the
             uploaded PDF (the static fallback path has no file in /public). */
          (portfolioData as unknown as { resume: AnyRec }).resume.fileUrl = resumeUrl;
          (portfolioData as unknown as { resume: AnyRec }).resume.fromCms = true;
        }

        /* ── CMS source-of-truth rule for projects / skills / achievements / journey ──
         *  • cms_migrated = true  (set by src/lib/cms_migration.sql after it verified
         *    the import) → Supabase is the ONLY source, even when a table is empty,
         *    so admin deletes/unpublishes really remove items publicly.
         *  • not migrated yet → previous behaviour: Supabase rows if any, else the
         *    built-in content (the public site never goes blank before the import).
         *  • a query error never replaces what is currently shown. */
        const cmsMigrated = pr?.cms_migrated === true;
        const useRows = (res: { data: unknown[] | null; error: unknown }) =>
          !res.error && Array.isArray(res.data) && (cmsMigrated || res.data.length > 0);

        /* ── skills (grouped by category, only when rows exist) ── */
        const skillRows = skillsRes.data ?? [];
        if (useRows(skillsRes)) {
          const order = ["Programming", "Frontend", "Backend", "Database", "Tools", "AI & IoT"];
          const idx: Record<string, string> = {
            Programming: "3.1", Frontend: "3.2", Backend: "3.3",
            Database: "3.4", Tools: "3.5", "AI & IoT": "3.6",
          };
          const groups = order
            .map((cat) => ({
              index: idx[cat],
              category: cat,
              skills: skillRows
                .filter((s: AnyRec) => s.category === cat && s.published !== false)
                .map((s: AnyRec) => ({
                  name: String(s.name),
                  icon: String(s.icon),
                  level: Number(s.level),
                  desc: String(s.desc ?? ""),
                })),
            }))
            .filter((g) => g.skills.length > 0);
          store.skills = groups;
        }

        /* ── projects (published only) ── */
        const projectRows = projectsRes.data ?? [];
        if (useRows(projectsRes)) {
          store.projects = projectRows.map((r: AnyRec, i: number) => ({
            id: String(r.id),
            index: String(i + 1).padStart(2, "0"),
            title: String(r.title),
            kicker: String(r.kicker ?? ""),
            summary: String(r.summary ?? ""),
            /* No image → a src that fails instantly without any network request, so the
               card takes the design's own onError fallback (image hidden, panel shown) —
               pixel-identical to how a missing/broken image already behaves. An empty
               src would skip that path and render differently (alt text, filter layer). */
            image: typeof r.image_url === "string" && r.image_url.trim() ? r.image_url.trim() : "data:,",
            imageAlt: String(r.image_alt ?? ""),
            tags: (r.tags as string[]) ?? [],
            tech: (r.tech as string[]) ?? [],
            links: { github: String(r.github_url ?? ""), live: String(r.live_url ?? "") },
            detail: {
              problem: String(r.problem ?? ""),
              solution: String(r.solution ?? ""),
              features: (r.features as string[]) ?? [],
              stack: (r.stack as string[]) ?? [],
              contribution: String(r.contribution ?? ""),
              future: (r.future as string[]) ?? [],
            },
          }));
        }

        /* ── achievements (published only) ── */
        const achRows = achieveRes.data ?? [];
        if (useRows(achieveRes)) {
          store.achievements = achRows.map((r: AnyRec, i: number) => ({
            id: String(r.id ?? `ach-${i}`),
            kind: String(r.kind ?? "achievement"),
            glyph: GLYPH[String(r.kind)] ?? "trophy",
            title: String(r.title),
            organisation: String(r.organisation ?? ""),
            organisationIsPlaceholder:
              typeof r.organisation_is_placeholder === "boolean" ? r.organisation_is_placeholder : !r.organisation,
            date: String(r.date ?? ""),
            dateIsPlaceholder: typeof r.date_is_placeholder === "boolean" ? r.date_is_placeholder : !r.date,
            description: String(r.description ?? ""),
            tags: (r.tags as string[]) ?? [],
          }));
        }

        /* ── journey (published only) ── */
        const jRows = journeyRes.data ?? [];
        if (useRows(journeyRes)) {
          store.journey = jRows.map((r: AnyRec) => ({
            year: String(r.year),
            title: String(r.title),
            note: String(r.note ?? ""),
            state: String(r.state ?? "done"),
          }));
        }

        /* ── about paragraphs + milestones ── */
        const aboutRows = aboutRes.data ?? [];
        const paras = aboutRows.filter((r: AnyRec) => r.kind === "paragraph");
        const miles = aboutRows.filter((r: AnyRec) => r.kind === "milestone");
        if (paras.length > 0) store.personal.aboutBody = paras.map((r: AnyRec) => String(r.body));
        if (miles.length > 0)
          store.personal.timeline = miles.map((r: AnyRec) => ({
            year: String(r.year),
            title: String(r.body),
          }));

        /* re-render consumers reading the shared object */
        if (alive) setTick((t) => t + 1);
      } catch (err) {
        /* Never break the public site — static fallback stays active. */
        console.warn("[Portfolio] Supabase load failed, using static content:", err);
        if (alive) setPhoto((p) => ({ ...p, status: "ready" }));
      }
    }

    load();
    return () => {
      alive = false;
      window.clearTimeout(guard);
    };
  }, [reloadKey]);

  const value: PortfolioCtx = {
    photoStatus: photo.status,
    profilePhotoUrl: photo.url,
    photoVersion: photo.version,
    refresh: () => setReloadKey((k) => k + 1),
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
