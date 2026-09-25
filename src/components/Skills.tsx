import { portfolioData } from "@/data/portfolioData";
import { motion, useReducedMotion } from "framer-motion";
import { Engraved, Glyph, Reveal, Section } from "@/components/ui";

const p = portfolioData;

export function Skills() {
  const reduce = useReducedMotion();
  return (
    <Section id="skills" index="03" label="Technology Stack">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Engraved index="03" tone="brand">
              Technology Stack
            </Engraved>
            <h2 id="skills-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
              The rack I build with
            </h2>
          </div>
          <p className="max-w-sm text-[14.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Grouped by layer rather than by logo. Proficiency values are self-assessed and editable in
            <span className="mono text-[12.5px]" style={{ color: "var(--brand-light)" }}> portfolioData.ts</span>.
          </p>
        </div>
      </Reveal>

      {/* rack of strips */}
      <div className="mt-12 space-y-10">
        {p.skills.map((group, gi) => (
          <Reveal key={group.category} delay={gi * 0.04}>
            <div className="grid gap-4 md:grid-cols-[150px_1fr] md:gap-8">
              <div className="flex items-start gap-3 md:sticky md:top-28 md:self-start">
                <span className="mono text-[10px] tracking-[0.18em]" style={{ color: "var(--brand-light)" }}>
                  {group.index}
                </span>
                <div>
                  <h3
                    className="mono text-[11.5px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: "var(--text)" }}
                  >
                    {group.category}
                  </h3>
                  <div className="mt-2 h-px w-8" style={{ background: "var(--brand)" }} />
                  <div className="mono mt-2 text-[10px] tabular-nums" style={{ color: "var(--dim)" }}>
                    {group.skills.length} {group.skills.length === 1 ? "skill" : "skills"}
                  </div>
                </div>
              </div>

              <ul className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--line)", background: "var(--panel)" }}>
                {group.skills.map((s, i) => (
                  <li
                    key={s.name + i}
                    className="row-hover group relative grid grid-cols-[auto_1fr] items-center gap-4 px-4 py-4 sm:grid-cols-[auto_1.1fr_1.3fr] sm:px-5"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_22px_-10px_var(--brand)]"
                      style={{ border: "1px solid var(--line)", background: "var(--brand-wash)", color: "var(--brand-light)" }}
                    >
                      <Glyph name={s.icon} className="h-[19px] w-[19px]" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-[15px] font-medium" style={{ color: "var(--text)" }}>
                          {s.name}
                        </span>
                        <span className="mono text-[11px] tabular-nums" style={{ color: "var(--dim)" }}>
                          {s.level}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug" style={{ color: "var(--muted)" }}>
                        {s.desc}
                      </p>
                      <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                        <motion.div
                          className="h-full origin-left rounded-full group-hover:brightness-125"
                          style={{
                            width: `${s.level}%`,
                            background: "linear-gradient(90deg, var(--brand-deep), var(--brand-light))",
                          }}
                          initial={reduce ? false : { scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.9, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                          role="img"
                          aria-label={`${s.name} proficiency ${s.level} of 100`}
                        />
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <div className="mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--dim)" }}>
                        Proficiency
                      </div>
                      <div className="mono mt-1 text-[11.5px]" style={{ color: "var(--muted)" }}>
                        {s.level >= 80 ? "Confident" : s.level >= 70 ? "Working knowledge" : "Learning"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
