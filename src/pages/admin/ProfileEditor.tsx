import { FormEvent, useEffect, useRef, useState } from "react";
import { Save, Upload, Trash2, Camera } from "lucide-react";
import { getProfile, upprofile } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";
import type { Profile } from "@/lib/db";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_MB = 5;

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setForm({
          full_name: p.full_name,
          role: p.role,
          status: p.status,
          college: p.college,
          graduation: p.graduation,
          badge: p.badge,
          hero_lead: p.hero_lead,
          intro: p.intro,
          goal: p.goal,
          goal_label: p.goal_label,
          github_url: p.github_url,
          linkedin_url: p.linkedin_url,
          email: p.email,
        });
        setPhotoPreview(p.profile_photo_url);
      }
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhoto = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Image must be under ${MAX_MB} MB.`);
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const previousUrl = profile?.profile_photo_url ?? null;
      let photoUrl = previousUrl;

      /* Upload new photo if selected — unique filename so no CDN/browser cache
         can ever serve the previous image for the new URL. */
      if (photoFile) {
        const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `profile/photo_${Date.now()}.${ext}`;
        const buf = await photoFile.arrayBuffer();
        const { error: upErr } = await supabase.storage
          .from("profile-images")
          .upload(path, buf, { contentType: photoFile.type, upsert: false, cacheControl: "3600" });
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      } else if (photoPreview === null && previousUrl) {
        /* Photo was removed. */
        photoUrl = null;
      }

      const saved = await upprofile({
        ...form,
        profile_photo_url: photoUrl,
      } as Partial<Profile>);

      /* Verify the database really holds the new value (RLS can block silently). */
      if ((saved.profile_photo_url ?? null) !== photoUrl) {
        throw new Error("The photo uploaded, but profiles.profile_photo_url was not updated. Check that your account is in admin_users.");
      }

      /* Best-effort cleanup of the replaced file in the profile-images bucket. */
      const marker = "/storage/v1/object/public/profile-images/";
      if (previousUrl && previousUrl !== photoUrl && previousUrl.includes(marker)) {
        const oldPath = decodeURIComponent(previousUrl.split(marker)[1].split("?")[0]);
        void supabase.storage.from("profile-images").remove([oldPath]);
      }

      setProfile(saved);
      setPhotoFile(null);
      setPhotoPreview(saved.profile_photo_url);

      /* Tell every open public page to re-fetch the profile row now. */
      notifyPortfolioChanged();

      setToast("Profile saved — public portfolio updated.");
      setTimeout(() => setToast(""), 3000);
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };


  if (!profile) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b6cff] border-t-transparent mx-auto mt-20" />;

  return (
    <form onSubmit={save} className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Profile</h1>
        <p className="mt-1 text-sm text-[#8a90a2]">Your public profile information.</p>
      </div>

      {/* ── Photo ── */}
      <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6072]">Profile Photo</h2>
        <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row">
          <div
            className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#12151b]"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-[#5a6072]">
                <Camera className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(91,108,255,0.1)] px-4 py-2.5 text-sm text-[#8b99ff] transition-colors hover:bg-[rgba(91,108,255,0.2)]"
            >
              <Upload className="h-4 w-4" /> {photoPreview ? "Change Photo" : "Upload Photo"}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                className="flex items-center gap-2 rounded-xl border border-[rgba(239,68,68,0.2)] px-4 py-2.5 text-sm text-[#f87171] transition-colors hover:bg-[rgba(239,68,68,0.1)]"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => { handlePhoto(e.target.files?.[0]); e.currentTarget.value = ""; }}
            />
          </div>
          <p className="text-xs text-[#5a6072]">
            JPG, PNG or WEBP. Max {MAX_MB} MB.
          </p>
        </div>
      </section>

      {/* ── Text fields ── */}
      <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6072]">Basic Information</h2>
        <Field label="Full Name" value={form.full_name ?? ""} onChange={set("full_name")} />
        <Field label="Role / Title" value={form.role ?? ""} onChange={set("role")} />
        <Field label="Status" value={form.status ?? ""} onChange={set("status")} />
        <Field label="College" value={form.college ?? ""} onChange={set("college")} />
        <Field label="Graduation Year" value={form.graduation ?? ""} onChange={set("graduation")} />
        <Field label="Badge Text" value={form.badge ?? ""} onChange={set("badge")} />
        <Field label="Hero Description" value={form.hero_lead ?? ""} onChange={set("hero_lead")} textarea />
      </section>

      <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6072]">About & Links</h2>
        <Field label="Intro (About page)" value={form.intro ?? ""} onChange={set("intro")} textarea />
        <Field label="Career Goal" value={form.goal ?? ""} onChange={set("goal")} textarea />
        <Field label="Goal Label" value={form.goal_label ?? ""} onChange={set("goal_label")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="GitHub URL" value={form.github_url ?? ""} onChange={set("github_url")} />
          <Field label="LinkedIn URL" value={form.linkedin_url ?? ""} onChange={set("linkedin_url")} />
        </div>
        <Field label="Email" value={form.email ?? ""} onChange={set("email")} type="email" />
      </section>

      {/* ── Save ── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: "linear-gradient(180deg, #5b6cff, #2f3ab8)", boxShadow: "0 8px 24px -10px #5b6cff" }}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {toast && <span className="text-sm text-[#22c55e]">{toast}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#12151b] px-4 py-3 text-sm text-[#e8eaf0] outline-none transition-colors focus:border-[#5b6cff]";
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#5a6072]">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={3} className={`${cls} resize-y`} />
      ) : (
        <input type={type} value={value} onChange={onChange} className={cls} />
      )}
    </div>
  );
}
