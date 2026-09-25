import { Download, FileText, ArrowUpRight } from "lucide-react";
import { portfolioData } from "@/data/portfolioData";
import { Engraved, Reveal, Section } from "@/components/ui";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";
import { contactEmail, resumeUrl } from "@/lib/contact";

const p = portfolioData;

export function Resume() {
  const file = resumeUrl();   // null until a PDF is uploaded in Admin → Resume
  const email = contactEmail();
  return (
    <Section id="resume" index="08" label="Resume">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Engraved index="08" tone="brand">
              Resume
            </Engraved>
            <h2 id="resume-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
              One page, no filler
            </h2>
          </div>
          {file && (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View resume (PDF, opens in a new tab)"
                className="btn-outline btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[13px] font-medium hover:-translate-y-0.5 sm:h-14"
                style={{ border: "1px solid var(--line-strong)", background: "var(--brand-wash)", color: "var(--text)" }}
              >
                <FileText className="h-4 w-4" style={{ color: "var(--brand-light)" }} aria-hidden="true" />
                View Resume
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "var(--amber)" }} aria-hidden="true" />
              </a>
              <a
                href={file}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download resume (PDF)"
                className="btn-sheen btn-press group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-7 text-[13.5px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 sm:h-14"
                style={{ background: "linear-gradient(180deg, var(--brand), var(--brand-deep))", boxShadow: "0 14px 38px -14px var(--brand)" }}
              >
                <Download className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
                Download Resume
                <span className="mono rounded-md px-1.5 py-0.5 text-[9.5px] tracking-[0.14em]" style={{ background: "rgba(255,255,255,0.16)" }}>
                  PDF
                </span>
              </a>
            </div>
          )}
        </div>
      </Reveal>

      {/* the sheet */}
      <Reveal delay={0.08}>
        <article
          className="mt-10 overflow-hidden rounded-3xl"
          style={{ border: "1px solid var(--line-strong)", background: "#FAFAFC", color: "#12141A", boxShadow: "var(--shadow)" }}
          aria-label="Resume preview"
        >
          {/* sheet header */}
          <header
            className="flex flex-wrap items-end justify-between gap-4 px-6 py-6 sm:px-9 sm:py-8"
            style={{ borderBottom: "1px solid rgba(18,20,26,.14)" }}
          >
            <div>
              <div
                className="mono text-[10px] uppercase tracking-[0.24em]"
                style={{ color: "#4353E8" }}
              >
                Resume / {p.personal.graduation} batch
              </div>
              <h3 className="display mt-2 font-bold" style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)" }}>
                {p.personal.fullNameWithInitial}
              </h3>
              <p className="mono mt-1 text-[12.5px]" style={{ color: "#4A5060" }}>
                {p.personal.role} · {p.personal.status}
              </p>
            </div>
            <div className="mono text-[11.5px] leading-relaxed" style={{ color: "#4A5060" }}>
              {email && <div>{email}</div>}
              <div>{p.personal.college}</div>
              <div className="truncate">{p.socials.github.replace("https://", "")}</div>
            </div>
          </header>

          <div className="grid gap-x-9 gap-y-7 px-6 py-7 sm:px-9 sm:py-9 md:grid-cols-2">
            {p.resume.sections.map((sec) => (
              <section key={sec.title} className={sec.title === "Skills" || sec.title === "Projects" ? "md:col-span-1" : ""}>
                <div className="flex items-center gap-3">
                  <span className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "#4353E8" }}>
                    {sec.title}
                  </span>
                  <span className="h-px flex-1" style={{ background: "rgba(18,20,26,.14)" }} />
                </div>
                <ul className="mt-3 space-y-2">
                  {sec.rows.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[13.5px] leading-relaxed" style={{ color: "#2A2F3A" }}>
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "#4353E8" }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <footer
            className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-9"
            style={{ borderTop: "1px solid rgba(18,20,26,.14)", background: "#F1F2F6" }}
          >
            <span />
            <div className="flex gap-3">
              <a
                href={p.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="inline-flex items-center justify-center p-3 -m-3 transition-opacity hover:opacity-70"
                style={{ color: "#2A2F3A" }}
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href={p.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="inline-flex items-center justify-center p-3 -m-3 transition-opacity hover:opacity-70"
                style={{ color: "#2A2F3A" }}
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
            </div>
          </footer>
        </article>
      </Reveal>
    </Section>
  );
}
