import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { LogOut, ExternalLink, Database, Shield } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Settings</h1>
        <p className="mt-1 text-sm text-[#8a90a2]">System information and account settings.</p>
      </div>

      {/* Status */}
      <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6072]">System Status</h2>
        <div className="space-y-3">
          <StatusRow
            icon={Database}
            label="Supabase Connection"
            ok={isSupabaseConfigured}
            detail={isSupabaseConfigured ? "Connected" : "Not configured — add .env vars"}
          />
          <StatusRow
            icon={Shield}
            label="Authentication"
            ok={!!user}
            detail={user?.email ?? "Not signed in"}
          />
        </div>
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6072]">Account</h2>
        <p className="text-sm text-[#8a90a2]">Signed in as <span className="text-[#e8eaf0]">{user?.email}</span></p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-sm text-[#8a90a2] hover:text-[#e8eaf0]"
          >
            <ExternalLink className="h-4 w-4" /> View Public Site
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border border-[rgba(239,68,68,0.2)] px-4 py-2.5 text-sm text-[#f87171] hover:bg-[rgba(239,68,68,0.1)]"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </section>

      {/* Instructions */}
      <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e1015] p-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5a6072]">Setup Guide</h2>
        <ol className="space-y-2 text-sm text-[#8a90a2] list-decimal list-inside">
          <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#8b99ff] hover:underline">supabase.com</a></li>
          <li>Go to Settings → API and copy the URL and anon key</li>
          <li>Add them to <code className="text-[#8b99ff]">.env</code> as <code className="text-[#8b99ff]">VITE_SUPABASE_URL</code> and <code className="text-[#8b99ff]">VITE_SUPABASE_PUBLISHABLE_KEY</code></li>
          <li>Run the SQL from <code className="text-[#8b99ff]">src/lib/supabase.sql</code> in the SQL Editor</li>
          <li>Create a user in Authentication → Users</li>
          <li>Create Storage buckets: profile-images, project-images, resume</li>
        </ol>
      </section>
    </div>
  );
}

function StatusRow({ icon: Icon, label, ok, detail }: { icon: React.ElementType; label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${ok ? "bg-[rgba(34,197,94,0.1)] text-[#22c55e]" : "bg-[rgba(239,68,68,0.1)] text-[#f87171]"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[#5a6072]">{detail}</p>
      </div>
      <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-medium ${ok ? "bg-[rgba(34,197,94,0.15)] text-[#22c55e]" : "bg-[rgba(239,68,68,0.15)] text-[#f87171]"}`}>
        {ok ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
