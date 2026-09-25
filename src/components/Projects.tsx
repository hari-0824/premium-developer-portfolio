import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { portfolioData, type Project } from "@/data/portfolioData";
import { Engraved, Reveal, Section } from "@/components/ui";
import { GithubIcon } from "@/components/BrandIcons";
import { usePortfolio } from "@/contexts/PortfolioProvider";
import { ProjectDetails, projectHref, useProjectRoute } from "@/components/ProjectDetails";

const p = portfolioData;
const FILTERS = p.projectFilters as readonly string[];

export function Projects() {
  const [filter, setFilter] = useState<string>("ALL");
  const reduce = useReducedMotion();
  /* details view state lives in the URL (#project/<slug>) so Back/Forward work */
  const ready = usePortfolio().photoStatus !== "loading"; // first Supabase load finished
  const details = useProjectRoute(p.projects as Project[], ready);

  const list =
    filter === "ALL" ? p.projects : p.projects.filter((pr) => pr.tags.includes(filter as "JAVA"));

  return (
    <Section id="projects" index="04" label="Featured Projects">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Engraved index="04" tone="brand">
              Featured Projects
            </Engraved>
            <h2 id="projects-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
              Things I actually built
            </h2>
          </div>
          <p className="max-w-sm text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Three selected builds. Adding a new project means appending one object to
            <span className="mono text-[12.5px]" style={{ color: "var(--brand-light)" }}> portfolioData.projects</span> — the layout scales to any number.
          </p>
        </div>
      </Reveal>

      {/* filters */}
      <div className="mt-9 flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects">
        {FILTERS.map((f) => {
          const on = filter === f;
          const count = f === "ALL" ? p.projects.length : p.projects.filter((pr) => pr.tags.includes(f as "JAVA")).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={on}
              className="group relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-all duration-300 hover:-translate-y-0.5"
              style={{
                border: `1px solid ${on ? "var(--brand)" : "var(--line)"}`,
                background: on ? "var(--brand-wash)" : "transparent",
                color: on ? "var(--brand-light)" : "var(--muted)",
              }}
            >
              <span className="mono">{f}</span>
              <span className="mono text-[9.5px] tabular-nums" style={{ color: "var(--dim)" }}>
                {String(count).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {/* editorial rows */}
      <div className="mt-10 space-y-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((pr, i) => (
            <motion.article
              key={pr.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -14, transition: { duration: 0.22 } }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1"
              style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
              onClick={(e) => {
                const t = e.target as HTMLElement;
                if (t.closest("a, button")) return; // real controls handle themselves
                if (window.getSelection()?.toString()) return; // user is selecting text
                details.open(pr, e.currentTarget.querySelector<HTMLElement>("h3 a"));
              }}
            >
              {/* glow border on hover */}
              <span
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 0 1px var(--brand), 0 30px 60px -40px var(--brand)" }}
                aria-hidden="true"
              />

              <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                {/* image */}
                <div className="plate relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[320px]">
                  <img
                    src={pr.image}
                    alt={pr.imageAlt || `${pr.title} project preview`}
                    loading="lazy"
                    decoding="async"
                    className="proj-img absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(200deg, color-mix(in srgb, var(--brand) 22%, transparent), transparent 55%), linear-gradient(0deg, color-mix(in srgb, var(--panel) 70%, transparent), transparent 45%)",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="display absolute left-5 top-4 font-bold leading-none"
                    style={{
                      fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                      color: "transparent",
                      WebkitTextStroke: "1px rgba(255,255,255,0.32)",
                    }}
                    aria-hidden="true"
                  >
                    {pr.index}
                  </span>
                </div>

                {/* body */}
                <div className="flex flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="engraved" style={{ color: "var(--brand-light)" }}>
                      Project {pr.index}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {pr.tags.map((t) => (
                        <span
                          key={t}
                          className="mono rounded px-2 py-1 text-[9.5px] tracking-[0.14em]"
                          style={{ border: "1px solid var(--line)", color: "var(--dim)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="display mt-4 text-[26px] font-semibold sm:text-[30px]" style={{ color: "var(--text)" }}>
                    <a
                      href={projectHref(pr)}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab/window: let the browser handle it
                        e.preventDefault();
                        details.open(pr, e.currentTarget);
                      }}
                      className="rounded-md transition-colors duration-300 hover:text-[var(--brand-light)]"
                    >
                      {pr.title}
                    </a>
                  </h3>
                  <p className="mono mt-1.5 text-[11.5px] tracking-[0.1em]" style={{ color: "var(--amber)" }}>
                    {pr.kicker}
                  </p>
                  <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {pr.summary}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {pr.tech.map((t) => (
                      <li
                        key={t}
                        className="chip rounded-md px-2.5 py-1.5 text-[10.5px] tracking-[0.08em]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-wrap gap-2.5 pt-7">
                    <button
                      type="button"
                      onClick={(e) => details.open(pr, e.currentTarget)}
                      aria-label={`View details: ${pr.title}`}
                      className="btn-sheen btn-press group/btn inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12.5px] font-medium transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(180deg, var(--brand), var(--brand-deep))",
                        color: "#fff",
                      }}
                    >
                      View Details
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" aria-hidden="true" />
                    </button>

                    {pr.links.github ? (
                    <a
                      href={pr.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${pr.title} source code on GitHub (opens in a new tab)`}
                      className="btn-outline btn-press inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[12.5px] font-medium hover:-translate-y-0.5"
                      style={{ border: "1px solid var(--line-strong)", background: "var(--raised)", color: "var(--text)" }}
                    >
                      <GithubIcon className="h-4 w-4" />
                      GitHub
                    </a>
                    ) : null}

                    {pr.links.live ? (
                      <a
                        href={pr.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${pr.title} live demo (opens in a new tab)`}
                        className="btn-outline btn-press inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[12.5px] font-medium hover:-translate-y-0.5"
                        style={{
                          border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)",
                          background: "var(--amber-wash)",
                          color: "var(--text)",
                        }}
                      >
                        Live Demo
                        <ArrowUpRight className="h-4 w-4" style={{ color: "var(--amber)" }} />
                      </a>
                    ) : (
                      <span
                        className="mono inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[11px]"
                        style={{ border: "1px dashed var(--line-strong)", color: "var(--dim)" }}
                        title="Add a live URL in portfolioData.projects[].links.live"
                      >
                        Live Demo — link to be added
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {list.length === 0 && (
          <div
            className="rounded-3xl px-6 py-16 text-center"
            style={{ border: "1px dashed var(--line-strong)", background: "var(--panel)" }}
          >
            <p className="mono text-[12px] tracking-[0.16em] uppercase" style={{ color: "var(--dim)" }}>
              No projects tagged {filter} yet
            </p>
            <button
              onClick={() => setFilter("ALL")}
              className="mt-4 text-[13px] underline"
              style={{ color: "var(--brand-light)" }}
            >
              Show all projects
            </button>
          </div>
        )}
      </div>

      <ProjectDetails
        project={details.project}
        list={p.projects as Project[]}
        onClose={details.close}
        onNavigate={details.go}
      />
    </Section>
  );
}

/* ------------------------------- modal ------------------------------- */
