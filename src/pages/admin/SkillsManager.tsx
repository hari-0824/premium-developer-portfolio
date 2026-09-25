import { useEffect, useState } from "react";
import { deleteRow, insertRow, listRows, saveOrder, updateRow, type Skill } from "@/lib/db";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";
import {
  Check, Empty, Field, Loading, MigrationBanner, Modal, PageHeader, RowActions, SaveButton, SelectField,
  errText, inputCls, useToast,
} from "@/components/admin/cms";

/** Same categories, in the same order, as the public Skills section. */
const CATEGORIES = ["Programming", "Frontend", "Backend", "Database", "Tools", "AI & IoT"] as const;
/** Icons the public Skills section can render. */
const ICONS = ["code", "python", "js", "markup", "style", "react", "spring", "api", "sql", "mongo", "git", "ide", "ai", "vision", "chip", "sensor"] as const;

type Form = { id?: string; name: string; category: string; icon: string; level: number; desc: string; published: boolean };

/** Global order = category order, then position inside the category. */
function ordered(rows: Skill[]): Skill[] {
  const rank = (c: string) => { const i = (CATEGORIES as readonly string[]).indexOf(c); return i < 0 ? 99 : i; };
  return rows.slice().sort((a, b) => rank(a.category) - rank(b.category) || a.sort_order - b.sort_order);
}

export default function SkillsManager() {
  const [rows, setRows] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify, toast } = useToast();

  const load = async () => {
    try { setLoadErr(""); setRows(ordered(await listRows<Skill>("skills"))); }
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
    if (!form.name.trim()) return notify("Skill name is required.", false);
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), category: form.category, icon: form.icon, level: form.level, desc: form.desc, published: form.published };
      const existing = rows.find((r) => r.id === form.id);
      if (form.id) {
        // moving to another category → place it at the end of that category
        const extra = existing && existing.category !== form.category ? { sort_order: Math.max(0, ...rows.map((r) => r.sort_order)) + 1 } : {};
        await updateRow<Skill>("skills", form.id, { ...payload, ...extra });
      } else {
        await insertRow("skills", { ...payload, sort_order: Math.max(-1, ...rows.map((r) => r.sort_order)) + 1 });
      }
      // keep sort_order contiguous in public order
      await saveOrder("skills", ordered(await listRows<Skill>("skills")));
      setForm(null);
      await done(form.id ? "Skill saved" : "Skill added");
    } catch (e) { notify(errText(e), false); } finally { setSaving(false); }
  };

  const move = (s: Skill, d: number) => {
    const group = rows.filter((r) => r.category === s.category);
    const i = group.findIndex((r) => r.id === s.id), j = i + d;
    if (j < 0 || j >= group.length) return;
    const a = rows.indexOf(group[i]), b = rows.indexOf(group[j]);
    const next = rows.slice(); [next[a], next[b]] = [next[b], next[a]];
    setRows(next);
    run(() => saveOrder("skills", next), "Order saved");
  };

  const categories = [...CATEGORIES, ...[...new Set(rows.map((r) => r.category))].filter((c) => !(CATEGORIES as readonly string[]).includes(c))];

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Skills" subtitle="Grouped exactly like the public Technology Stack section." addLabel="Add Skill"
        onAdd={() => setForm({ name: "", category: "Programming", icon: "code", level: 70, desc: "", published: true })} />
      <MigrationBanner />
      {loadErr && <p role="alert" className="rounded-xl bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">{loadErr}</p>}
      {loading ? <Loading /> : rows.length === 0 ? <Empty text="No skills in the database yet." /> : categories.map((cat) => {
        const group = rows.filter((r) => r.category === cat);
        if (!group.length) return null;
        return (
          <section key={cat}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5b6cff]">{cat}</h2>
            <div className="space-y-2">
              {group.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e1015] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name} <span className="mono ml-1 text-[11px] text-[#5a6072]">{s.icon}</span></p>
                    <p className="truncate text-xs text-[#5a6072]">{s.desc}</p>
                  </div>
                  <span className="mono w-10 text-right text-xs tabular-nums text-[#8a90a2]">{s.level}%</span>
                  <RowActions published={s.published} busy={busy} first={i === 0} last={i === group.length - 1}
                    onTogglePublish={() => run(() => updateRow<Skill>("skills", s.id, { published: !s.published }), s.published ? "Unpublished" : "Published")}
                    onUp={() => move(s, -1)} onDown={() => move(s, 1)}
                    onEdit={() => setForm({ id: s.id, name: s.name, category: s.category, icon: s.icon, level: s.level, desc: s.desc, published: s.published })}
                    onDelete={() => confirm(`Delete "${s.name}"?`) && run(() => deleteRow("skills", s.id), "Skill deleted")} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {form && (
        <Modal title={form.id ? "Edit skill" : "Add skill"} onClose={() => !saving && setForm(null)}>
          <Field label="Name" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="Description" value={form.desc} onChange={(v) => set("desc", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Category" value={form.category} options={categories} onChange={(v) => set("category", v)} />
            <SelectField label="Icon" value={form.icon} options={ICONS.includes(form.icon as never) ? ICONS : [form.icon, ...ICONS]} onChange={(v) => set("icon", v)} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5a6072]">Proficiency: {form.level}%</span>
            <input type="range" min={0} max={100} value={form.level} onChange={(e) => set("level", Number(e.target.value))} className="w-full accent-[#5b6cff]" />
            <input type="number" min={0} max={100} value={form.level} onChange={(e) => set("level", Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className={`${inputCls} mt-2 w-28`} aria-label="Proficiency percent" />
          </label>
          <Check label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          <SaveButton saving={saving} onClick={save} />
        </Modal>
      )}
      {toast}
    </div>
  );
}
