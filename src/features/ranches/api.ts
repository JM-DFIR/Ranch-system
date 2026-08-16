import { supabase } from "@/lib/supabase";
import { compressRanchCover } from "@/lib/media";
import { emptyToUndefined, nonNull } from "@/lib/utils";
import type { RanchFormValues, RanchSectionFormValues } from "./schema";

export interface RanchOption {
  id: string;
  name: string;
  coverImagePath: string | null;
}

// Shared by the App Shell's ranch switcher (Session 2), the animal
// register's ranch filter (Session 3), and the dashboard's ranch
// comparison strip (Session 7) — one query, one cache entry via
// queryKeys.ranches.list, rather than each screen fetching its own
// copy. No org_id filter needed client-side: RLS (0014_rls.sql)
// already scopes this to ranches the current user can see.
export async function fetchRanchList(): Promise<RanchOption[]> {
  const { data, error } = await supabase.from("ranches").select("id, name, cover_image_path").order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, coverImagePath: r.cover_image_path }));
}

// ---------------------------------------------------------------------
// Ranch stats — v_ranch_stats (0016_views.sql / 0027_dashboard_trend.sql).
// RanchStat/fetchRanchStats moved here from features/dashboard/api.ts:
// the Ranch List's cards need the exact same aggregate the dashboard's
// RanchComparisonStrip already reads, and ranches is the more
// fundamental owner of ranch-domain data — dashboard now imports these
// from here instead of the other way around, same direction
// fetchRanchList above already established. Aggregation stays in
// Postgres; nothing here sums client-side.
// ---------------------------------------------------------------------
export interface RanchStat {
  ranchId: string;
  ranchName: string;
  activeAnimalCount: number;
  maleCount: number;
  femaleCount: number;
  speciesBreakdown: Record<string, number>;
  attentionCount: number;
}

function mapRanchStatRow(row: {
  ranch_id: string | null;
  ranch_name: string | null;
  active_animal_count: number | null;
  male_count: number | null;
  female_count: number | null;
  species_breakdown: unknown;
  attention_count: number | null;
}): RanchStat {
  return {
    ranchId: nonNull(row.ranch_id, "ranch_id"),
    ranchName: nonNull(row.ranch_name, "ranch_name"),
    activeAnimalCount: nonNull(row.active_animal_count, "active_animal_count"),
    maleCount: nonNull(row.male_count, "male_count"),
    femaleCount: nonNull(row.female_count, "female_count"),
    speciesBreakdown: (row.species_breakdown as Record<string, number> | null) ?? {},
    attentionCount: nonNull(row.attention_count, "attention_count"),
  };
}

export async function fetchRanchStats(): Promise<RanchStat[]> {
  const { data, error } = await supabase
    .from("v_ranch_stats")
    .select("ranch_id, ranch_name, active_animal_count, male_count, female_count, species_breakdown, attention_count")
    .order("ranch_name");
  if (error) throw error;
  return (data ?? []).map(mapRanchStatRow);
}

export async function fetchRanchStatById(ranchId: string): Promise<RanchStat> {
  const { data, error } = await supabase
    .from("v_ranch_stats")
    .select("ranch_id, ranch_name, active_animal_count, male_count, female_count, species_breakdown, attention_count")
    .eq("ranch_id", ranchId)
    .single();
  if (error) throw error;
  return mapRanchStatRow(data);
}

// ---------------------------------------------------------------------
// Ranch Detail — the ranches row (structural fields, owner-editable)
// plus its v_ranch_stats row (computed), fetched in parallel same as
// admin/api.ts's fetchOrgSettings — two tables, one screen.
// ---------------------------------------------------------------------
export interface RanchDetail {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  sizeAcres: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: "active" | "inactive";
  coverImagePath: string | null;
  notes: string | null;
  stats: RanchStat;
}

export async function fetchRanchDetail(ranchId: string): Promise<RanchDetail> {
  const [ranchRes, stats] = await Promise.all([
    supabase
      .from("ranches")
      .select("id, name, location, description, size_acres, contact_name, contact_phone, contact_email, status, cover_image_path, notes")
      .eq("id", ranchId)
      .single(),
    fetchRanchStatById(ranchId),
  ]);
  if (ranchRes.error) throw ranchRes.error;

  return {
    id: ranchRes.data.id,
    name: ranchRes.data.name,
    location: ranchRes.data.location,
    description: ranchRes.data.description,
    sizeAcres: ranchRes.data.size_acres,
    contactName: ranchRes.data.contact_name,
    contactPhone: ranchRes.data.contact_phone,
    contactEmail: ranchRes.data.contact_email,
    status: ranchRes.data.status === "inactive" ? "inactive" : "active",
    coverImagePath: ranchRes.data.cover_image_path,
    notes: ranchRes.data.notes,
    stats,
  };
}

// ---------------------------------------------------------------------
// Create / Edit Ranch — owner-only (ranches_owner_insert/update,
// 0014_rls.sql), blueprint.md §0.6 #4's "owner creates and names
// ranches himself, with full ranch capabilities from day one."
// ---------------------------------------------------------------------
function ranchPayload(values: RanchFormValues) {
  return {
    name: values.name,
    location: emptyToUndefined(values.location),
    description: emptyToUndefined(values.description),
    size_acres: values.sizeAcres ? Number(values.sizeAcres) : undefined,
    contact_name: emptyToUndefined(values.contactName),
    contact_phone: emptyToUndefined(values.contactPhone),
    contact_email: emptyToUndefined(values.contactEmail),
    status: values.status,
    notes: emptyToUndefined(values.notes),
  };
}

export async function createRanch(orgId: string, values: RanchFormValues): Promise<string> {
  const { data, error } = await supabase
    .from("ranches")
    .insert({ org_id: orgId, ...ranchPayload(values) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateRanch(ranchId: string, values: RanchFormValues): Promise<void> {
  const { error } = await supabase.from("ranches").update(ranchPayload(values)).eq("id", ranchId);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Cover image — the ranch row always exists first (unlike Enrollment
// Mode's photo capture), so the upload path can use the real ranch_id
// straight away; see 0031_ranches_storage.sql's own note on why that
// lets the storage policy check has_ranch_access()/is_owner() directly.
// ---------------------------------------------------------------------
export async function uploadRanchCover(orgId: string, ranchId: string, file: File): Promise<string> {
  const compressed = await compressRanchCover(file);
  const path = `${orgId}/${ranchId}/cover.webp`;
  const { error: uploadError } = await supabase.storage.from("ranch-covers").upload(path, compressed, { upsert: true });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase.from("ranches").update({ cover_image_path: path }).eq("id", ranchId);
  if (updateError) throw updateError;

  return path;
}

// Signed and long-lived enough to survive a normal browsing session — a
// ranch cover is displayed persistently (list cards, detail header),
// not opened once on click the way a document is, so the Documents
// tab's 60-second expiry (features/animals/api.ts) would visibly break
// mid-session here.
export async function getRanchCoverSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("ranch-covers").createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------------------------------------------------------------
// Manage Sections — manager-writable, not owner-only
// (ranch_sections_insert/update, 0014_rls.sql: "operational, not
// structural").
// ---------------------------------------------------------------------
export interface RanchSectionRecord {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export async function fetchRanchSections(ranchId: string): Promise<RanchSectionRecord[]> {
  const { data, error } = await supabase
    .from("ranch_sections")
    .select("id, name, description, sort_order")
    .eq("ranch_id", ranchId)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description, sortOrder: r.sort_order }));
}

export async function createRanchSection(orgId: string, ranchId: string, values: RanchSectionFormValues): Promise<void> {
  const { error } = await supabase.from("ranch_sections").insert({
    org_id: orgId,
    ranch_id: ranchId,
    name: values.name,
    description: emptyToUndefined(values.description),
  });
  if (error) throw error;
}

export async function updateRanchSection(id: string, values: RanchSectionFormValues): Promise<void> {
  const { error } = await supabase
    .from("ranch_sections")
    .update({ name: values.name, description: emptyToUndefined(values.description) })
    .eq("id", id);
  if (error) throw error;
}

// A SECURITY DEFINER RPC (0032_soft_delete_rpcs.sql), not a plain
// client-side update: Postgres RLS requires the row resulting from an
// UPDATE to still satisfy the table's SELECT policy, and
// ranch_sections_select filters deleted_at is null, so a plain
// `.update({deleted_at})` here rejects its own write with 42501. Found
// running the pgTAP suite for real, not theoretical.
export async function softDeleteRanchSection(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_ranch_section", { p_section_id: id });
  if (error) throw error;
}
