import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Quick flag — true when env vars are present. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/* Log to console during dev so you can verify initialization. */
if (typeof window !== "undefined") {
  console.log(
    `[Supabase] Client initialized — configured: ${isSupabaseConfigured}`,
  );
}
