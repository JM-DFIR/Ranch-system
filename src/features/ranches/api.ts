import { supabase } from "@/lib/supabase";

export interface RanchOption {
  id: string;
  name: string;
}

// Shared by the App Shell's ranch switcher (Session 2) and the animal
// register's ranch filter (Session 3) — one query, one cache entry via
// queryKeys.ranches.list, rather than each screen fetching its own
// copy. No org_id filter needed client-side: RLS (0014_rls.sql)
// already scopes this to ranches the current user can see.
export async function fetchRanchList(): Promise<RanchOption[]> {
  const { data, error } = await supabase.from("ranches").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}
