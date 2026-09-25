import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Copy, FileText, Loader2, Mail, MapPin } from "lucide-react";
import { portfolioData } from "@/data/portfolioData";
import { Engraved, Reveal, Section } from "@/components/ui";
import { contactEmail, mailtoHref, resumeUrl } from "@/lib/contact";
import { isEmailJsConfigured, missingEmailJsVars, sendContactMessage } from "@/lib/emailjs";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

const p = portfolioData;

type Fields = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: "", email: "", subject: "", message: "" };

/** Prefilled subject for every email action that has none of its own. */
const DEFAULT_SUBJECT = `Portfolio Inquiry - ${portfolioData.personal.fullNameWithInitial}`;

function validate(v: Fields): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please enter your name.";
  else if (v.name.trim().length < 2) e.name = "Name looks too short.";

  if (!v.email.trim()) e.email = "Please enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    e.email = "That email address doesn’t look right.";

  /* Subject is optional — DEFAULT_SUBJECT is used when it is left blank. */
  if (v.subject.trim() && v.subject.trim().length < 3) e.subject = "Subject is too short.";

  if (!v.message.trim()) e.message = "Write a message first.";
  else if (v.message.trim().length < 15) e.message = "A little more detail helps — 15 characters minimum.";

  return e;
}

export function Contact() {
  const [v, setV] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  /* "sent" is set ONLY after EmailJS reports HTTP 200 — never optimistically. */
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);
  /* Honeypot: real bots fill hidden inputs, humans never see it. */
  const honeypot = useRef("");
  /* Genuine client-side throttle on top of the SDK's own rate limiting. */
  const lastSentAt = useRef(0);

  /* null when the CMS email is empty or still a placeholder */
  const email = contactEmail();
  const resume = resumeUrl();

  /* The form can actually deliver only when EmailJS is configured AND we have
     a destination inbox from the CMS profile. */
  const canSend = isEmailJsConfigured && !!email;
  const missingVars = missingEmailJsVars();

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (touched[k]) setErrors(validate({ ...v, [k]: e.target.value }));
  };
  const blur = (k: keyof Fields) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(v));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    const found = validate(v);
    setErrors(found);
    setTouched({ name: true, email: true, subject: true, message: true });
    if (Object.keys(found).length) {
      const first = document.querySelector<HTMLElement>(
        "[data-field='" + Object.keys(found)[0] + "'] input, [data-field='" + Object.keys(found)[0] + "'] textarea",
      );
      first?.focus();
      return;
    }

    /* silently accept-and-drop obvious bot submissions */
    if (honeypot.current.trim()) {
      setStatus("sent");
      setV(EMPTY);
      setTouched({});
      return;
    }

    if (!canSend || !email) return; // nothing configured — button is disabled anyway

    /* 15s cooldown between sends from one visitor */
    if (Date.now() - lastSentAt.current < 15_000) return;

    setStatus("sending");
    const res = await sendContactMessage({
      name: v.name.trim(),
      email: v.email.trim(),
      subject: v.subject.trim() || DEFAULT_SUBJECT,
      message: v.message.trim(),
      toEmail: email,
    });

    if (res.ok) {
      lastSentAt.current = Date.now();
      setStatus("sent");
      setV(EMPTY);      /* clear only on confirmed success */
      setTouched({});
      setErrors({});
    } else {
      /* keep everything the visitor typed so they can retry */
      setStatus("error");
    }
  };

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the address is visible as text anyway */
    }
  };

  const channels = [
    ...(email
      ? [{
          label: "Email Me",
          value: email,
          href: mailtoHref(DEFAULT_SUBJECT)!,
          Icon: Mail,
          aria: `Email ${email} — opens your mail app with the subject prefilled`,
        }]
      : []),
    {
      label: "LinkedIn",
      value: p.socials.linkedin.replace("https://", ""),
      href: p.socials.linkedin,
      Icon: LinkedinIcon,
      aria: "LinkedIn profile (opens in a new tab)",
    },
    {
      label: "GitHub",
      value: p.socials.github.replace("https://", ""),
      href: p.socials.github,
      Icon: GithubIcon,
      aria: "GitHub profile (opens in a new tab)",
    },
    ...(resume
      ? [{
          label: "View Resume",
          value: "Resume (PDF)",
          href: resume,
          Icon: FileText,
          aria: "View resume (PDF, opens in a new tab)",
        }]
      : []),
  ];

  return (
    <Section id="contact" index="09" label="Contact">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* left */}
        <div className="lg:col-span-5">
          <Reveal>
            <Engraved index="09" tone="brand">
              Contact
            </Engraved>
            <h2 id="contact-heading" className="display heading-accent mt-5 font-bold" style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>
              {p.contact.heading}
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {p.contact.body}
            </p>

            <div className="mt-7 flex items-center gap-2.5">
              <span className="led h-2 w-2 rounded-full" style={{ background: "var(--amber)" }} />
              <span className="engraved">{p.contact.responseNote}</span>
            </div>

            <ul className="mt-9 space-y-px overflow-hidden rounded-2xl" style={{ border: "1px solid var(--line)", background: "var(--line)" }}>
              {channels.map(({ label, value, href, Icon, aria }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={aria}
                    className="row-hover group flex items-center gap-4 px-5 py-4"
                    style={{ background: "var(--panel)" }}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:-translate-y-0.5"
                      style={{ border: "1px solid var(--line)", background: "var(--brand-wash)", color: "var(--brand-light)" }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="engraved block text-[9.5px]">{label}</span>
                      <span className="mono block truncate text-[13px]" style={{ color: "var(--text)" }}>
                        {value}
                      </span>
                    </span>
                    <ArrowRight
                      className="ml-auto h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      style={{ color: "var(--brand-light)" }}
                    />
                  </a>
                </li>
              ))}
            </ul>

            {email && (
              <button
                type="button"
                onClick={copyEmail}
                className="btn-outline btn-press mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[12px]"
                style={{ border: "1px solid var(--line)", color: "var(--muted)" }}
                aria-label={`Copy email address ${email} to the clipboard`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" style={{ color: "var(--brand-light)" }} aria-hidden="true" />
                    <span style={{ color: "var(--brand-light)" }}>Address copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy email address
                  </>
                )}
              </button>
            )}

            <p className="mono mt-6 flex items-center gap-2 text-[11px]" style={{ color: "var(--dim)" }}>
              <MapPin className="h-3.5 w-3.5" /> Chennai, Tamil Nadu, India
            </p>
          </Reveal>
        </div>

        {/* form */}
        <div className="lg:col-span-7">
          <Reveal delay={0.08}>
            <form
              onSubmit={submit}
              noValidate
              className="regmark relative overflow-hidden rounded-3xl p-6 sm:p-8"
              style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
            >
              <Engraved index="→" tone="brand">
                Send a message
              </Engraved>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Name" name="name" value={v.name} onChange={set("name")} onBlur={blur("name")} error={touched.name ? errors.name : undefined} placeholder="Your full name" autoComplete="name" />
                <Field label="Email" name="email" type="email" value={v.email} onChange={set("email")} onBlur={blur("email")} error={touched.email ? errors.email : undefined} placeholder="you@company.com" autoComplete="email" />
              </div>

              <div className="mt-5">
                <Field label="Subject" name="subject" value={v.subject} onChange={set("subject")} onBlur={blur("subject")} error={touched.subject ? errors.subject : undefined} placeholder="Internship / collaboration / question" />
              </div>

              <div className="mt-5">
                <Field label="Message" name="message" textarea value={v.message} onChange={set("message")} onBlur={blur("message")} error={touched.message ? errors.message : undefined} placeholder="Tell me what you're building…" />
              </div>

              {/* honeypot — hidden from humans and assistive tech, bots fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
                <label htmlFor="field-company">Company (leave blank)</label>
                <input
                  id="field-company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                  onChange={(e) => (honeypot.current = e.target.value)}
                />
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={!canSend || status === "sending"}
                  aria-disabled={!canSend || status === "sending"}
                  title={canSend ? undefined : "The contact form is not configured yet"}
                  aria-label={status === "sending" ? "Sending your message" : "Send message"}
                  className="btn-sheen btn-press group inline-flex h-12 items-center gap-2.5 rounded-xl px-7 text-[13px] font-medium text-white transition-all duration-300 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ background: "linear-gradient(180deg, var(--brand), var(--brand-deep))", boxShadow: "0 12px 34px -16px var(--brand)" }}
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Send Message
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </>
                  )}
                </button>

                <span className="mono text-[10.5px] leading-relaxed" style={{ color: "var(--dim)" }}>
                  {canSend
                    ? "Your message is sent securely through this contact form."
                    : email
                      ? "The form is offline right now — use the email, LinkedIn or GitHub links above."
                      : "Use the LinkedIn or GitHub links to get in touch."}
                </span>
              </div>

              {/* developer-only: never rendered in a production build */}
              {import.meta.env.DEV && missingVars.length > 0 && (
                <p
                  className="mono mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-[11px] leading-relaxed"
                  style={{ border: "1px dashed color-mix(in srgb, var(--amber) 50%, transparent)", background: "var(--amber-wash)", color: "var(--amber)" }}
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Dev notice: contact form disabled — missing {missingVars.join(", ")}. Add them to
                    <span className="px-1">.env</span>and restart the dev server.
                  </span>
                </p>
              )}

              {status === "sent" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex flex-wrap items-center gap-3 rounded-xl px-5 py-4"
                  style={{ border: "1px solid color-mix(in srgb, var(--brand) 45%, transparent)", background: "var(--brand-wash)" }}
                  role="status"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: "var(--brand)", color: "#fff" }}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[14px]" style={{ color: "var(--text)" }}>
                    Message sent successfully. I&apos;ll reply to the address you gave.
                  </span>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-xl px-5 py-4"
                  style={{ border: "1px solid color-mix(in srgb, var(--amber) 55%, transparent)", background: "var(--amber-wash)" }}
                  role="alert"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ border: "1px solid var(--amber)", color: "var(--amber)" }}>
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-[14px]" style={{ color: "var(--text)" }}>
                      Couldn&apos;t send the message. Please try again or email me directly.
                    </span>
                  </div>
                  {email && (
                    <p className="mono mt-3 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                      Your message is still here — press Send Message to retry, or write to{" "}
                      <a href={mailtoHref(DEFAULT_SUBJECT)!} className="underline underline-offset-4" style={{ color: "var(--brand-light)" }}>
                        {email}
                      </a>
                      .
                    </p>
                  )}
                </motion.div>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  textarea,
  autoComplete,
}: {
  label: string;
  name: keyof Fields;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  autoComplete?: string;
}) {
  const id = `field-${name}`;
  const invalid = !!error;
  const shared =
    "w-full rounded-xl px-4 text-[14.5px] outline-none transition-all duration-300 focus:border-[var(--brand)]";

  return (
    <div data-field={name}>
      <label htmlFor={id} className="engraved mb-2 block" style={{ color: invalid ? "var(--amber)" : "var(--dim)" }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={`${shared} resize-y leading-relaxed`}
          style={{
            background: "var(--raised)",
            border: `1px solid ${invalid ? "var(--amber)" : "var(--line)"}`,
            color: "var(--text)",
            minHeight: 132,
          }}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={shared}
          style={{
            background: "var(--raised)",
            border: `1px solid ${invalid ? "var(--amber)" : "var(--line)"}`,
            color: "var(--text)",
            height: 48,
          }}
        />
      )}
      <div id={`${id}-error`} aria-live="polite" className="mono mt-1.5 min-h-[14px] text-[10.5px]" style={{ color: "var(--amber)" }}>
        {error}
      </div>
    </div>
  );
}
