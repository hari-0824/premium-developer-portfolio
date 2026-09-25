import { useRef } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { Award, BookOpen, Building2, CalendarDays, Check, GraduationCap, Trophy } from "lucide-react";
import { portfolioData } from "@/data/portfolioData";
import { Engraved, Reveal, Section } from "@/components/ui";

const p = portfolioData;

const GOLD = { tone: "var(--amber)", ring: "color-mix(in srgb, var(--amber) 45%, transparent)", wash: "var(--amber-wash)", edge: "var(--amber)" };
const BLUE = { tone: "var(--brand-light)", ring: "color-mix(in srgb, var(--brand) 55%, transparent)", wash: "var(--brand-wash)", edge: "var(--brand)" };
const KIND_META: Record<string, { icon: typeof Award; label: string } & typeof GOLD> = {
  award: { icon: Award, label: "Award", ...GOLD },
  hackathon: { icon: Trophy, label: "Hackathon", ...GOLD },
  achievement: { icon: Award, label: "Achievement", ...GOLD },
  certification: { icon: BookOpen, label: "Certification", ...BLUE },
  workshop: { icon: GraduationCap, label: "Workshop", ...BLUE },
};
/** Unknown kinds (future CMS values) fall back to a neutral style instead of crashing. */
const kindMeta = (kind: string) =>
  KIND_META[kind] ?? { icon: Award, label: kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "Achievement", ...BLUE };

export function Achievements() {
  return (
    <Section id="achievements" index="05" label="Achievements">
      <Reveal>
        <Engraved index="05" tone="brand">
          Achievements &amp; Certifications
        </Engraved>
        <h2 id="achievements-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
          Proof of work
        </h2>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Awards, certifications and workshops. Fields marked
          <span className="mono px-1 text-[12.5px]" style={{ color: "var(--amber)" }}>
            to be added
          </span>
          are placeholders — fill them in from
          <span className="mono px-1 text-[12.5px]" style={{ color: "var(--brand-light)" }}>
            portfolioData.achievements
          </span>
          rather than leaving them blank.
        </p>
      </Reveal>

      <ol className="relative mt-12 space-y-5 pl-12 sm:pl-16">
        {/* spine */}
        <span
          className="absolute left-[15px] top-2 bottom-2 w-px"
          style={{ background: "linear-gradient(180deg, var(--brand), var(--line), transparent)" }}
          aria-hidden="true"
        />

        {p.achievements.map((a, i) => {
          const meta = kindMeta(a.kind);
          const Icon = meta.icon;
          return (
            <Reveal as="li" key={a.id} delay={i * 0.08} className="relative">
              {/* node */}
              <span
                className="absolute -left-12 top-6 grid h-8 w-8 place-items-center rounded-full sm:-left-16"
                style={{ border: `1px solid ${meta.ring}`, background: "var(--panel)", color: meta.tone }}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>

              <article
                className="card-lift group relative rounded-2xl p-5 sm:p-6"
                style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px ${meta.edge}` }}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="mono rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                    style={{ background: meta.wash, color: meta.tone }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="mono inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px]"
                    style={{
                      border: `1px ${a.dateIsPlaceholder ? "dashed" : "solid"} var(--line)`,
                      color: a.dateIsPlaceholder ? "var(--dim)" : "var(--muted)",
                    }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Date: </span>
                    {a.date}
                  </span>
                </div>

                <h3 className="display mt-3 text-[20px] font-semibold sm:text-[23px]" style={{ color: "var(--text)" }}>
                  {a.title}
                </h3>

                <p className="mono mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px]" style={{ color: a.organisationIsPlaceholder ? "var(--dim)" : "var(--brand-light)" }}>
                  <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">Organisation: </span>
                  {a.organisation}
                  {a.organisationIsPlaceholder && (
                    <span
                      className="ml-1 rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em]"
                      style={{ border: "1px dashed var(--line-strong)", color: "var(--dim)" }}
                    >
                      editable
                    </span>
                  )}
                </p>

                <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {a.description}
                </p>

                {a.tags && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <li
                        key={t}
                        className="mono rounded-md px-2.5 py-1.5 text-[10.5px]"
                        style={{ border: "1px solid var(--line)", color: "var(--muted)" }}
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Journey — scroll-driven progress spine                              */
/* ------------------------------------------------------------------ */
export function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 65%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });

  const stateColor = (s: string) =>
    s === "done" ? "var(--brand)" : s === "now" ? "var(--amber)" : "var(--dim)";

  /* one entry per year: planned < in progress < completed only when every step is done */
  const years = Object.values(
    p.journey.reduce<Record<string, { year: string; states: string[] }>>((acc, st) => {
      (acc[st.year] ??= { year: st.year, states: [] }).states.push(st.state);
      return acc;
    }, {}),
  )
    .sort((a, b) => a.year.localeCompare(b.year, undefined, { numeric: true }))
    .map((y) => ({
      year: y.year,
      state: y.states.every((x) => x === "done") ? "done" : y.states.some((x) => x !== "next") ? "now" : "next",
    }));

  return (
    <Section id="journey" index="06" label="My Journey">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Engraved index="06" tone="brand">
              My Journey
            </Engraved>
            <h2 id="journey-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
              2024 → 2028
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { s: "done", l: "Completed" },
              { s: "now", l: "In progress" },
              { s: "next", l: "Planned" },
            ].map((k) => (
              <span key={k.s} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: stateColor(k.s) }} />
                <span className="engraved text-[9.5px]">{k.l}</span>
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* progression at a glance — derived from the journey steps */}
      <Reveal delay={0.05}>
        <ol className="no-wrap-anywhere mt-10 flex items-center overflow-x-auto pb-1" aria-label="Journey progress by year">
          {years.map((y, i) => (
            <li key={y.year} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span className="flex shrink-0 flex-col items-center gap-1.5">
                <span
                  className="grid h-7 w-7 place-items-center rounded-full border-2"
                  style={{
                    borderColor: stateColor(y.state),
                    background: y.state === "done" ? stateColor(y.state) : "var(--bg)",
                  }}
                  aria-hidden="true"
                >
                  {y.state === "done" ? (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  ) : y.state === "now" ? (
                    <span className="led h-2 w-2 rounded-full" style={{ background: stateColor(y.state) }} />
                  ) : null}
                </span>
                <span className="mono text-[11px] font-semibold tabular-nums" style={{ color: y.state === "next" ? "var(--dim)" : "var(--text)" }}>
                  {y.year}
                </span>
                <span className="sr-only">{y.state === "done" ? "completed" : y.state === "now" ? "in progress" : "planned"}</span>
              </span>
              {i < years.length - 1 && (
                <span
                  className="mx-2 mb-5 h-[2px] min-w-4 flex-1 rounded-full"
                  style={{ background: years[i + 1].state === "next" ? "var(--line)" : "linear-gradient(90deg, var(--brand), var(--brand-light))" }}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </Reveal>

      <div ref={ref} className="relative mt-10 pl-10 sm:pl-14">
        {/* static spine */}
        <span
          className="absolute left-[7px] top-1 bottom-1 w-px"
          style={{ background: "var(--line)" }}
          aria-hidden="true"
        />
        {/* scroll-driven fill */}
        <motion.span
          className="absolute left-[7px] top-1 w-px origin-top"
          style={{
            height: "calc(100% - 8px)",
            background: "linear-gradient(180deg, var(--brand-light), var(--brand))",
            scaleY: reduce ? 1 : fill,
          }}
          aria-hidden="true"
        />

        <ol className="space-y-3">
          {p.journey.map((step, i) => (
            <motion.li
              key={step.year + step.title}
              initial={reduce ? false : { opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              <span
                className="absolute -left-[43px] top-[17px] grid h-5 w-5 place-items-center rounded-full border-2 transition-transform duration-300 group-hover:scale-110 sm:-left-[59px]"
                style={{
                  borderColor: stateColor(step.state),
                  background: step.state === "done" ? stateColor(step.state) : "var(--bg)",
                  boxShadow: step.state === "now" ? "0 0 0 4px var(--amber-wash)" : undefined,
                }}
                aria-hidden="true"
              >
                {step.state === "done" ? (
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                ) : step.state === "now" ? (
                  <span className="led h-1.5 w-1.5 rounded-full" style={{ background: stateColor(step.state) }} />
                ) : null}
              </span>
              <div
                className="card-lift flex flex-col gap-1 rounded-xl px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
              >
                <span
                  className="mono w-14 shrink-0 text-[13px] font-semibold tabular-nums"
                  style={{ color: stateColor(step.state) }}
                >
                  {step.year}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15.5px] font-medium" style={{ color: "var(--text)" }}>
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-[13.5px] leading-snug" style={{ color: "var(--muted)" }}>
                    {step.note}
                  </p>
                </div>
                <span
                  className="mono mt-1.5 inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.16em] sm:ml-auto sm:mt-0 sm:self-auto"
                  style={{ color: stateColor(step.state), border: `1px solid color-mix(in srgb, ${stateColor(step.state)} 40%, transparent)` }}
                >
                  {step.state === "done" ? "complete" : step.state === "now" ? "active" : "planned"}
                </span>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
