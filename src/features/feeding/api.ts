import { supabase } from "@/lib/supabase";
import { emptyToUndefined, nonNull } from "@/lib/utils";
import type { CareActivityFormValues, FeedingFormValues } from "./schema";

export interface FeedingRecord {
  id: string;
  feedDate: string;
  feedItemName: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

// feeding_records.animal_id is nullable — a feed record can be
// ranch-wide instead (0011_feeding_care.sql's "exactly one scope"
// check). This only ever queries the animal-scoped ones; ranch-wide
// feeding belongs to the Ranch detail screen, not an individual
// profile.
export async function fetchFeedingRecords(animalId: string): Promise<FeedingRecord[]> {
  const { data, error } = await supabase
    .from("feeding_records")
    .select("id, feed_date, quantity, unit, notes, feed_item:feed_items(name)")
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("feed_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    feedDate: nonNull(row.feed_date, "feed_date"),
    feedItemName: row.feed_item?.name ?? "Feed",
    quantity: nonNull(row.quantity, "quantity"),
    unit: nonNull(row.unit, "unit"),
    notes: row.notes,
  }));
}

export interface CareActivity {
  id: string;
  activityDate: string;
  activityTypeName: string;
  product: string | null;
  nextDueDate: string | null;
  performedByName: string | null;
  notes: string | null;
}

export async function fetchCareActivities(animalId: string): Promise<CareActivity[]> {
  const { data, error } = await supabase
    .from("care_activities")
    .select(
      "id, activity_date, product, next_due_date, notes, activity_type:care_activity_types(name), performed_by:profiles!performed_by(full_name)",
    )
    .eq("animal_id", animalId)
    .is("deleted_at", null)
    .order("activity_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    activityDate: nonNull(row.activity_date, "activity_date"),
    activityTypeName: row.activity_type?.name ?? "Care activity",
    product: row.product,
    nextDueDate: row.next_due_date,
    performedByName: row.performed_by?.full_name ?? null,
    notes: row.notes,
  }));
}

// ---------------------------------------------------------------------
// Record Feeding / Record Care Activity (M5 — session-pack.md Part 5).
// Neither is one of CLAUDE.md §8's five offline-queued operations, so
// both are online-only, same shape as treatment/illness/vet-visit —
// see docs/patterns/record-drawer.md's "online-only variant".
// ---------------------------------------------------------------------

export interface FeedItemOption {
  id: string;
  name: string;
  unit: string;
}

export async function fetchFeedItemOptions(orgId: string): Promise<FeedItemOption[]> {
  const { data, error } = await supabase.from("feed_items").select("id, name, unit").eq("org_id", orgId).is("deleted_at", null).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createFeedItem(orgId: string, name: string, unit: string): Promise<FeedItemOption> {
  const { data, error } = await supabase.from("feed_items").insert({ org_id: orgId, name, unit }).select("id, name, unit").single();
  if (error) throw error;
  return data;
}

export interface CareActivityTypeOption {
  id: string;
  name: string;
}

export async function fetchCareActivityTypeOptions(orgId: string): Promise<CareActivityTypeOption[]> {
  const { data, error } = await supabase
    .from("care_activity_types")
    .select("id, name")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCareActivityType(orgId: string, name: string): Promise<CareActivityTypeOption> {
  const { data, error } = await supabase.from("care_activity_types").insert({ org_id: orgId, name }).select("id, name").single();
  if (error) throw error;
  return data;
}

export interface OrgMemberOption {
  id: string;
  name: string;
}

export async function fetchOrgMembers(orgId: string): Promise<OrgMemberOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name }));
}

export interface RecordFeedingResult {
  feedingRecordIds: string[];
}

// One row per selected animal for the animal-scoped case (same values,
// same "one action, N records" shape recordBreedingEvent already
// uses); exactly one row for the ranch-scoped case.
interface ScopedRowBase {
  animal_id: string | null;
  ranch_id: string | null;
  section_id: string | null;
}

// Both branches of the ranch/animal scope have to produce the exact
// same row type, not just structurally similar ones — otherwise
// Supabase's `.insert()` sees a union of two narrower row types (one
// with `animal_id: null` as a literal, one with `ranch_id: null` as a
// literal) and rejects it. The explicit `ScopedRowBase` shape is what
// keeps this a single, uniform array either way.
function scopedRows<T extends object>(
  scope: { type: "ranch"; ranchId: string; sectionId?: string } | { type: "animal"; animalIds: string[] },
  base: T,
): (T & ScopedRowBase)[] {
  if (scope.type === "ranch") {
    return [{ ...base, ranch_id: scope.ranchId, section_id: scope.sectionId ?? null, animal_id: null }];
  }
  return scope.animalIds.map((animalId) => ({ ...base, animal_id: animalId, ranch_id: null, section_id: null }));
}

export async function recordFeeding(orgId: string, values: FeedingFormValues, createdBy: string): Promise<RecordFeedingResult> {
  const rows = scopedRows(values.scope, {
    org_id: orgId,
    feed_item_id: values.feedItemId,
    feed_date: values.feedDate,
    quantity: Number(values.quantity),
    unit: values.unit,
    notes: values.notes,
    created_by: createdBy,
  });

  const { data, error } = await supabase.from("feeding_records").insert(rows).select("id");
  if (error) throw error;
  return { feedingRecordIds: (data ?? []).map((r) => r.id) };
}

export async function undoRecordFeeding(result: RecordFeedingResult): Promise<boolean> {
  if (result.feedingRecordIds.length === 0) return false;
  const { error } = await supabase.from("feeding_records").update({ deleted_at: new Date().toISOString() }).in("id", result.feedingRecordIds);
  if (error) throw error;
  return true;
}

export interface RecordCareActivityResult {
  careActivityIds: string[];
}

export async function recordCareActivity(orgId: string, values: CareActivityFormValues, createdBy: string): Promise<RecordCareActivityResult> {
  const rows = scopedRows(values.scope, {
    org_id: orgId,
    activity_type_id: values.activityTypeId,
    activity_date: values.activityDate,
    product: values.product,
    next_due_date: emptyToUndefined(values.nextDueDate),
    performed_by: emptyToUndefined(values.performedBy) ?? createdBy,
    notes: values.notes,
    created_by: createdBy,
  });

  const { data, error } = await supabase.from("care_activities").insert(rows).select("id");
  if (error) throw error;
  return { careActivityIds: (data ?? []).map((r) => r.id) };
}

export async function undoRecordCareActivity(result: RecordCareActivityResult): Promise<boolean> {
  if (result.careActivityIds.length === 0) return false;
  const { error } = await supabase.from("care_activities").update({ deleted_at: new Date().toISOString() }).in("id", result.careActivityIds);
  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------
// Feeding / Care registers (Part 5 — "M5") — org-wide, paginated, same
// shape as the health/movements registers.
// ---------------------------------------------------------------------

export interface FeedingCareRegisterParams {
  ranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface FeedingRegisterRow {
  id: string;
  feedDate: string;
  scopeLabel: string;
  feedItemName: string;
  quantity: number;
  unit: string;
}

export interface FeedingRegisterResult {
  rows: FeedingRegisterRow[];
  totalCount: number;
}

// A ranch filter has to match both scopes — a ranch-wide row (ranch_id
// = X) and an animal-scoped row for an animal currently on ranch X
// (animal_id in that ranch's animal ids). Plain column equality can
// express both sides of that OR directly (no embedded-join ambiguity
// to work around, unlike the breeding register's dam/sire case).
async function resolveRanchAnimalIds(ranchId: string): Promise<string[]> {
  const { data, error } = await supabase.from("animals").select("id").eq("ranch_id", ranchId).is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function fetchFeedingRegister(params: FeedingCareRegisterParams): Promise<FeedingRegisterResult> {
  let query = supabase
    .from("feeding_records")
    .select(
      "id, feed_date, quantity, unit, feed_item:feed_items(name), ranch:ranches(name), animal:animals(tag_number)",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) {
    const animalIds = await resolveRanchAnimalIds(params.ranchId);
    query =
      animalIds.length > 0
        ? query.or(`ranch_id.eq.${params.ranchId},animal_id.in.(${animalIds.join(",")})`)
        : query.eq("ranch_id", params.ranchId);
  }
  if (params.dateFrom) query = query.gte("feed_date", params.dateFrom);
  if (params.dateTo) query = query.lte("feed_date", params.dateTo);

  query = query
    .order("feed_date", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      feedDate: nonNull(row.feed_date, "feed_date"),
      scopeLabel: row.ranch?.name ? `${row.ranch.name} (ranch-wide)` : (row.animal?.tag_number ?? "—"),
      feedItemName: row.feed_item?.name ?? "Feed",
      quantity: nonNull(row.quantity, "quantity"),
      unit: nonNull(row.unit, "unit"),
    })),
    totalCount: count ?? 0,
  };
}

export interface CareActivityRegisterRow {
  id: string;
  activityDate: string;
  scopeLabel: string;
  activityTypeName: string;
  product: string | null;
  nextDueDate: string | null;
}

export interface CareActivityRegisterResult {
  rows: CareActivityRegisterRow[];
  totalCount: number;
}

export async function fetchCareActivityRegister(params: FeedingCareRegisterParams): Promise<CareActivityRegisterResult> {
  let query = supabase
    .from("care_activities")
    .select(
      "id, activity_date, product, next_due_date, activity_type:care_activity_types(name), ranch:ranches(name), animal:animals(tag_number)",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (params.ranchId) {
    const animalIds = await resolveRanchAnimalIds(params.ranchId);
    query =
      animalIds.length > 0
        ? query.or(`ranch_id.eq.${params.ranchId},animal_id.in.(${animalIds.join(",")})`)
        : query.eq("ranch_id", params.ranchId);
  }
  if (params.dateFrom) query = query.gte("activity_date", params.dateFrom);
  if (params.dateTo) query = query.lte("activity_date", params.dateTo);

  query = query
    .order("activity_date", { ascending: false })
    .range(params.page * params.pageSize, params.page * params.pageSize + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      activityDate: nonNull(row.activity_date, "activity_date"),
      scopeLabel: row.ranch?.name ? `${row.ranch.name} (ranch-wide)` : (row.animal?.tag_number ?? "—"),
      activityTypeName: row.activity_type?.name ?? "Care activity",
      product: row.product,
      nextDueDate: row.next_due_date,
    })),
    totalCount: count ?? 0,
  };
}
