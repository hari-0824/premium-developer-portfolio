/**
 * EmailJS configuration and send helper.
 *
 * The contact form posts straight to EmailJS from the browser — no mailto:,
 * no Gmail compose window, no visitor redirect, and nothing written to Supabase.
 *
 * Required environment variables (see .env.example):
 *   VITE_EMAILJS_SERVICE_ID
 *   VITE_EMAILJS_TEMPLATE_ID
 *   VITE_EMAILJS_PUBLIC_KEY
 *
 * Only these three are used. The EmailJS *public* key is designed to ship in
 * browser code; the private key, SMTP/Gmail passwords and the Supabase
 * service-role key must never appear here.
 */
import emailjs from "@emailjs/browser";

const env = import.meta.env;

const SERVICE_ID = (env.VITE_EMAILJS_SERVICE_ID ?? "").trim();
const TEMPLATE_ID = (env.VITE_EMAILJS_TEMPLATE_ID ?? "").trim();
const PUBLIC_KEY = (env.VITE_EMAILJS_PUBLIC_KEY ?? "").trim();

/** True only when all three values are present. */
export const isEmailJsConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/** Names of the variables that are still missing — for dev/admin warnings only. */
export function missingEmailJsVars(): string[] {
  return [
    !SERVICE_ID && "VITE_EMAILJS_SERVICE_ID",
    !TEMPLATE_ID && "VITE_EMAILJS_TEMPLATE_ID",
    !PUBLIC_KEY && "VITE_EMAILJS_PUBLIC_KEY",
  ].filter(Boolean) as string[];
}

/* Initialise once at module load so send() does not need the key inline. */
if (isEmailJsConfigured) {
  emailjs.init({ publicKey: PUBLIC_KEY, limitRate: { throttle: 10_000 } });
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Destination inbox — comes from the Supabase profile, never hardcoded. */
  toEmail: string;
}

export type SendResult = { ok: true } | { ok: false; reason: "unconfigured" | "network" | "rejected"; detail?: string };

/**
 * Deliver one contact message through EmailJS.
 * Resolves `{ ok: true }` only when EmailJS itself reports success (HTTP 200),
 * so the UI can never claim a delivery that did not happen.
 */
export async function sendContactMessage(msg: ContactMessage): Promise<SendResult> {
  if (!isEmailJsConfigured) return { ok: false, reason: "unconfigured" };

  /* Template variables. Keep these names in sync with the EmailJS template.
     `reply_to` makes Reply in the mail client go back to the visitor. */
  const params = {
    from_name: msg.name,
    from_email: msg.email,
    reply_to: msg.email,
    subject: msg.subject,
    message: msg.message,
    to_email: msg.toEmail,
  };

  try {
    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
    if (res?.status === 200) return { ok: true };
    return { ok: false, reason: "rejected", detail: res?.text };
  } catch (err: unknown) {
    /* EmailJSResponseStatus carries { status, text }; a thrown TypeError means
       the request never reached EmailJS (offline / blocked). */
    const e = err as { status?: number; text?: string; message?: string };
    if (typeof e?.status === "number") return { ok: false, reason: "rejected", detail: e.text };
    return { ok: false, reason: "network", detail: e?.message };
  }
}
