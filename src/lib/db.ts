/**
 * Thin data-access helpers over Supabase.
 *
 * Public site  → uses the anon key + RLS allows SELECT on published rows.
 * Admin site   → uses the same anon key but the user is authenticated via
 *                 Supabase Auth → RLS allows SELECT + INSERT + UPDATE + DELETE.
 */

import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Profile {
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
  updated_at: string;
}

export interface Skill {
  id: string;
  category: string;
  sort_order: number;
  name: string;
  icon: string;
  desc: string;
  level: number;
  published: boolean;
  slug?: string | null;
}

export interface Project {
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
  featured: boolean;
  slug?: string | null;
}

export interface Achievement {
  id: string;
  kind: "hackathon" | "certification" | "workshop" | "award" | "achievement";
  title: string;
  organisation: string;
  organisation_is_placeholder: boolean;
  date: string;
  date_is_placeholder: boolean;
  description: string;
  tags: string[];
  image_url: string | null;
  link_url: string;
  published: boolean;
  sort_order: number;
  slug?: string | null;
}

export interface JourneyStep {
  id: string;
  year: string;
  title: string;
  note: string;
  state: "done" | "now" | "next";
  published: boolean;
  sort_order: number;
  slug?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Profile                                                             */
/* ------------------------------------------------------------------ */

export async function getProfile(): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", "single")
    .single();
  return data;
}

export async function upprofile(patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: "single", ...patch }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("Profile save returned no row — check admin permissions.");
  return data as Profile;
}

/* ------------------------------------------------------------------ */
/*  Skills                                                              */
/* ------------------------------------------------------------------ */

export async function getSkills(): Promise<Skill[]> {
  const { data } = await supabase
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function upsertSkill(s: Partial<Skill> & { name: string; category: string }) {
  const { error } = await supabase.from("skills").upsert(s, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteSkill(id: string) {
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Projects                                                            */
/* ------------------------------------------------------------------ */

export async function getProjects(publishedOnly = true): Promise<Project[]> {
  let q = supabase.from("projects").select("*").order("sort_order", { ascending: true });
  if (publishedOnly) q = q.eq("published", true);
  const { data } = await q;
  return data ?? [];
}

export async function upsertProject(p: Partial<Project> & { title: string }) {
  const { error } = await supabase.from("projects").upsert(p, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Achievements                                                        */
/* ------------------------------------------------------------------ */

export async function getAchievements(publishedOnly = true): Promise<Achievement[]> {
  let q = supabase.from("achievements").select("*").order("sort_order", { ascending: true });
  if (publishedOnly) q = q.eq("published", true);
  const { data } = await q;
  return data ?? [];
}

export async function upsertAchievement(a: Partial<Achievement> & { title: string }) {
  const { error } = await supabase.from("achievements").upsert(a, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteAchievement(id: string) {
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Journey                                                             */
/* ------------------------------------------------------------------ */

export async function getJourney(): Promise<JourneyStep[]> {
  const { data } = await supabase
    .from("journey")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function upsertJourney(j: Partial<JourneyStep> & { title: string }) {
  const { error } = await supabase.from("journey").upsert(j, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteJourney(id: string) {
  const { error } = await supabase.from("journey").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  About                                                              */
/* ------------------------------------------------------------------ */

export interface AboutRow {
  id: string;
  kind: "paragraph" | "milestone";
  heading: string;
  body: string;
  year: string;
  published: boolean;
  sort_order: number;
}

export async function getAbout(): Promise<AboutRow[]> {
  const { data, error } = await supabase
    .from("about")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertAbout(row: Partial<AboutRow> & { kind: string }) {
  const { error } = await supabase.from("about").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteAbout(id: string) {
  const error = await supabase.from("about").delete().eq("id", id);
  if (error.error) throw error.error;
}

/* ------------------------------------------------------------------ */
/*  Resume                                                             */
/* ------------------------------------------------------------------ */

export interface ResumeRow {
  id: string;
  label: string;
  file_url: string;
  file_size: number | null;
  is_active: boolean;
  published: boolean;
  sort_order: number;
}

export async function getActiveResume(): Promise<ResumeRow | null> {
  const { data } = await supabase
    .from("resume")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return data;
}

export async function upsertResume(row: Partial<ResumeRow> & { file_url: string }) {
  const { error } = await supabase.from("resume").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Generic CMS helpers (admin). Every write reads the row back so a   */
/*  write silently blocked by RLS (0 rows) surfaces as an error.       */
/* ------------------------------------------------------------------ */

export type CmsTable = "projects" | "skills" | "achievements" | "journey";

/** Columns the database owns — never sent from the admin forms. */
const READ_ONLY = ["id", "created_at", "updated_at", "slug"];

function writable(row: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (!READ_ONLY.includes(k)) out[k] = v;
  return out;
}

/** All rows (admin RLS returns drafts too), ordered for display. */
export async function listRows<T>(table: CmsTable): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

/**
 * Columns added by src/lib/cms_migration.sql. Until that file has been run in
 * Supabase they do not exist, and PostgREST rejects any write that names them
 * (PGRST204). Writes then retry WITHOUT these optional columns so the admin
 * keeps working on the current schema. Any other missing column still errors.
 */
const MIGRATION_ONLY_COLUMNS = new Set(["featured", "organisation_is_placeholder", "date_is_placeholder", "link_url"]);

function droppableColumn(err: { code?: string; message?: string } | null): string | null {
  if (!err || err.code !== "PGRST204") return null;
  const col = /'([^']+)' column/.exec(err.message ?? "")?.[1];
  return col && MIGRATION_ONLY_COLUMNS.has(col) ? col : null;
}

async function writeWithFallback<R>(
  body: Record<string, unknown>,
  send: (b: Record<string, unknown>) => PromiseLike<{ data: R | null; error: { code?: string; message: string } | null }>,
): Promise<{ data: R | null; error: { code?: string; message: string } | null }> {
  const b = { ...body };
  for (let i = 0; i <= MIGRATION_ONLY_COLUMNS.size; i++) {
    const res = await send(b);
    const col = droppableColumn(res.error);
    if (!col || !(col in b)) return res;
    delete b[col];
  }
  return send(b);
}

export async function insertRow<T extends object>(table: CmsTable, row: T): Promise<T> {
  const { data, error } = await writeWithFallback(writable(row), (b) => supabase.from(table).insert(b).select().single());
  if (error) throw new Error(`Could not create: ${error.message}`);
  return data as unknown as T;
}

export async function updateRow<T extends object>(table: CmsTable, id: string, patch: Partial<T>): Promise<T> {
  const { data, error } = await writeWithFallback(writable(patch), (b) =>
    supabase.from(table).update(b).eq("id", id).select().maybeSingle(),
  );
  if (error) throw new Error(`Could not save: ${error.message}`);
  if (!data) throw new Error("Nothing was saved — the row was not found or your account is not an admin.");
  return data as T;
}

export async function deleteRow(table: CmsTable, id: string): Promise<void> {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) throw new Error(`Could not delete: ${error.message}`);
  if (!data || data.length !== 1) throw new Error("Nothing was deleted — the row was not found or your account is not an admin.");
}

/** Persist a new display order: rows[i].sort_order = i (only changed rows are written). */
export async function saveOrder(table: CmsTable, rows: { id: string; sort_order: number }[]): Promise<void> {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].sort_order !== i) await updateRow(table, rows[i].id, { sort_order: i } as never);
  }
}

/** true once src/lib/cms_migration.sql has run and verified the import. */
export async function getCmsMigrated(): Promise<boolean> {
  const { data, error } = await supabase.from("profiles").select("cms_migrated").eq("id", "single").maybeSingle();
  if (error || !data) return false;
  return (data as { cms_migrated?: boolean }).cms_migrated === true;
}
