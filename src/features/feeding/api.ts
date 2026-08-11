import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

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
