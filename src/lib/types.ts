/**
 * Shared types + helper to map DB row → portfolioData shape.
 * The public site still uses portfolioData as a local fallback when
 * Supabase is not configured.  When it IS configured the DB values
 * override the static data at runtime.
 */

/* ------------------------------------------------------------------ */
/*  Database row types (mirror of what Supabase returns)                */
/* ------------------------------------------------------------------ */

export interface DbProfile {
  id: string;
  full_name: string;
  role: string;
  status: string;
  college: string;
  graduation: string;
  badge: string;
  hero_lead: string;
  intro: string;
  goal: string;
  goal_label: string;
  github_url: string;
  linkedin_url: string;
  email: string;
  profile_photo_url: string | null;
  resume_url: string | null;
}

export interface DbSkill {
  id: string;
  category: string;
  sort_order: number;
  name: string;
  icon: string;
  desc: string;
  level: number;
}

export interface DbProject {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  image_url: string | null;
  image_alt: string;
  tags: string[];
  tech: string[];
  github_url: string;
  live_url: string;
  problem: string;
  solution: string;
  features: string[];
  stack: string[];
  contribution: string;
  future: string[];
  published: boolean;
  sort_order: number;
}

export interface DbAchievement {
  id: string;
  kind: string;
  title: string;
  organisation: string;
  date: string;
  description: string;
  tags: string[];
  image_url: string | null;
  published: boolean;
  sort_order: number;
}

export interface DbJourney {
  id: string;
  year: string;
  title: string;
  note: string;
  state: string;
  sort_order: number;
}
