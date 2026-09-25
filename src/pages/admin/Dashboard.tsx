import { useEffect, useState } from "react";
import { User, FolderGit2, Trophy, FileText, Code2, ScrollText, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getProjects, getAchievements, getSkills } from "@/lib/db";
import type { Profile, Project, Achievement, Skill } from "@/lib/db";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getProfile(), getProjects(false), getAchievements(false), getSkills()])
      .then(([p, pr, a, sk]) => {
        setProfile(p);
        setProjects(pr);
        setAchievements(a);
        setSkills(sk);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load dashboard data."));
  }, []);

  const pubProjects = projects.filter((p) => p.published).length;
  const pubAchievements = achievements.filter((a) => a.published).length;
  const certifications = achievements.filter((a) => a.kind === "certification").length;
  const photoOk = Boolean(profile?.profile_photo_url);
  const resumeOk = Boolean(profile?.resume_url);

  /* Public-site blockers: these fields gate recruiter-facing actions, so the
     public page hides the matching button until they are filled in. */
  const PLACEHOLDER = /^(your\.email@example\.com|you@example\.com)$/i;
  const rawEmail = (profile?.email ?? "").trim();
  const emailOk = !!rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail) && !PLACEHOLDER.test(rawEmail);
  const blockers = [
    !emailOk && { what: "Contact email", why: "every email action is hidden on the public site", where: "Profile" },
    !resumeOk && { what: "Resume PDF", why: "the View / Download Resume buttons are hidden", where: "Resume" },
  ].filter(Boolean) as { what: string; why: string; where: string }[];

  const cards = [
    {
      label: "Profile Status",
      value: profile ? (photoOk ? "Complete" : "Needs photo") : "—",
      sub: profile?.full_name ?? "Not loaded",
      icon: User,
      warn: !photoOk,
    },
    {
      label: "Projects",
      value: `${pubProjects} Published`,
      sub: `${projects.length} total`,
      icon: FolderGit2,
      warn: pubProjects === 0,
    },
    {
      label: "Skills",
      value: String(skills.length),
      sub: "Across all categories",
      icon: Code2,
      warn: skills.length === 0,
    },
    {
      label: "Achievements",
      value: `${pubAchievements} Published`,
      sub: `${achievements.length} total`,
      icon: Trophy,
      warn: pubAchievements === 0,
    },
    {
      label: "Certifications",
      value: String(certifications),
      sub: "Logged in achievements",
      icon: ScrollText,
      warn: certifications === 0,
    },
    {
      label: "Resume",
      value: resumeOk ? "1 Active" : "None",
      sub: resumeOk ? "Ready for download" : "Upload in Resume section",
      icon: FileText,
      warn: !resumeOk,
    },
    {
      label: "Photo",
      value: photoOk ? "Uploaded" : "Placeholder",
      sub: photoOk ? "Shown on public Hero" : "Add in Profile section",
      icon: ImageIcon,
      warn: !photoOk,
    },
    {
      label: "Signed in as",
      value: user?.email ? "Admin" : "—",
      sub: user?.email ?? "",
      icon: User,
      warn: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#8a90a2]">
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </p>
      )}

      {blockers.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[#fbbf24]"
        >
          <p className="font-medium">Hidden on the public site</p>
          <ul className="mt-2 space-y-1.5">
            {blockers.map((b) => (
              <li key={b.what} className="text-[13px] leading-relaxed">
                <span className="font-medium">{b.what}</span> is not set — {b.why}. Add it in{" "}
                <span className="text-[#fde68a]">{b.where}</span>.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-5 transition-colors hover:border-[rgba(91,108,255,0.3)]"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[rgba(91,108,255,0.1)] text-[#8b99ff]">
                <c.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-[#5a6072]">
                {c.label}
              </span>
              {c.warn && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#f59e0b]" title="Needs attention" />
              )}
            </div>
            <p className="mt-4 text-lg font-semibold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              {c.value}
            </p>
            <p className="mt-1 truncate text-xs text-[#5a6072]">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
