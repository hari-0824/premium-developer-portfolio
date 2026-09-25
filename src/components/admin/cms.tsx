/**
 * Shared building blocks for the admin CMS pages (admin-only UI).
 * Styling follows the existing admin panel.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { getCmsMigrated } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";

export const inputCls =
  "w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#12151b] px-4 py-3 text-sm text-[#e8eaf0] outline-none transition-colors focus:border-[#5b6cff]";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5a6072]";

/* ------------------------------------------------------------------ toast */
export function useToast() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const notify = useCallback((text: string, ok = true) => {
    setMsg({ text, ok });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), ok ? 3000 : 6000);
  }, []);
  const node = msg ? (
    <div
      role={msg.ok ? "status" : "alert"}
      className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl px-5 py-3 text-sm text-white shadow-lg ${msg.ok ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
    >
      {msg.text}
    </div>
  ) : null;
  return { notify, toast: node };
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/* ------------------------------------------------------------------ fields */
export function Field({
  label, value, onChange, textarea, rows = 3, placeholder, type = "text", hint,
}: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean;
  rows?: number; placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={`${inputCls} resize-y`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      )}
      {hint && <span className="mt-1 block text-[11px] text-[#5a6072]">{hint}</span>}
    </label>
  );
}

export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-[#c4c9d6]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-[#5b6cff]" />
      <span>
        {label}
        {hint && <span className="block text-[11px] text-[#5a6072]">{hint}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ row controls */
export function RowActions({
  published, onTogglePublish, onUp, onDown, first, last, onEdit, onDelete, busy,
}: {
  published: boolean; onTogglePublish: () => void; onUp: () => void; onDown: () => void;
  first: boolean; last: boolean; onEdit: () => void; onDelete: () => void; busy?: boolean;
}) {
  const btn = "grid h-8 w-8 place-items-center rounded-lg text-[#5a6072] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8eaf0] disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className={`mr-1 hidden rounded-full px-2.5 py-1 text-[10px] font-medium sm:inline ${published ? "bg-[rgba(34,197,94,0.15)] text-[#22c55e]" : "bg-[rgba(255,255,255,0.06)] text-[#8a90a2]"}`}>
        {published ? "Published" : "Draft"}
      </span>
      <button type="button" disabled={busy} onClick={onTogglePublish} className={btn} title={published ? "Unpublish" : "Publish"} aria-label={published ? "Unpublish" : "Publish"}>
        {published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button type="button" disabled={busy || first} onClick={onUp} className={btn} title="Move up" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" disabled={busy || last} onClick={onDown} className={btn} title="Move down" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
      <button type="button" disabled={busy} onClick={onEdit} className="rounded-lg px-2.5 py-1.5 text-xs text-[#8b99ff] hover:bg-[rgba(91,108,255,0.1)]">Edit</button>
      <button type="button" disabled={busy} onClick={onDelete} className={`${btn} hover:!text-[#f87171]`} title="Delete" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

/** Move item at index i by delta within list; returns the new array. */
export function moved<T>(list: T[], i: number, delta: number): T[] {
  const j = i + delta;
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ------------------------------------------------------------------ modal */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="mx-auto my-8 max-w-2xl space-y-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0e1015] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5 text-[#5a6072]" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SaveButton({ saving, onClick, label = "Save", disabled = false }: { saving: boolean; onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={saving || disabled}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
      style={{ background: "linear-gradient(180deg, #5b6cff, #2f3ab8)" }}>
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {saving ? "Saving…" : label}
    </button>
  );
}

/* ------------------------------------------------------------------ images */
const IMG_TYPES = /^image\/(jpeg|png|webp)$/;
const IMG_MAX = 5 * 1024 * 1024;
const BUCKET = "project-images";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

/** Validate + upload to the admin-only `project-images` bucket; returns the public URL. */
export async function uploadImage(folder: "projects" | "achievements", file: File): Promise<string> {
  if (!IMG_TYPES.test(file.type)) throw new Error("Image must be JPG, PNG or WEBP.");
  if (file.size > IMG_MAX) throw new Error("Image must be under 5 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of a replaced/deleted image (only files we uploaded). */
export function removeUploadedImage(url: string | null | undefined): void {
  if (!url || !url.includes(PUBLIC_MARKER)) return; // e.g. built-in "images/proj-waste.jpg" — never touched
  const path = decodeURIComponent(url.split(PUBLIC_MARKER)[1].split("?")[0]);
  void supabase.storage.from(BUCKET).remove([path]);
}

/** Picker with preview. The file is only uploaded when the form is saved. */
export function ImageField({
  label, url, file, onFile, onClear, uploading = false, hint = "JPG, PNG or WEBP · max 5 MB · uploaded when you save",
}: { label: string; url: string | null; file: File | null; onFile: (f: File) => void; onClear: () => void; uploading?: boolean; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const u = URL.createObjectURL(file); setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const shown = preview ?? url;
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-4">
        <div className="relative grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#12151b]">
          {shown ? <img src={shown} alt="Project image preview" data-testid="image-preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-[#5a6072]" />}
          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-black/55" role="status" aria-label="Uploading image">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={uploading} onClick={() => ref.current?.click()} className="rounded-xl bg-[rgba(91,108,255,0.12)] px-3.5 py-2 text-xs text-[#8b99ff] hover:bg-[rgba(91,108,255,0.22)] disabled:opacity-50">
            {shown ? "Change image" : "Upload image"}
          </button>
          {shown && !uploading && <button type="button" onClick={() => { setErr(""); onClear(); }} className="rounded-xl border border-[rgba(239,68,68,0.25)] px-3.5 py-2 text-xs text-[#f87171] hover:bg-[rgba(239,68,68,0.1)]">Remove</button>}
        </div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]; e.currentTarget.value = "";
            if (!f) return;
            if (!IMG_TYPES.test(f.type)) return setErr("Use a JPG, PNG or WEBP image.");
            if (f.size > IMG_MAX) return setErr("Image must be under 5 MB.");
            setErr(""); onFile(f);
          }} />
      </div>
      <span className="mt-1 block text-[11px] text-[#5a6072]">{err ? <span className="text-[#f87171]">{err}</span> : uploading ? "Uploading…" : hint}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ status */
export function MigrationBanner() {
  const [migrated, setMigrated] = useState<boolean | null>(null);
  useEffect(() => { getCmsMigrated().then(setMigrated); }, []);
  if (migrated !== false) return null;
  return (
    <div role="status" className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[#fbbf24]">
      The existing public content has not been imported yet. Run <code className="text-[#fde68a]">src/lib/cms_migration.sql</code> once in
      Supabase → SQL Editor. Until then the public site keeps showing its built-in content.
    </div>
  );
}

export function PageHeader({ title, subtitle, onAdd, addLabel }: { title: string; subtitle: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{title}</h1>
        <p className="mt-1 text-sm text-[#8a90a2]">{subtitle}</p>
      </div>
      <button type="button" onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-[rgba(91,108,255,0.15)] px-4 py-2.5 text-sm text-[#8b99ff] hover:bg-[rgba(91,108,255,0.25)]">
        + {addLabel}
      </button>
    </div>
  );
}

export function Loading() {
  return <div className="grid h-32 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#5b6cff]" aria-label="Loading" /></div>;
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] p-10 text-center text-sm text-[#8a90a2]">{text}</div>;
}
