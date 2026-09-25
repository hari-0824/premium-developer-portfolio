import { useEffect, useState } from "react";
import { deleteRow, insertRow, listRows, saveOrder, updateRow, type Achievement } from "@/lib/db";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";
import {
  Check, Empty, Field, ImageField, Loading, MigrationBanner, Modal, PageHeader, RowActions, SaveButton, SelectField,
  errText, moved, removeUploadedImage, uploadImage, useToast,
} from "@/components/admin/cms";

const KINDS = ["hackathon", "award", "certification", "workshop", "achievement"] as const;

type Form = {
  id?: string; kind: Achievement["kind"]; title: string; organisation: string; organisation_is_placeholder: boolean;
  date: string; date_is_placeholder: boolean; description: string; tags: string; image_url: string | null;
  link_url: string; published: boolean;
};
const toForm = (a?: Achievement): Form => ({
  id: a?.id, kind: a?.kind ?? "award", title: a?.title ?? "", organisation: a?.organisation ?? "",
  organisation_is_placeholder: a?.organisation_is_placeholder ?? false, date: a?.date ?? "",
  date_is_placeholder: a?.date_is_placeholder ?? false, description: a?.description ?? "",
  tags: (a?.tags ?? []).join(", "), image_url: a?.image_url ?? null, link_url: a?.link_url ?? "", published: a?.published ?? true,
});

export default function AchievementsManager() {
  const [rows, setRows] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify, toast } = useToast();

  const load = async () => {
    try { setLoadErr(""); setRows(await listRows<Achievement>("achievements")); }
    catch (e) { setLoadErr(errText(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const done = async (msg: string) => { await load(); notifyPortfolioChanged(); notify(msg); };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); await done(msg); } catch (e) { notify(errText(e), false); await load(); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!form) return;
    if (!form.title.trim()) return notify("Title is required.", false);
    setSaving(true);
    const previous = rows.find((r) => r.id === form.id)?.image_url ?? null;
    let uploaded: string | null = null;
    try {
      let image_url = form.image_url;
      if (file) image_url = uploaded = await uploadImage("achievements", file);
      const payload = {
        kind: form.kind, title: form.title.trim(), organisation: form.organisation, organisation_is_placeholder: form.organisation_is_placeholder,
        date: form.date, date_is_placeholder: form.date_is_placeholder, description: form.description,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), image_url, link_url: form.link_url.trim(), published: form.published,
      };
      if (form.id) await updateRow<Achievement>("achievements", form.id, payload);
      else await insertRow("achievements", { ...payload, sort_order: rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0 });
      if (previous && previous !== image_url) removeUploadedImage(previous);
      setForm(null); setFile(null);
      await done(form.id ? "Achievement saved" : "Achievement added");
    } catch (e) {
      if (uploaded) removeUploadedImage(uploaded);
      notify(errText(e), false);
    } finally { setSaving(false); }
  };

  const move = (i: number, d: number) => { const next = moved(rows, i, d); setRows(next); run(() => saveOrder("achievements", next), "Order saved"); };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Achievements" subtitle="Hackathons, awards, certifications and workshops — public order." addLabel="Add Achievement" onAdd={() => { setFile(null); setForm(toForm()); }} />
      <MigrationBanner />
      {loadErr && <p role="alert" className="rounded-xl bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">{loadErr}</p>}
      {loading ? <Loading /> : rows.length === 0 ? <Empty text="No achievements in the database yet." /> : (
        <div className="space-y-2">
          {rows.map((a, i) => (
            <div key={a.id} className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e1015] px-4 py-3">
              <span className="shrink-0 rounded bg-[rgba(91,108,255,0.1)] px-2 py-0.5 text-[10px] uppercase text-[#8b99ff]">{a.kind}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title}</p>
                <p className="truncate text-xs text-[#5a6072]">
                  <span className={a.organisation_is_placeholder ? "italic" : ""}>{a.organisation || "—"}</span> · <span className={a.date_is_placeholder ? "italic" : ""}>{a.date || "—"}</span>
                </p>
              </div>
              <RowActions published={a.published} busy={busy} first={i === 0} last={i === rows.length - 1}
                onTogglePublish={() => run(() => updateRow<Achievement>("achievements", a.id, { published: !a.published }), a.published ? "Unpublished" : "Published")}
                onUp={() => move(i, -1)} onDown={() => move(i, 1)} onEdit={() => { setFile(null); setForm(toForm(a)); }}
                onDelete={() => confirm(`Delete "${a.title}"?`) && run(async () => { await deleteRow("achievements", a.id); removeUploadedImage(a.image_url); }, "Achievement deleted")} />
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit achievement" : "Add achievement"} onClose={() => !saving && setForm(null)}>
          <SelectField label="Type" value={form.kind} options={KINDS} onChange={(v) => set("kind", v as Form["kind"])} />
          <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
          <Field label="Organisation / event" value={form.organisation} onChange={(v) => set("organisation", v)} />
          <Check label="Organisation is a placeholder" checked={form.organisation_is_placeholder} onChange={(v) => set("organisation_is_placeholder", v)} hint='Shown dimmed with the "to be added" style' />
          <Field label="Date / year" value={form.date} onChange={(v) => set("date", v)} />
          <Check label="Date is a placeholder" checked={form.date_is_placeholder} onChange={(v) => set("date_is_placeholder", v)} hint="Shown dimmed" />
          <Field label="Description" value={form.description} onChange={(v) => set("description", v)} textarea rows={4} />
          <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => set("tags", v)} />
          <ImageField label="Image / certificate" url={form.image_url} file={file} onFile={setFile} onClear={() => { setFile(null); set("image_url", null); }} />
          <Field label="Link (certificate / credential URL)" value={form.link_url} onChange={(v) => set("link_url", v)} type="url"
            hint="Stored in the CMS; the current public design does not display achievement images or links" />
          <Check label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          <SaveButton saving={saving} onClick={save} />
        </Modal>
      )}
      {toast}
    </div>
  );
}
