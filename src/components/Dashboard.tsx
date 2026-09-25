/**
 * Developer Dashboard — a live overview derived entirely from data already
 * loaded by PortfolioProvider (Supabase → portfolioData). No extra queries,
 * no hardcoded counts, no invented activity metrics.
 *
 * Everything here recomputes when the admin changes Projects / Skills /
 * Achievements / Journey / Resume, because those edits replace the same
 * portfolioData the public site renders from.
 */
import { useMemo } from "react";
import { ArrowUpRight, FileText, FolderGit2, Mail, Radio } from "lucide-react";
import { portfolioData } from "@/data/portfolioData";
import { Counter, Engraved, Glyph, Reveal, Section } from "@/components/ui";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";
import { usePortfolio } from "@/contexts/PortfolioProvider";
import { projectHref } from "@/components/ProjectDetails";
import { mailtoHref, resumeUrl } from "@/lib/contact";

const p = portfolioData;

const has = (s?: string | null) => typeof s === "string" && s.trim().length > 0;
const hasImage = (src?: string) => has(src) && src !== "data:,";

/** Same scroll offset the navbar and footer already use. */
function go(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: reduce ? "auto" : "smooth" });
}

const KIND_LABEL: Record<string, string> = {
  award: "Award",
  hackathon: "Hackathon",
  achievement: "Achievement",
  certification: "Certification",
  workshop: "Workshop",
};
const isGold = (kind: string) => kind === "award" || kind === "hackathon" || kind === "achievement";

export function Dashboard() {
  /* subscribe to the CMS context so this section re-renders when data arrives */
  usePortfolio();

  /* ---- everything below is derived from the currently loaded (published) data ---- */
  const projects = p.projects ?? [];
  const skillGroups = p.skills ?? [];
  const achievements = p.achievements ?? [];
  const journey = p.journey ?? [];

  const skillCount = useMemo(
    () => skillGroups.reduce((n, g) => n + (g.skills?.length ?? 0), 0),
    [skillGroups],
  );

  /** Current stage = latest in-progress milestone, else the latest completed one. */
  const current = useMemo(() => {
    const now = [...journey].reverse().find((s) => s.state === "now");
    const done = [...journey].reverse().find((s) => s.state === "done");
    return now ?? done ?? journey[0] ?? null;
  }, [journey]);

  const nextUp = useMemo(() => journey.find((s) => s.state === "next") ?? null, [journey]);
  const resumeReady = !!resumeUrl(); // true only once a PDF is uploaded via the CMS

  const stats = [
    { label: "Published projects", value: projects.length, to: "projects" },
    { label: "Skills tracked", value: skillCount, to: "skills" },
    { label: "Achievements", value: achievements.length, to: "achievements" },
    { label: "Journey milestones", value: journey.length, to: "journey" },
  ] as const;

  return (
    <Section id="dashboard" index="07" label="Developer Dashboard">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Engraved index="07" tone="brand">
              Developer Dashboard
            </Engraved>
            <h2 id="dashboard-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
              Status readout
            </h2>
          </div>
          <p className="max-w-sm text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            A live overview of this portfolio. Every number and card below is read from the
            same published content as the rest of the page.
          </p>
        </div>
      </Reveal>

      {/* ── row 1: profile status + terminal ── */}
      <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Reveal>
          <div className="panel-edge card-lift h-full rounded-2xl p-5 sm:p-6" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
            <Engraved index="→" tone="brand">
              Profile status
            </Engraved>
            <h3 className="display mt-4 text-[22px] font-semibold sm:text-[26px]" style={{ color: "var(--text)" }}>
              {p.personal.fullNameWithInitial}
            </h3>
            <p className="mt-1.5 text-[15px]" style={{ color: "var(--brand-light)" }}>
              {p.personal.role}
            </p>

            <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Fact label="Status" value={p.personal.status} />
              <Fact label="Graduation" value={p.personal.graduation} />
              <Fact label="College" value={p.personal.college} />
              <Fact label="Portfolio" value="Live" tone="brand" />
            </dl>

            {has(p.personal.badge) && (
              <p
                className="mt-6 inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5"
                style={{ border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)", background: "var(--amber-wash)" }}
              >
                <span className="led h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: "var(--amber)" }} aria-hidden="true" />
                <span className="mono text-[10.5px] uppercase tracking-[0.16em]" style={{ color: "var(--amber)" }}>
                  {p.personal.badge}
                </span>
              </p>
            )}
          </div>
        </Reveal>

        {/* terminal-style status card — factual lines only */}
        <Reveal delay={0.06}>
          <div
            className="panel-edge h-full overflow-hidden rounded-2xl"
            style={{ border: "1px solid var(--line)", background: "var(--raised)" }}
          >
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "color-mix(in srgb, var(--amber) 70%, transparent)" }} aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "color-mix(in srgb, var(--brand) 60%, transparent)" }} aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--line-strong)" }} aria-hidden="true" />
              <span className="engraved ml-2 text-[9.5px]">status.sh</span>
              <span className="mono ml-auto inline-flex items-center gap-1.5 text-[10px]" style={{ color: "var(--brand-light)" }}>
                <Radio className="h-3 w-3" aria-hidden="true" />
                live
              </span>
            </div>
            <dl className="mono space-y-3.5 p-5 text-[12.5px] sm:text-[13px]">
              <TermLine label="whoami" value={p.personal.fullNameWithInitial} />
              {current && <TermLine label="currently_building" value={`${current.title} (${current.year})`} tone="brand" />}
              <TermLine label="primary_focus" value={p.personal.role} tone="brand" />
              {nextUp && <TermLine label="next_up" value={`${nextUp.title} (${nextUp.year})`} />}
              <TermLine label="portfolio_status" value="Live" tone="amber" />
              <div className="flex items-center gap-2 pt-0.5">
                <span style={{ color: "var(--brand-light)" }} aria-hidden="true">$</span>
                <span className="caret inline-block h-[14px] w-[7px]" style={{ background: "var(--brand-light)" }} aria-hidden="true" />
              </div>
            </dl>
          </div>
        </Reveal>
      </div>

      {/* ── row 2: live counts ── */}
      <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <button
              type="button"
              onClick={() => go(s.to)}
              className="card-lift panel-edge group h-full w-full rounded-2xl p-5 text-left"
              style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
              aria-label={`${s.value} ${s.label} — go to the ${s.to} section`}
            >
              <span className="engraved block text-[9.5px]">{s.label}</span>
              {s.value > 0 ? (
                <span className="display mt-3 block font-bold leading-none" style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", color: "var(--text)" }}>
                  <Counter to={s.value} />
                </span>
              ) : (
                <span className="display mt-3 block leading-none" style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", color: "var(--dim)" }} aria-hidden="true">
                  —
                </span>
              )}
              <span className="mono mt-2 block text-[10.5px]" style={{ color: "var(--dim)" }}>
                {s.value > 0 ? "published" : "nothing published yet"}
              </span>
              <span
                className="mt-4 block h-px w-8 origin-left transition-all duration-500 group-hover:w-16"
                style={{ background: "var(--brand)" }}
                aria-hidden="true"
              />
            </button>
          </Reveal>
        ))}
      </div>

      {/* ── row 3: current focus + tech stack ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Reveal>
          <div className="panel-edge h-full rounded-2xl p-5 sm:p-6" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
            <Engraved index="→" tone="brand">
              Current focus
            </Engraved>
            {current ? (
              <>
                <p className="mono mt-4 text-[11px] tabular-nums" style={{ color: "var(--brand-light)" }}>
                  {current.year} · {current.state === "now" ? "in progress" : "latest completed"}
                </p>
                <h3 className="display mt-2 text-[21px] font-semibold sm:text-[24px]" style={{ color: "var(--text)" }}>
                  {current.title}
                </h3>
                {has(current.note) && (
                  <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {current.note}
                  </p>
                )}
                {nextUp && (
                  <p className="mono mt-5 flex flex-wrap items-baseline gap-x-2 border-t pt-4 text-[11.5px]" style={{ borderColor: "var(--line)", color: "var(--dim)" }}>
                    <span className="engraved text-[9.5px]">Next</span>
                    <span style={{ color: "var(--muted)" }}>
                      {nextUp.title} ({nextUp.year})
                    </span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => go("journey")}
                  className="btn-outline btn-press mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12.5px] font-medium"
                  style={{ border: "1px solid var(--line-strong)", color: "var(--text)" }}
                >
                  Full journey
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <Empty text="No journey milestones published yet." />
            )}
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="panel-edge h-full rounded-2xl p-5 sm:p-6" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Engraved index="→" tone="brand">
                Current tech stack
              </Engraved>
              {skillCount > 0 && (
                <span className="mono shrink-0 text-[10.5px] tabular-nums" style={{ color: "var(--dim)" }}>
                  {skillCount} across {skillGroups.length}
                </span>
              )}
            </div>
            {skillCount > 0 ? (
              <ul className="mt-5 space-y-4">
                {skillGroups.map((g) => (
                  <li key={g.category}>
                    <h3 className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      {g.category}
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {g.skills.map((s, i) => (
                        <li key={s.name + i} className="chip inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
                          <Glyph name={s.icon} className="h-3.5 w-3.5 shrink-0" />
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No skills published yet." />
            )}
          </div>
        </Reveal>
      </div>

      {/* ── row 4: project + achievement snapshots ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="panel-edge h-full rounded-2xl p-5 sm:p-6" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Engraved index="→" tone="brand">
                Project snapshot
              </Engraved>
              {projects.length > 0 && (
                <span className="mono shrink-0 text-[10.5px] tabular-nums" style={{ color: "var(--dim)" }}>
                  {String(projects.length).padStart(2, "0")} published
                </span>
              )}
            </div>

            {projects.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {projects.map((pr) => (
                  <li key={pr.id}>
                    <a
                      href={projectHref(pr)}
                      className="row-hover group flex min-h-[56px] items-center gap-3.5 rounded-xl p-2.5"
                      style={{ border: "1px solid var(--line)" }}
                      aria-label={`Open case study: ${pr.title}`}
                    >
                      <span className="plate grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-lg" aria-hidden="true">
                        {hasImage(pr.image) ? (
                          <img src={pr.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        ) : (
                          <FolderGit2 className="h-4 w-4" style={{ color: "var(--dim)" }} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium" style={{ color: "var(--text)" }}>
                          {pr.title}
                        </span>
                        {pr.tags?.length > 0 && (
                          <span className="mono block truncate text-[10px] tracking-[0.12em]" style={{ color: "var(--dim)" }}>
                            {pr.tags.join(" · ")}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ color: "var(--brand-light)" }}
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No projects published yet." />
            )}
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="panel-edge h-full rounded-2xl p-5 sm:p-6" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Engraved index="→" tone="amber">
                Achievement snapshot
              </Engraved>
              {achievements.length > 0 && (
                <span className="mono shrink-0 text-[10.5px] tabular-nums" style={{ color: "var(--dim)" }}>
                  {String(achievements.length).padStart(2, "0")} published
                </span>
              )}
            </div>

            {achievements.length > 0 ? (
              <ul className="mt-5 space-y-2.5">
                {achievements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl p-3.5"
                    style={{ border: "1px solid var(--line)" }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="mono rounded-md px-2 py-0.5 text-[9.5px] uppercase tracking-[0.14em]"
                        style={{
                          background: isGold(a.kind) ? "var(--amber-wash)" : "var(--brand-wash)",
                          color: isGold(a.kind) ? "var(--amber)" : "var(--brand-light)",
                        }}
                      >
                        {KIND_LABEL[a.kind] ?? a.kind}
                      </span>
                      {has(a.date) && (
                        <span className="mono text-[10.5px]" style={{ color: a.dateIsPlaceholder ? "var(--dim)" : "var(--muted)" }}>
                          <span className="sr-only">Date: </span>
                          {a.date}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[14.5px] font-medium" style={{ color: "var(--text)" }}>
                      {a.title}
                    </p>
                    {has(a.organisation) && (
                      <p className="mono mt-1 text-[11px]" style={{ color: a.organisationIsPlaceholder ? "var(--dim)" : "var(--brand-light)" }}>
                        <span className="sr-only">Organisation: </span>
                        {a.organisation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No achievements published yet." />
            )}
          </div>
        </Reveal>
      </div>

      {/* ── row 5: quick actions ── */}
      <Reveal delay={0.08}>
        <nav
          className="panel-edge mt-4 rounded-2xl p-5 sm:p-6"
          style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
          aria-label="Dashboard quick actions"
        >
          <Engraved index="→">Quick actions</Engraved>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
            <Action onClick={() => go("projects")} icon={<FolderGit2 className="h-4 w-4" />} label="View Projects" primary />
            {resumeReady && <Action onClick={() => go("resume")} icon={<FileText className="h-4 w-4" />} label="View Resume" />}
            {has(p.socials.github) && (
              <Action href={p.socials.github} icon={<GithubIcon className="h-4 w-4" />} label="GitHub" external />
            )}
            {has(p.socials.linkedin) && (
              <Action href={p.socials.linkedin} icon={<LinkedinIcon className="h-4 w-4" />} label="LinkedIn" external />
            )}
            {(mailtoHref() || has(p.socials.linkedin)) && (
              <Action onClick={() => go("contact")} icon={<Mail className="h-4 w-4" />} label="Contact" />
            )}
          </div>
        </nav>
      </Reveal>
    </Section>
  );
}

/* ───────────────────────────── small parts ───────────────────────────── */

function Fact({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className="min-w-0">
      <dt className="engraved text-[9.5px]">{label}</dt>
      <dd className="mt-1 text-[13.5px]" style={{ color: tone === "brand" ? "var(--brand-light)" : "var(--text)" }}>
        {value}
      </dd>
    </div>
  );
}

function TermLine({ label, value, tone }: { label: string; value: string; tone?: "brand" | "amber" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-2" style={{ color: "var(--dim)" }}>
        <span style={{ color: "var(--brand-light)" }} aria-hidden="true">$</span>
        {label}
      </dt>
      <dd className="pl-4" style={{ color: tone === "brand" ? "var(--brand-light)" : tone === "amber" ? "var(--amber)" : "var(--text)" }}>
        {value}
      </dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p
      className="mono mt-5 rounded-xl px-4 py-6 text-center text-[11.5px]"
      style={{ border: "1px dashed var(--line-strong)", color: "var(--dim)" }}
    >
      {text}
    </p>
  );
}

function Action({
  label,
  icon,
  href,
  onClick,
  external,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  primary?: boolean;
}) {
  const cls = `${primary ? "btn-sheen text-white" : "btn-outline"} btn-press inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl px-4 text-[12.5px] font-medium transition-all duration-300 hover:-translate-y-0.5`;
  const style: React.CSSProperties = primary
    ? { background: "linear-gradient(180deg, var(--brand), var(--brand-deep))", boxShadow: "0 12px 30px -16px var(--brand)" }
    : { border: "1px solid var(--line-strong)", background: "var(--raised)", color: "var(--text)" };

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
        style={style}
        aria-label={external ? `${label} (opens in a new tab)` : label}
      >
        {icon}
        {label}
        {external && <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {icon}
      {label}
    </button>
  );
}
