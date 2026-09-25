import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Monogram } from "@/components/ui";

export default function Login() {
  const { signIn, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* Already authenticated admins skip the form. */
  useEffect(() => {
    if (!authLoading && user && isAdmin) navigate("/admin", { replace: true });
  }, [authLoading, user, isAdmin, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) setError(err);
    else navigate("/admin", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090c] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Monogram size={48} className="mx-auto" />
          <h1
            className="mt-5 text-2xl font-bold"
            style={{ fontFamily: "'Space Grotesk',sans-serif" }}
          >
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-[#8a90a2]">
            Sign in to manage your portfolio.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium tracking-wide uppercase text-[#5a6072]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#12151b] px-4 text-sm text-[#e8eaf0] outline-none transition-colors focus:border-[#5b6cff]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium tracking-wide uppercase text-[#5a6072]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#12151b] px-4 text-sm text-[#e8eaf0] outline-none transition-colors focus:border-[#5b6cff]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              background: "linear-gradient(180deg, #5b6cff, #2f3ab8)",
              boxShadow: "0 10px 30px -12px #5b6cff",
            }}
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
