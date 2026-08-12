import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";

// ---------------------------------------------------------------------
// Dominant metric, attention counterpoint, species bar, sex split
// (session-pack.md, Session 7). get_dashboard_stats (0027_dashboard_
// trend.sql) runs under the caller's own RLS via v_animal_current, so
// a Manager automatically only ever sees their assigned ranches
// without this needing their ranch list passed explicitly — p_ranch_ids
// narrows further only when the app-wide ranch switcher has picked one
// specific ranch.
// ---------------------------------------------------------------------
export interface DashboardStats {
  activeAnimalCount: number;
  maleCount: number;
  femaleCount: number;
  attentionCount: number;
  speciesBreakdown: Record<string, number>;
  newEnrollmentsLast30Days: number;
  deathsLast30Days: number;
}

const EMPTY_STATS: DashboardStats = {
  activeAnimalCount: 0,
  maleCount: 0,
  femaleCount: 0,
  attentionCount: 0,
  speciesBreakdown: {},
  newEnrollmentsLast30Days: 0,
  deathsLast30Days: 0,
};

export interface DashboardStatsParams {
  ranchId?: string;
  speciesId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DashboardStatsRow {
  active_animal_count: number;
  male_count: number;
  female_count: number;
  attention_count: number;
  species_breakdown: Record<string, number> | null;
  new_enrollments_last_30_days: number;
  deaths_last_30_days: number;
}

export async function fetchDashboardStats(params: DashboardStatsParams): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    p_ranch_ids: params.ranchId ? [params.ranchId] : undefined,
    p_species_id: params.speciesId,
    p_date_from: params.dateFrom,
    p_date_to: params.dateTo,
  });
  if (error) throw error;
  // jsonb return, typed generically as Json by codegen — same
  // controlled, documented assertion fetchAnimalFacetCounts already
  // uses for get_animal_facet_counts' own jsonb return.
  const stats = data as unknown as DashboardStatsRow | null;
  if (!stats) return EMPTY_STATS;
  return {
    activeAnimalCount: stats.active_animal_count,
    maleCount: stats.male_count,
    femaleCount: stats.female_count,
    attentionCount: stats.attention_count,
    speciesBreakdown: stats.species_breakdown ?? {},
    newEnrollmentsLast30Days: stats.new_enrollments_last_30_days,
    deathsLast30Days: stats.deaths_last_30_days,
  };
}

// ---------------------------------------------------------------------
// Ranch comparison strip — one row per ranch the caller can see; RLS on
// `ranches` already limits this to assigned ranches for a Manager, all
// ranches for the Owner. Deliberately unfiltered by species/date range:
// this widget compares ranches at their current total headcount, not a
// filtered slice, and a per-ranch parameterized version would cost N
// round trips instead of one.
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

export async function fetchRanchStats(): Promise<RanchStat[]> {
  const { data, error } = await supabase
    .from("v_ranch_stats")
    .select("ranch_id, ranch_name, active_animal_count, male_count, female_count, species_breakdown, attention_count")
    .order("ranch_name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ranchId: nonNull(r.ranch_id, "ranch_id"),
    ranchName: nonNull(r.ranch_name, "ranch_name"),
    activeAnimalCount: nonNull(r.active_animal_count, "active_animal_count"),
    maleCount: nonNull(r.male_count, "male_count"),
    femaleCount: nonNull(r.female_count, "female_count"),
    speciesBreakdown: (r.species_breakdown as Record<string, number> | null) ?? {},
    attentionCount: nonNull(r.attention_count, "attention_count"),
  }));
}

// ---------------------------------------------------------------------
// Upcoming — merged, date-sorted vaccinations + vet follow-ups, next 30
// days (the views' own fixed horizon), capped by the caller. Species
// filters the vaccinations half only — a vet visit isn't scoped to one
// species (0027_dashboard_trend.sql). No date-range filter here: the
// 30-day horizon is a fixed business rule, not the adjustable range
// filter, same reasoning as the trend figures in fetchDashboardStats.
// ---------------------------------------------------------------------
export type UpcomingItem =
  | {
      kind: "vaccination";
      id: string;
      dueDate: string;
      animalId: string;
      tagNumber: string;
      animalName: string | null;
      vaccineName: string;
    }
  | {
      kind: "vet_followup";
      id: string;
      dueDate: string;
      veterinarianName: string | null;
      purpose: string | null;
    };

export interface UpcomingParams {
  ranchId?: string;
  speciesId?: string;
}

export interface UpcomingResult {
  items: UpcomingItem[];
  hasMore: boolean;
}

export async function fetchUpcoming(params: UpcomingParams, limit = 8): Promise<UpcomingResult> {
  let vacQuery = supabase
    .from("v_upcoming_vaccinations")
    .select("vaccination_id, animal_id, ranch_id, tag_number, animal_name, vaccine_name, next_due_date, species_id")
    .order("next_due_date", { ascending: true })
    .limit(limit * 2);
  if (params.ranchId) vacQuery = vacQuery.eq("ranch_id", params.ranchId);
  if (params.speciesId) vacQuery = vacQuery.eq("species_id", params.speciesId);

  let vetQuery = supabase
    .from("v_upcoming_vet_followups")
    .select("vet_visit_id, ranch_id, veterinarian_name, next_visit_date, purpose")
    .order("next_visit_date", { ascending: true })
    .limit(limit * 2);
  if (params.ranchId) vetQuery = vetQuery.eq("ranch_id", params.ranchId);

  const [vacRes, vetRes] = await Promise.all([vacQuery, vetQuery]);
  if (vacRes.error) throw vacRes.error;
  if (vetRes.error) throw vetRes.error;

  const items: UpcomingItem[] = [
    ...(vacRes.data ?? []).map(
      (v): UpcomingItem => ({
        kind: "vaccination",
        id: nonNull(v.vaccination_id, "vaccination_id"),
        dueDate: nonNull(v.next_due_date, "next_due_date"),
        animalId: nonNull(v.animal_id, "animal_id"),
        tagNumber: nonNull(v.tag_number, "tag_number"),
        animalName: v.animal_name,
        vaccineName: nonNull(v.vaccine_name, "vaccine_name"),
      }),
    ),
    ...(vetRes.data ?? []).map(
      (v): UpcomingItem => ({
        kind: "vet_followup",
        id: nonNull(v.vet_visit_id, "vet_visit_id"),
        dueDate: nonNull(v.next_visit_date, "next_visit_date"),
        veterinarianName: v.veterinarian_name,
        purpose: v.purpose,
      }),
    ),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return { items: items.slice(0, limit), hasMore: items.length > limit };
}

// ---------------------------------------------------------------------
// Recent activity — unified feed, ten items, each linking to its
// animal (session-pack.md, Session 7). species_id and event_date
// filters both apply directly, no client-side aggregation.
// ---------------------------------------------------------------------
export interface ActivityItem {
  eventType: string;
  eventDate: string;
  description: string;
  actorName: string | null;
  animalId: string | null;
  occurredAt: string;
}

export interface RecentActivityParams {
  ranchId?: string;
  speciesId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchRecentActivity(params: RecentActivityParams, limit = 10): Promise<ActivityItem[]> {
  let query = supabase
    .from("v_recent_activity")
    .select("event_type, event_date, description, actor_name, animal_id, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.speciesId) query = query.eq("species_id", params.speciesId);
  if (params.dateFrom) query = query.gte("event_date", params.dateFrom);
  if (params.dateTo) query = query.lte("event_date", params.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    eventType: nonNull(row.event_type, "event_type"),
    eventDate: nonNull(row.event_date, "event_date"),
    description: nonNull(row.description, "description"),
    actorName: row.actor_name,
    animalId: row.animal_id,
    occurredAt: nonNull(row.occurred_at, "occurred_at"),
  }));
}

// ---------------------------------------------------------------------
// Quick Actions' free-pick entry point — a lightweight searchable list
// of active animals for the Record vaccination drawer's `searchableAnimals`
// prop (built in Session 6, never wired to real data until now).
// ---------------------------------------------------------------------
export interface AnimalSearchOption {
  id: string;
  tagNumber: string;
  speciesId: string | null;
  sex: string;
}

// `sex` is here for M4's breeding/birth quick actions, which need to
// offer only female animals in their free-pick list (breeding_events.
// dam_id and births.dam_id are both females-only by the schema's own
// design) — filtered client-side from this one shared fetch rather
// than adding a second, near-identical query.
export async function fetchAnimalSearchOptions(ranchId?: string): Promise<AnimalSearchOption[]> {
  let query = supabase
    .from("v_animal_current")
    .select("id, tag_number, species_id, sex")
    .eq("is_active_status", true)
    .order("tag_number");
  if (ranchId) query = query.eq("ranch_id", ranchId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    tagNumber: nonNull(row.tag_number, "tag_number"),
    speciesId: row.species_id,
    sex: nonNull(row.sex, "sex"),
  }));
}

// ---------------------------------------------------------------------
// First-run onboarding gate (session-pack.md, Session 7). Zero animals
// is the actual gate, not zero ranches — an org can't enrol an animal
// without a ranch to put it on (animals.ranch_id is NOT NULL), so zero
// ranches always implies zero animals, but not the reverse: an owner
// may have created a ranch and not enrolled anything yet, which is
// still first-run. hasSpecies drives the checklist's second step.
// ---------------------------------------------------------------------
export interface FirstRunState {
  isFirstRun: boolean;
  hasRanches: boolean;
  hasSpecies: boolean;
}

export async function fetchFirstRunState(): Promise<FirstRunState> {
  const [animalsRes, ranchesRes, speciesRes] = await Promise.all([
    supabase.from("animals").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("ranches").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("species").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);
  if (animalsRes.error) throw animalsRes.error;
  if (ranchesRes.error) throw ranchesRes.error;
  if (speciesRes.error) throw speciesRes.error;
  return {
    isFirstRun: (animalsRes.count ?? 0) === 0,
    hasRanches: (ranchesRes.count ?? 0) > 0,
    hasSpecies: (speciesRes.count ?? 0) > 0,
  };
}
