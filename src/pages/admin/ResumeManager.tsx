import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, ExternalLink, FileText } from "lucide-react";
import { getProfile, upprofile } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/db";

export default function ResumeManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getProfile().then(setProfile); }, []);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const upload = async (file: File | undefined | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const path = `resume/Hari_Hara_Sudhan_Resume.pdf`;
      const buf = await file.arrayBuffer();
      const { error } = await supabase.storage
        .from("resume")
        .upload(path, buf, { contentType: "application/pdf", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("resume").getPublicUrl(path);
      await upprofile({ resume_url: data.publicUrl });
      setProfile((p) => p ? { ...p, resume_url: data.publicUrl } : p);
      notify("Resume uploaded!");
    } catch (err: unknown) {
      alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remove the current resume?")) return;
    await supabase.storage.from("resume").remove(["resume/Hari_Hara_Sudhan_Resume.pdf"]).catch(() => {});
    await upprofile({ resume_url: null });
    setProfile((p) => p ? { ...p, resume_url: null } : p);
    notify("Resume removed");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Resume</h1>
        <p className="mt-1 text-sm text-[#8a90a2]">Upload your PDF resume for download.</p>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-[rgba(91,108,255,0.1)]">
            <FileText className="h-8 w-8 text-[#8b99ff]" />
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {profile?.resume_url ? "Resume uploaded" : "No resume uploaded"}
            </p>
            <p className="text-xs text-[#5a6072]">PDF format, max 10 MB</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-[rgba(91,108,255,0.15)] px-5 py-2.5 text-sm text-[#8b99ff] hover:bg-[rgba(91,108,255,0.25)] disabled:opacity-60"
          >
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8b99ff] border-t-transparent" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {profile?.resume_url ? "Replace Resume" : "Upload Resume"}
          </button>

          {profile?.resume_url && (
            <>
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] px-5 py-2.5 text-sm text-[#8a90a2] hover:text-[#e8eaf0]"
              >
                <ExternalLink className="h-4 w-4" /> View
              </a>
              <button
                onClick={remove}
                className="flex items-center gap-2 rounded-xl border border-[rgba(239,68,68,0.2)] px-5 py-2.5 text-sm text-[#f87171] hover:bg-[rgba(239,68,68,0.1)]"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(e) => { upload(e.target.files?.[0]); e.currentTarget.value = ""; }}
        />
      </div>

      {toast && <div className="rounded-xl bg-[#22c55e] px-5 py-3 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}
