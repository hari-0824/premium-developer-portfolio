import { useEffect, useState } from "react";
import { deleteRow, insertRow, listRows, saveOrder, updateRow, type JourneyStep } from "@/lib/db";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";
import {
  Check, Empty, Field, Loading, MigrationBanner, Modal, PageHeader, RowActions, SaveButton, SelectField,
  errText, moved, useToast,
} from "@/components/admin/cms";

const STATES = ["done", "now", "next"] as const;
const STATE_LABEL: Record<string, string> = { done: "Completed", now: "In progress", next: "Planned" };

type Form = { id?: string; year: string; title: string; note: string; state: JourneyStep["state"]; published: boolean };

export default function JourneyManager() {
  const [rows, setRows] = useState<JourneyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify, toast } = useToast();

  const load = async () => {
    try { setLoadErr(""); setRows(await listRows<JourneyStep>("journey")); }
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
    if (!form.year.trim() || !form.title.trim()) return notify("Year and title are required.", false);
    setSaving(true);
    try {
      const payload = { year: form.year.trim(), title: form.title.trim(), note: form.note, state: form.state, published: form.published };
      if (form.id) await updateRow<JourneyStep>("journey", form.id, payload);
      else await insertRow("journey", { ...payload, sort_order: rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0 });
      setForm(null);
      await done(form.id ? "Journey step saved" : "Journey step added");
    } catch (e) { notify(errText(e), false); } finally { setSaving(false); }
  };

  const move = (i: number, d: number) => { const next = moved(rows, i, d); setRows(next); run(() => saveOrder("journey", next), "Order saved"); };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Journey" subtitle="Timeline steps in the order they appear publicly." addLabel="Add Step"
        onAdd={() => setForm({ year: String(new Date().getFullYear()), title: "", note: "", state: "next", published: true })} />
      <MigrationBanner />
      {loadErr && <p role="alert" className="rounded-xl bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">{loadErr}</p>}
      {loading ? <Loading /> : rows.length === 0 ? <Empty text="No journey steps in the database yet." /> : (
        <div className="space-y-2">
          {rows.map((j, i) => (
            <div key={j.id} className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e1015] px-4 py-3">
              <span className="mono w-12 shrink-0 text-sm font-semibold tabular-nums text-[#8b99ff]">{j.year}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{j.title}</p>
                <p className="truncate text-xs text-[#5a6072]">{STATE_LABEL[j.state] ?? j.state} · {j.note}</p>
              </div>
              <RowActions published={j.published} busy={busy} first={i === 0} last={i === rows.length - 1}
                onTogglePublish={() => run(() => updateRow<JourneyStep>("journey", j.id, { published: !j.published }), j.published ? "Unpublished" : "Published")}
                onUp={() => move(i, -1)} onDown={() => move(i, 1)}
                onEdit={() => setForm({ id: j.id, year: j.year, title: j.title, note: j.note, state: j.state, published: j.published })}
                onDelete={() => confirm(`Delete "${j.year} — ${j.title}"?`) && run(() => deleteRow("journey", j.id), "Journey step deleted")} />
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit journey step" : "Add journey step"} onClose={() => !saving && setForm(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Year / date" value={form.year} onChange={(v) => set("year", v)} placeholder="2026" />
            <SelectField label="Status" value={form.state} options={STATES} onChange={(v) => set("state", v as Form["state"])} />
          </div>
          <p className="-mt-2 text-[11px] text-[#5a6072]">done = completed · now = in progress · next = planned (controls the timeline marker style)</p>
          <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
          <Field label="Description" value={form.note} onChange={(v) => set("note", v)} textarea />
          <Check label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          <SaveButton saving={saving} onClick={save} />
        </Modal>
      )}
      {toast}
    </div>
  );
}
