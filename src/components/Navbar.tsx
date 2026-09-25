import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X, Sun, Moon, ArrowUpRight } from "lucide-react";
import { portfolioData } from "@/data/portfolioData";
import { Monogram } from "@/components/ui";
import { mailtoHref } from "@/lib/contact";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("hhs-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("hhs-theme", theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f6f6f8" : "#08090c");
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.15, 0.4, 0.75] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids.join("|")]);
  return active;
}

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const ids = portfolioData.nav.map((n) => n.id);
  const active = useActiveSection(ids);
  const reduce = useReducedMotion();
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  /* mobile sheet: focus the close button on open, return focus to the menu button on close */
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = window.setTimeout(() => closeBtn.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      menuBtn.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-all duration-500 ${
          scrolled ? "glass" : ""
        }`}
        style={{
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
        }}
      >
        <div className="mx-auto flex h-[68px] w-full max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          {/* identity */}
          <button
            onClick={() => go("home")}
            className="group flex items-center gap-3 rounded-lg pr-2 py-1"
            aria-label="Go to top"
          >
            <Monogram size={30} className="transition-transform duration-500 group-hover:rotate-[-6deg]" />
            <span className="hidden sm:block">
              <span className="mono block text-[11.5px] font-semibold tracking-[0.22em] uppercase">
                {portfolioData.personal.fullName}
              </span>
              <span className="engraved block text-[9px] tracking-[0.28em]">
                Java Full Stack Developer
              </span>
            </span>
          </button>

          {/* desktop nav */}
          <nav aria-label="Primary" className="hidden xl:flex items-center gap-1">
            {portfolioData.nav.map((item) => {
              const on = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  aria-current={on ? "location" : undefined}
                  className={`relative rounded-lg px-3.5 py-2 text-[12px] font-medium tracking-[0.06em] uppercase transition-colors duration-300 ${
                    on ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: "var(--brand-wash)",
                        border: "1px solid color-mix(in srgb, var(--brand) 38%, transparent)",
                      }}
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">
                    <span className="mono mr-1.5 text-[9px]" style={{ color: on ? "var(--brand-light)" : "var(--dim)" }}>
                      {item.index}
                    </span>
                    {item.label}
                  </span>
                  <span
                    className="absolute bottom-[3px] left-1/2 z-10 h-[2px] w-4 -translate-x-1/2 rounded-full transition-all duration-300"
                    style={{ background: "var(--amber)", opacity: on ? 1 : 0, transform: `translateX(-50%) scaleX(${on ? 1 : 0.3})` }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="group grid h-10 w-10 place-items-center rounded-lg transition-all duration-300 hover:border-[var(--brand)]"
              style={{ border: "1px solid var(--line)", background: "var(--brand-wash)" }}
            >
              <span className="relative block h-4 w-4">
                <Sun
                  className="absolute inset-0 h-4 w-4 transition-all duration-400"
                  style={{
                    opacity: theme === "light" ? 1 : 0,
                    transform: theme === "light" ? "rotate(0)" : "rotate(-90deg)",
                    color: "var(--amber)",
                  }}
                />
                <Moon
                  className="absolute inset-0 h-4 w-4 transition-all duration-400"
                  style={{
                    opacity: theme === "dark" ? 1 : 0,
                    transform: theme === "dark" ? "rotate(0)" : "rotate(90deg)",
                    color: "var(--brand-light)",
                  }}
                />
              </span>
            </button>

            <button
              ref={menuBtn}
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg xl:hidden transition-colors hover:border-[var(--brand)]"
              style={{ border: "1px solid var(--line)" }}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-4.5 w-4.5" style={{ color: "var(--text)" }} />
            </button>
          </div>
        </div>

        {/* scroll progress */}
        <div
          className="h-[2px] origin-left transition-transform duration-150 ease-out"
          style={{
            background: "linear-gradient(90deg, var(--brand), var(--brand-light))",
            transform: `scaleX(${progress / 100})`,
          }}
        />
      </header>

      {/* mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(18px)" }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex h-[68px] items-center justify-between px-6 border-b" style={{ borderColor: "var(--line)" }}>
                <span className="engraved">Navigation</span>
                <button
                  ref={closeBtn}
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid h-10 w-10 place-items-center rounded-lg"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 py-4" aria-label="Mobile">
                <ul>
                  {portfolioData.nav.map((item, i) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="border-b"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <button
                        onClick={() => go(item.id)}
                        className="group relative flex min-h-[56px] w-full items-baseline gap-4 py-4 pl-3 text-left"
                        aria-current={active === item.id ? "location" : undefined}
                      >
                        <span
                          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full transition-transform duration-300"
                          style={{ background: "var(--brand)", transform: `translateY(-50%) scaleY(${active === item.id ? 1 : 0})` }}
                          aria-hidden="true"
                        />
                        <span className="mono text-[10px] tracking-[0.2em]" style={{ color: "var(--brand-light)" }}>
                          {item.index}
                        </span>
                        <span
                          className="display text-[26px] font-medium transition-colors duration-300 group-hover:text-[var(--text)] sm:text-[28px]"
                          style={{ color: active === item.id ? "var(--text)" : "var(--muted)" }}
                        >
                          {item.label}
                        </span>
                        {active === item.id ? (
                          <span
                            className="mono ml-auto self-center rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]"
                            style={{ background: "var(--brand-wash)", color: "var(--brand-light)" }}
                          >
                            Current
                          </span>
                        ) : (
                          <ArrowUpRight
                            className="ml-auto h-4 w-4 self-center opacity-0 transition-opacity group-hover:opacity-100"
                            style={{ color: "var(--brand-light)" }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="border-t px-6 py-5" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-2">
                  <span className="led h-2 w-2 rounded-full" style={{ background: "var(--amber)" }} />
                  <span className="engraved">{portfolioData.personal.badge}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  {(["github", "linkedin", ...(mailtoHref() ? ["email" as const] : [])] as const).map((k) => (
                    <a
                      key={k}
                      href={k === "email" ? mailtoHref()! : portfolioData.socials[k]}
                      target={k === "email" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg py-2.5 text-center text-[11px] uppercase tracking-[0.14em]"
                      style={{ border: "1px solid var(--line)", color: "var(--muted)" }}
                    >
                      {k}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
