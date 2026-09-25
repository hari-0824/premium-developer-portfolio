/**
 * Single source of truth for "do we have a real, publishable contact email /
 * resume?".
 *
 * The static portfolioData ships placeholder values so the site never renders
 * blank before Supabase responds. Those placeholders must never reach a
 * recruiter: a mailto: that goes to `your.email@example.com`, or a resume
 * button that 404s, is worse than no button at all.
 *
 * Every public component asks these helpers instead of reading the raw field.
 */
import { portfolioData } from "@/data/portfolioData";

/** Values that exist only as scaffolding in portfolioData / the DB defaults. */
const PLACEHOLDER_EMAILS = new Set(["your.email@example.com", "you@example.com", "email@example.com"]);
const PLACEHOLDER_DOMAINS = [/@example\.(com|org|net)$/i, /@test\./i, /@localhost$/i];

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/**
 * The real contact email, or null when the CMS field is empty / still a
 * placeholder. Null means: render no email action at all.
 */
export function contactEmail(): string | null {
  const raw = (portfolioData.socials?.email ?? "").trim();
  if (!raw || !looksLikeEmail(raw)) return null;
  if (PLACEHOLDER_EMAILS.has(raw.toLowerCase())) return null;
  if (PLACEHOLDER_DOMAINS.some((rx) => rx.test(raw))) return null;
  return raw;
}

/** `mailto:` href with an optional pre-filled subject, or null when unavailable. */
export function mailtoHref(subject?: string, body?: string): string | null {
  const to = contactEmail();
  if (!to) return null;
  const qs = [
    subject ? `subject=${encodeURIComponent(subject)}` : "",
    body ? `body=${encodeURIComponent(body)}` : "",
  ].filter(Boolean).join("&");
  return `mailto:${to}${qs ? `?${qs}` : ""}`;
}

/**
 * The resume URL when a PDF has actually been uploaded through the CMS.
 * The static fallback path points at a file that does not exist in /public,
 * so a button using it would download nothing.
 */
export function resumeUrl(): string | null {
  const r = portfolioData.resume as { fileUrl?: string; fromCms?: boolean } | undefined;
  const url = (r?.fileUrl ?? "").trim();
  if (!url) return null;
  /* uploaded via Admin → Resume (absolute Supabase Storage URL) */
  if (r?.fromCms && /^https?:/i.test(url)) return url;
  return null;
}
