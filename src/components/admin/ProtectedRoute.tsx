import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route guard.
 *  – Supabase not configured  → setup instructions
 *  – session still loading    → spinner
 *  – no session               → /admin/login
 *  – session but not allowlisted → not-authorised screen
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, configured, signOut } = useAuth();
  const navigate = useNavigate();

  if (!configured) {
    return (
      <div className="grid h-screen place-items-center bg-[#08090c] px-6 text-[#e8eaf0]">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Supabase Not Configured</h1>
          <p className="text-sm leading-relaxed text-[#8a90a2]">
            Add <code className="text-[#5b6cff]">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-[#5b6cff]">VITE_SUPABASE_PUBLISHABLE_KEY</code> to your{" "}
            <code>.env</code> file, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-[#08090c]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b6cff] border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!isAdmin) {
    return (
      <div className="grid h-screen place-items-center bg-[#08090c] px-6 text-[#e8eaf0]">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[rgba(239,68,68,0.12)] text-lg">
            ⛔
          </div>
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-sm leading-relaxed text-[#8a90a2]">
            The account <span className="text-[#e8eaf0]">{user.email}</span> is signed in but is
            not registered as a portfolio administrator.
          </p>
          <button
            onClick={async () => {
              await signOut();
              navigate("/admin/login", { replace: true });
            }}
            className="rounded-xl border border-[rgba(255,255,255,0.1)] px-5 py-2.5 text-sm text-[#8a90a2] transition-colors hover:text-[#e8eaf0]"
          >
            Sign in with another account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
