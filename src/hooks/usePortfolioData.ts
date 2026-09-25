/**
 * Hook that loads portfolio data from Supabase with fallback to static data.
 * If Supabase is not configured or returns empty, the static portfolioData
 * is used so the public site never appears blank.
 */

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { portfolioData } from "@/data/portfolioData";
import type { Skill } from "@/lib/db";

interface PortfolioState {
  profile: typeof portfolioData.personal;
  skills: typeof portfolioData.skills;
  projects: typeof portfolioData.projects;
  achievements: typeof portfolioData.achievements;
  journey: typeof portfolioData.journey;
  loading: boolean;
}

export function usePortfolioData(): PortfolioState {
  const [state, setState] = useState<PortfolioState>({
    profile: portfolioData.personal,
    skills: portfolioData.skills,
    projects: portfolioData.projects,
    achievements: portfolioData.achievements,
    journey: portfolioData.journey,
    loading: true,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        /* Profile */
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", "single")
          .single();

        /* Skills */
        const { data: skillRows } = await supabase
          .from("skills")
          .select("*")
          .order("sort_order", { ascending: true });

        /* Projects (published only) */
        const { data: projectRows } = await supabase
          .from("projects")
          .select("*")
          .eq("published", true)
          .order("sort_order", { ascending: true });

        /* Achievements (published only) */
        const { data: achieveRows } = await supabase
          .from("achievements")
          .select("*")
          .eq("published", true)
          .order("sort_order", { ascending: true });

        /* Journey */
        const { data: journeyRows } = await supabase
          .from("journey")
          .select("*")
          .order("sort_order", { ascending: true });

        if (cancelled) return;

        /* Merge DB data over static fallback */
        const profile = profileRow
          ? {
              ...portfolioData.personal,
              fullName: profileRow.full_name,
              role: profileRow.role,
              status: profileRow.status,
              college: profileRow.college,
              graduation: profileRow.graduation,
              badge: profileRow.badge,
              heroLead: profileRow.hero_lead,
              intro: profileRow.intro,
              goal: profileRow.goal,
              goalLabel: profileRow.goal_label,
              profilePhoto: profileRow.profile_photo_url ?? portfolioData.personal.profilePhoto,
            }
          : portfolioData.personal;

        const socials = profileRow
          ? {
              github: profileRow.github_url,
              linkedin: profileRow.linkedin_url,
              email: profileRow.email,
              resumePdf: profileRow.resume_url ?? portfolioData.socials.resumePdf,
            }
          : portfolioData.socials;

        const skills = skillRows?.length
          ? groupSkills(skillRows)
          : portfolioData.skills;

        const projects = projectRows?.length
          ? projectRows.map((p, i) => ({
              id: p.id,
              index: String(i + 1).padStart(2, "0"),
              title: p.title,
              kicker: p.kicker,
              summary: p.summary,
              image: p.image_url ?? "",
              imageAlt: p.image_alt,
              tags: (p.tags ?? []) as typeof portfolioData.projects[number]["tags"],
              tech: p.tech,
              links: { github: p.github_url, live: p.live_url },
              detail: {
                problem: p.problem,
                solution: p.solution,
                features: p.features,
                stack: p.stack,
                contribution: p.contribution,
                future: p.future,
              },
            }))
          : portfolioData.projects;

        const achievements = achieveRows?.length
          ? achieveRows.map((a) => ({
              id: a.id,
              kind: a.kind as typeof portfolioData.achievements[number]["kind"],
              glyph: (a.kind === "award" ? "trophy" : a.kind === "certification" ? "scroll" : "cap") as typeof portfolioData.achievements[number]["glyph"],
              title: a.title,
              organisation: a.organisation,
              organisationIsPlaceholder: !a.organisation,
              date: a.date,
              dateIsPlaceholder: !a.date,
              description: a.description,
              tags: a.tags,
            }))
          : portfolioData.achievements;

        const journey = journeyRows?.length
          ? journeyRows.map((j) => ({
              year: j.year,
              title: j.title,
              note: j.note,
              state: j.state as typeof portfolioData.journey[number]["state"],
            }))
          : portfolioData.journey;

        setState({
          profile: { ...profile, ...socials } as typeof portfolioData.personal,
          skills,
          projects,
          achievements,
          journey,
          loading: false,
        });
      } catch (err) {
        console.warn("[Portfolio] Failed to load from Supabase, using static data:", err);
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}

/* Group flat skill rows into category groups matching portfolioData shape */
function groupSkills(rows: Skill[]) {
  const map = new Map<string, Skill[]>();
  for (const s of rows) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  const cats = ["Programming", "Frontend", "Backend", "Database", "Tools", "AI & IoT"];
  const indexMap: Record<string, string> = {
    Programming: "3.1",
    Frontend: "3.2",
    Backend: "3.3",
    Database: "3.4",
    Tools: "3.5",
    "AI & IoT": "3.6",
  };
  return cats
    .filter((c) => map.has(c))
    .map((cat) => ({
      index: indexMap[cat] ?? "3.x",
      category: cat,
      skills: map.get(cat)!.map((s) => ({
        name: s.name,
        icon: s.icon as PortfolioSkillIcon,
        desc: s.desc,
        level: s.level,
      })),
    }));
}

type PortfolioSkillIcon = "code" | "python" | "js" | "markup" | "style" | "react" | "spring" | "api" | "sql" | "mongo" | "git" | "ide" | "ai" | "vision" | "chip" | "sensor";
