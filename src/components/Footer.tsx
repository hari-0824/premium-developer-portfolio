import { portfolioData } from "@/data/portfolioData";
import { Monogram, Engraved } from "@/components/ui";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";
import { Mail } from "lucide-react";
import { mailtoHref, resumeUrl } from "@/lib/contact";

const p = portfolioData;

export function Footer() {
  const year = new Date().getFullYear();

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 76,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <footer className="relative border-t" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--panel) 60%, transparent)" }}>
      {/* finishing edge */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand-light) 50%, transparent), color-mix(in srgb, var(--amber) 40%, transparent), transparent)" }}
        aria-hidden="true"
      />
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* big wordmark */}
        <div className="py-12 sm:py-16">
          <div
            className="display font-bold leading-[0.92]"
            style={{
              fontSize: "clamp(2.4rem, 9vw, 7rem)",
              color: "transparent",
              WebkitTextStroke: "1px var(--line-strong)",
            }}
            aria-hidden="true"
          >
            {p.personal.fullNameWithInitial}
          </div>

          <div className="mt-8 grid gap-10 border-t pt-8 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="flex items-center gap-3">
                <Monogram size={36} />
                <div>
                  <div className="mono text-[12px] font-semibold tracking-[0.18em] uppercase">
                    {p.personal.fullNameWithInitial}
                  </div>
                  <div className="engraved text-[9.5px]">{p.personal.role}</div>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.personal.intro}
              </p>
              <div className="mt-5 inline-flex items-center gap-2.5 rounded-full px-3 py-1.5" style={{ border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)", background: "var(--amber-wash)" }}>
                <span className="led h-[6px] w-[6px] rounded-full" style={{ background: "var(--amber)" }} />
                <span className="mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--amber)" }}>
                  {p.personal.badge}
                </span>
              </div>
            </div>

            <nav aria-label="Footer">
              <Engraved index="→">Navigate</Engraved>
              <ul className="mt-4 grid grid-cols-2 gap-y-2.5">
                {p.nav.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => go(n.id)}
                      className="link-underline inline-block py-2.5 -my-2.5 text-[13.5px] transition-colors duration-300 hover:text-[var(--brand-light)]"
                      style={{ color: "var(--muted)" }}
                    >
                      {n.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => go("dashboard")}
                    className="link-underline inline-block py-2.5 -my-2.5 text-[13.5px] transition-colors duration-300 hover:text-[var(--brand-light)]"
                    style={{ color: "var(--muted)" }}
                  >
                    Dashboard
                  </button>
                </li>
              </ul>
            </nav>

            <div>
              <Engraved index="→">Elsewhere</Engraved>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: "GitHub", href: p.socials.github, Icon: GithubIcon },
                  { label: "LinkedIn", href: p.socials.linkedin, Icon: LinkedinIcon },
                  ...(mailtoHref() ? [{ label: "Email", href: mailtoHref()!, Icon: Mail }] : []),
                ].map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2.5 py-2.5 -my-2.5 text-[13.5px] transition-colors duration-300 hover:text-[var(--brand-light)]"
                      style={{ color: "var(--muted)" }}
                    >
                      <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      {label}
                    </a>
                  </li>
                ))}
                {resumeUrl() && (
                  <li className="pt-2">
                    <a
                      href={resumeUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View resume (PDF, opens in a new tab)"
                      className="mono inline-block py-2.5 -my-2.5 text-[12px] underline underline-offset-4 transition-colors hover:text-[var(--text)]"
                      style={{ color: "var(--brand-light)" }}
                    >
                      Resume (PDF)
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-start justify-between gap-3 border-t py-6 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="mono text-[11px]" style={{ color: "var(--dim)" }}>
            Designed &amp; Built by {p.personal.fullNameWithInitial}
          </p>
          <p className="mono text-[11px]" style={{ color: "var(--dim)" }}>
            © {year} · {p.personal.role} · {p.personal.college}
          </p>
        </div>
      </div>
    </footer>
  );
}
