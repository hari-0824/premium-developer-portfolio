import { useEffect, useRef, useState } from "react";
import { deleteRow, insertRow, listRows, saveOrder, updateRow, type Project } from "@/lib/db";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";
import {
  Check, Empty, Field, ImageField, Loading, MigrationBanner, Modal, PageHeader, RowActions, SaveButton,
  errText, moved, removeUploadedImage, uploadImage, useToast,
} from "@/components/admin/cms";

const FILTER_TAGS = ["JAVA", "WEB", "AI", "IOT"] as const; // the public filter chips

type Form = {
  id?: string; title: string; kicker: string; summary: string; image_url: string | null; image_alt: string;
  tags: string[]; tech: string; github_url: string; live_url: string; problem: string; solution: string;
  features: string; stack: string; contribution: string; future: string; featured: boolean; published: boolean;
};
const list = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);
const toForm = (p?: Project): Form => ({
  id: p?.id, title: p?.title ?? "", kicker: p?.kicker ?? "", summary: p?.summary ?? "", image_url: p?.image_url ?? null,
  image_alt: p?.image_alt ?? "", tags: p?.tags ?? [], tech: (p?.tech ?? []).join(", "), github_url: p?.github_url ?? "",
  live_url: p?.live_url ?? "", problem: p?.problem ?? "", solution: p?.solution ?? "", features: (p?.features ?? []).join("\n"),
  stack: (p?.stack ?? []).join(", "), contribution: p?.contribution ?? "", future: (p?.future ?? []).join("\n"),
  featured: p?.featured ?? false, published: p?.published ?? true,
});

export default function ProjectsManager() {
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [file, setFile] = useState<File | null>(null); // local preview while the upload runs
  const [uploading, setUploading] = useState(false);
  /** Public URLs uploaded while this form is open (for cleanup of unused files). */
  const sessionUploads = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify, toast } = useToast();

  const load = async () => {
    try { setLoadErr(""); setRows(await listRows<Project>("projects")); }
    catch (e) { setLoadErr(errText(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const done = async (msg: string) => { await load(); notifyPortfolioChanged(); notify(msg); };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const open = (p?: Project) => { setFile(null); sessionUploads.current = []; setForm(toForm(p)); };

  /** Selecting an image uploads it right away to the `project-images` bucket
   *  (unique filename) and puts its public URL into the form. */
  const pickImage = async (f: File) => {
    setFile(f);
    setUploading(true);
    try {
      const url = await uploadImage("projects", f);
      sessionUploads.current.push(url);
      set("image_url", url);
    } catch (e) {
      notify(errText(e), false);
    } finally {
      setFile(null);
      setUploading(false);
    }
  };

  /** Close without saving → delete every file uploaded during this session. */
  const cancel = () => {
    if (saving || uploading) return;
    sessionUploads.current.forEach(removeUploadedImage);
    sessionUploads.current = [];
    setForm(null);
    setFile(null);
  };

  const save = async () => {
    if (!form || uploading) return;
    if (!form.title.trim()) return notify("Title is required.", false);
    setSaving(true);
    const previous = rows.find((r) => r.id === form.id)?.image_url ?? null;
    try {
      const image_url = form.image_url; // already uploaded when it was selected
      const payload = {
        title: form.title.trim(), kicker: form.kicker, summary: form.summary, image_url, image_alt: form.image_alt,
        tags: form.tags, tech: list(form.tech, /,/), github_url: form.github_url.trim(), live_url: form.live_url.trim(),
        problem: form.problem, solution: form.solution, features: list(form.features, /\n/), stack: list(form.stack, /,/),
        contribution: form.contribution, future: list(form.future, /\n/), featured: form.featured, published: form.published,
      };
      const saved = form.id
        ? await updateRow<Project>("projects", form.id, payload)
        : await insertRow<Project>("projects", { ...payload, sort_order: rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0 } as Project);
      if ((saved.image_url ?? null) !== (image_url ?? null)) throw new Error("The image uploaded, but projects.image_url was not updated.");
      // clean up: files uploaded this session but not kept, and the replaced image
      sessionUploads.current.filter((u) => u !== image_url).forEach(removeUploadedImage);
      sessionUploads.current = [];
      if (previous && previous !== image_url) removeUploadedImage(previous); // only deletes files in project-images
      setForm(null); setFile(null);
      await done(form.id ? "Project saved" : "Project created");
    } catch (e) {
      notify(errText(e), false); // uploads stay tracked: retry Save, or Close to clean up
    } finally { setSaving(false); }
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); await done(msg); } catch (e) { notify(errText(e), false); await load(); } finally { setBusy(false); }
  };
  const move = (i: number, d: number) => { const next = moved(rows, i, d); setRows(next); run(() => saveOrder("projects", next), "Order saved"); };
  const remove = (p: Project) => {
    if (!confirm(`Delete "${p.title}"? This removes it from the public site.`)) return;
    run(async () => { await deleteRow("projects", p.id); removeUploadedImage(p.image_url); }, "Project deleted");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Projects" subtitle="Projects shown in the public Projects section, in this order." onAdd={() => open()} addLabel="Add Project" />
      <MigrationBanner />
      {loadErr && <p role="alert" className="rounded-xl bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">{loadErr}</p>}
      {loading ? <Loading /> : rows.length === 0 ? <Empty text="No projects in the database yet." /> : (
        <div className="space-y-2">
          {rows.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e1015] px-4 py-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[#12151b]">
                {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  <span className="mono mr-2 text-xs text-[#5a6072]">{String(i + 1).padStart(2, "0")}</span>{p.title}
                  {p.featured && <span className="ml-2 rounded bg-[rgba(245,158,11,0.15)] px-1.5 py-0.5 text-[10px] text-[#fbbf24]">Featured</span>}
                </p>
                <p className="truncate text-xs text-[#5a6072]">{p.tech.join(" · ")}</p>
              </div>
              <RowActions published={p.published} busy={busy} first={i === 0} last={i === rows.length - 1}
                onTogglePublish={() => run(() => updateRow<Project>("projects", p.id, { published: !p.published }), p.published ? "Unpublished" : "Published")}
                onUp={() => move(i, -1)} onDown={() => move(i, 1)} onEdit={() => open(p)} onDelete={() => remove(p)} />
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit project" : "New project"} onClose={cancel}>
          <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
          <Field label="Kicker (short tagline)" value={form.kicker} onChange={(v) => set("kicker", v)} />
          <Field label="Description" value={form.summary} onChange={(v) => set("summary", v)} textarea />
          <ImageField label="Project image" url={form.image_url} file={file} uploading={uploading} onFile={pickImage}
            onClear={() => set("image_url", null)}
            hint="JPG, PNG or WEBP · max 5 MB · uploaded to project-images as soon as you pick it" />
          <Field label="Image alt text" value={form.image_alt} onChange={(v) => set("image_alt", v)} />
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5a6072]">Category (filter chips)</span>
            <div className="flex flex-wrap gap-4">
              {FILTER_TAGS.map((t) => (
                <Check key={t} label={t} checked={form.tags.includes(t)}
                  onChange={(on) => set("tags", on ? [...form.tags, t] : form.tags.filter((x) => x !== t))} />
              ))}
            </div>
          </div>
          <Field label="Technologies (comma-separated)" value={form.tech} onChange={(v) => set("tech", v)} placeholder="Java, Spring Boot, React" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GitHub URL" value={form.github_url} onChange={(v) => set("github_url", v)} type="url" />
            <Field label="Live demo URL" value={form.live_url} onChange={(v) => set("live_url", v)} type="url" />
          </div>
          <Field label="Problem" value={form.problem} onChange={(v) => set("problem", v)} textarea />
          <Field label="Solution" value={form.solution} onChange={(v) => set("solution", v)} textarea />
          <Field label="Features (one per line)" value={form.features} onChange={(v) => set("features", v)} textarea rows={4} />
          <Field label="Technology stack (comma-separated)" value={form.stack} onChange={(v) => set("stack", v)} />
          <Field label="My contribution" value={form.contribution} onChange={(v) => set("contribution", v)} textarea />
          <Field label="Future improvements (one per line)" value={form.future} onChange={(v) => set("future", v)} textarea rows={4} />
          <div className="flex flex-wrap gap-6">
            <Check label="Published" checked={form.published} onChange={(v) => set("published", v)} hint="Only published projects appear publicly" />
            <Check label="Featured" checked={form.featured} onChange={(v) => set("featured", v)}
              hint={rows.length === 0 || rows.some((r) => "featured" in r)
                ? "Stored in the CMS; the current public design has no featured style"
                : "Saved once src/lib/cms_migration.sql has been run"} />
          </div>
          <SaveButton saving={saving} onClick={save} disabled={uploading} label={uploading ? "Uploading image…" : "Save"} />
        </Modal>
      )}
      {toast}
    </div>
  );
}
