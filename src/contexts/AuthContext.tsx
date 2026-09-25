import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface AuthState {
  user: User | null;
  loading: boolean;
  /** true only when the signed-in user exists in the admin_users allowlist */
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  configured: boolean;
}

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => null,
  signOut: async () => {},
  configured: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Verify the signed-in user appears in the admin_users allowlist. */
  const checkAdmin = useCallback(async (u: User | null) => {
    if (!u) {
      setIsAdmin(false);
      return false;
    }
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", u.id)
        .maybeSingle();
      const ok = !error && !!data;
      setIsAdmin(ok);
      return ok;
    } catch {
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let alive = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      await checkAdmin(session?.user ?? null);
      if (alive) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!alive) return;
        setUser(session?.user ?? null);
        await checkAdmin(session?.user ?? null);
      },
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured — add your .env variables.";
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;

    if (data.user) {
      const ok = await checkAdmin(data.user);
      if (!ok) {
        /* Signed in, but not on the allowlist — sign straight back out. */
        await supabase.auth.signOut();
        setUser(null);
        return "This account is not authorised to manage the portfolio.";
      }
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthCtx.Provider
      value={{ user, loading, isAdmin, signIn, signOut, configured: isSupabaseConfigured }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
