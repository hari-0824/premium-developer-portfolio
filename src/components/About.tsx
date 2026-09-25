import { portfolioData } from "@/data/portfolioData";
import { Counter, Engraved, Reveal, Section } from "@/components/ui";

const p = portfolioData;

export function Stats() {
  return (
    <section aria-label="Key statistics" className="relative">
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl lg:grid-cols-4"
          style={{ border: "1px solid var(--line)", background: "var(--line)" }}
        >
          {p.stats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.07}
              className="group relative bg-[var(--panel)] px-5 py-7 transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--brand)_5%,var(--panel))] sm:px-7 sm:py-8"
            >
              <div className="engraved text-[9.5px]">{String(i + 1).padStart(2, "0")}</div>
              <div
                className="display mt-3 font-bold leading-none transition-colors duration-300"
                style={{ fontSize: "clamp(2rem, 4vw, 3.1rem)", color: "var(--text)" }}
              >
                {"display" in s && s.display ? (
                  (s as { display?: string }).display
                ) : (
                  <>
                    <Counter to={s.value} suffix={s.suffix} />
                  </>
                )}
              </div>
              <div className="mt-2.5 text-[13px]" style={{ color: "var(--muted)" }}>
                {s.label}
              </div>
              <div
                className="mt-4 h-px w-8 origin-left transition-all duration-500 group-hover:w-16"
                style={{ background: "var(--brand)" }}
                aria-hidden="true"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <Section id="about" index="02" label="About Me">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* portrait */}
        <Reveal className="lg:col-span-5">
          <figure className="group relative">
            <div
              className="relative overflow-hidden rounded-3xl p-[1.5px]"
              style={{
                background:
                  "linear-gradient(150deg, var(--brand), transparent 45%, transparent 60%, var(--brand-deep))",
              }}
            >
              <div className="plate relative aspect-[4/5] overflow-hidden rounded-[22px]">
                <img
                  src="images/portrait.jpg"
                  alt="Hari Hara Sudhan working at a desk, lit by the cool glow of a monitor"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.025]"
                  style={{ filter: "saturate(0.75) contrast(1.05)" }}
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 45%, color-mix(in srgb, var(--bg) 78%, transparent))" }}
                  aria-hidden="true"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-5">
                  <Engraved index="02.1" tone="brand">
                    {p.personal.status}
                  </Engraved>
                  <div className="display mt-2 text-[20px] font-medium" style={{ color: "var(--text)" }}>
                    {p.personal.fullNameWithInitial}
                  </div>
                  <div className="mono mt-1 text-[11px]" style={{ color: "var(--muted)" }}>
                    {p.personal.college}
                  </div>
                </figcaption>
              </div>
            </div>

            {/* goal plate */}
            <div
              className="regmark card-lift relative mt-4 rounded-2xl p-5"
              style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
            >
              <Engraved index="→" tone="amber">
                {p.personal.goalLabel}
              </Engraved>
              <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: "var(--text)" }}>
                {p.personal.goal}
              </p>
            </div>
          </figure>
        </Reveal>

        {/* prose + timeline */}
        <div className="lg:col-span-7">
          <Reveal>
            <Engraved index="02" tone="brand">
              Profile
            </Engraved>
            <h2 id="about-heading"
              className="display heading-accent mt-5 font-bold"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}
            >
              About Me
            </h2>
            <div className="mt-7 max-w-2xl space-y-5 text-[15.5px] leading-[1.8]" style={{ color: "var(--muted)" }}>
              {p.personal.aboutBody.map((para, i) => (
                <p key={i} className={i === 0 ? "text-[17px] leading-[1.7] sm:text-[18px]" : ""} style={i === 0 ? { color: "var(--text)" } : undefined}>
                  {para}
                </p>
              ))}
            </div>
          </Reveal>

          {/* mini timeline */}
          <Reveal delay={0.1} className="mt-10">
            <Engraved index="02.2">Timeline</Engraved>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
              {p.personal.timeline.map((m) => (
                <li
                  key={m.year}
                  className="group relative p-5 transition-colors duration-300"
                  style={{ background: "var(--panel)" }}
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="mono text-[13px] font-semibold tracking-[0.08em]"
                      style={{ color: "var(--brand-light)" }}
                    >
                      {m.year}
                    </span>
                    <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                    <span className="h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-150" style={{ background: "var(--amber)" }} />
                  </div>
                  <p className="mt-3 text-[14.5px]" style={{ color: "var(--text)" }}>
                    {m.title}
                  </p>
                  {m.note && (
                    <p className="mono mt-1 text-[11px]" style={{ color: "var(--dim)" }}>
                      {m.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
