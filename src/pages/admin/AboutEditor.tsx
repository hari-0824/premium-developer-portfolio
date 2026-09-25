import { useEffect, useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import { getAbout, upsertAbout, deleteAbout, type AboutRow } from "@/lib/db";

const inputCls =
  "w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#12151b] px-4 py-3 text-sm text-[#e8eaf0] outline-none transition-colors focus:border-[#5b6cff]";

export default function AboutEditor() {
  const [rows, setRows] = useState<AboutRow[]>([]);
  const [editing, setEditing] = useState<Partial<AboutRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getAbout());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the About content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  };

  const add = (kind: "paragraph" | "milestone") =>
    setEditing({ kind, heading: "", body: "", year: "", published: true, sort_order: rows.length });

  const save = async () => {
    if (!editing) return;
    if (editing.kind === "paragraph" && !editing.body?.trim()) {
      setError("Paragraph body cannot be empty.");
      return;
    }
    if (editing.kind === "milestone" && (!editing.year?.trim() || !editing.body?.trim())) {
      setError("Milestone needs a year and text.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertAbout(editing as Partial<AboutRow> & { kind: string });
      setEditing(null);
      await load();
      notify("About content saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteAbout(id);
      await load();
      notify("Deleted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  const paragraphs = rows.filter((r) => r.kind === "paragraph");
  const milestones = rows.filter((r) => r.kind === "milestone");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            About
          </h1>
          <p className="mt-1 text-sm text-[#8a90a2]">
            Edit the About description and education timeline.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => add("paragraph")}
            className="flex items-center gap-2 rounded-xl bg-[rgba(91,108,255,0.15)] px-4 py-2.5 text-sm text-[#8b99ff] transition-colors hover:bg-[rgba(91,108,255,0.25)]"
          >
            <Plus className="h-4 w-4" /> Paragraph
          </button>
          <button
            onClick={() => add("milestone")}
            className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-sm text-[#8a90a2] transition-colors hover:text-[#e8eaf0]"
          >
            <Plus className="h-4 w-4" /> Milestone
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid h-32 place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#5b6cff] border-t-transparent" role="status" aria-label="Loading" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] p-10 text-center">
          <p className="text-sm text-[#8a90a2]">No About content yet.</p>
          <p className="mt-1 text-xs text-[#5a6072]">
            Add a paragraph or milestone — the public site keeps its built-in text until you do.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5b6cff]">
              Description paragraphs
            </h2>
            <div className="space-y-2">
              {paragraphs.map((p) => (
                <Row key={p.id} title={p.body.slice(0, 70) + (p.body.length > 70 ? "…" : "")} sub={p.heading} onEdit={() => setEditing(p)} onDelete={() => remove(p.id)} />
              ))}
              {paragraphs.length === 0 && <p className="text-xs text-[#5a6072]">None yet.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5b6cff]">
              Timeline milestones
            </h2>
            <div className="space-y-2">
              {milestones.map((m) => (
                <Row key={m.id} title={`${m.year} — ${m.body}`} sub="Milestone" onEdit={() => setEditing(m)} onDelete={() => remove(m.id)} />
              ))}
              {milestones.length === 0 && <p className="text-xs text-[#5a6072]">None yet.</p>}
            </div>
          </section>
        </>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-lg space-y-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0e1015] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing.id ? "Edit" : "Add"} {editing.kind}
              </h2>
              <button onClick={() => setEditing(null)} aria-label="Close">
                <X className="h-5 w-5 text-[#5a6072]" />
              </button>
            </div>

            {editing.kind === "milestone" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5a6072]">Year</label>
                <input
                  className={inputCls}
                  value={editing.year ?? ""}
                  onChange={(e) => setEditing((v) => ({ ...v!, year: e.target.value }))}
                  placeholder="2026"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5a6072]">
                {editing.kind === "milestone" ? "Text" : "Paragraph"}
              </label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={5}
                value={editing.body ?? ""}
                onChange={(e) => setEditing((v) => ({ ...v!, body: e.target.value }))}
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[rgba(91,108,255,0.15)] px-5 py-2.5 text-sm text-[#8b99ff] transition-colors hover:bg-[rgba(91,108,255,0.25)] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-[#22c55e] px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({ title, sub, onEdit, onDelete }: { title: string; sub?: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e1015] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        {sub && <p className="truncate text-xs text-[#5a6072]">{sub}</p>}
      </div>
      <button onClick={onEdit} className="shrink-0 text-xs text-[#8b99ff] hover:underline">
        Edit
      </button>
      <button onClick={onDelete} aria-label="Delete" className="shrink-0 text-[#5a6072] hover:text-[#f87171]">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
