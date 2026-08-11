import { supabase } from "@/lib/supabase";

// The minimal enrollment screen (session-pack.md, Session 5a) writes
// only tag_number + photo — species/sex/section all wait for "add more
// detail" in Session 5b. status_id is still not-null on animals
// (0006_animals.sql), so the org's "Active" status is resolved once,
// while still online, and carried in memory for the rest of the
// enrollment session (see EnrollmentScreen.tsx) — offline enrollment
// works because this value is already in hand, not because it's
// fetched per save.
export async function fetchActiveStatusId(orgId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("animal_statuses")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", "Active")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
