import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.generated";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The ambient type says `string`, but Vite only replaces these at build
// time — an unset var is genuinely undefined at runtime, so this check
// is real, not defensive-for-its-own-sake.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to " +
      ".env.local and fill in real values from Project Settings > API.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
