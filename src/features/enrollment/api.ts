import { supabase } from "@/lib/supabase";
import { nextLocalTagNumber } from "@/lib/offline/tagCounter";

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

// A suggestion, never a constraint (session-pack.md, Session 5b) — the
// caller is always free to overwrite the field this fills. Online,
// next_tag_number() atomically claims the real next number; offline,
// nextLocalTagNumber() guesses locally and the sync-time conflict path
// is what reconciles a wrong guess, not this function.
export async function suggestNextTag(orgId: string, prefix: string): Promise<string> {
  if (!prefix) return "";
  if (!navigator.onLine) return nextLocalTagNumber(prefix);

  const { data, error } = await supabase.rpc("next_tag_number", { p_org_id: orgId, p_prefix: prefix });
  if (error) return nextLocalTagNumber(prefix);
  return data ?? nextLocalTagNumber(prefix);
}

export interface ReservedTag {
  id: string;
  tagNumber: string;
}

// The Tag Range Generator (session-pack.md, Session 5b) — online only,
// deliberately not part of the offline queue: it needs the real atomic
// tag_sequences counter (0026_bulk_reserve_tags.sql), which is exactly
// what's unavailable offline. Ranches that number physical tags before
// working the animals use this to reserve a block in one call.
export async function bulkReserveTags(params: {
  ranchId: string;
  prefix: string;
  count: number;
  speciesId?: string;
  sectionId?: string;
}): Promise<ReservedTag[]> {
  const { data, error } = await supabase.rpc("bulk_reserve_tags", {
    p_ranch_id: params.ranchId,
    p_prefix: params.prefix,
    p_count: params.count,
    p_species_id: params.speciesId,
    p_section_id: params.sectionId,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, tagNumber: row.tag_number }));
}
