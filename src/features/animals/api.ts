import { supabase } from "@/lib/supabase";
import { nonNull } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT, DEFAULT_SORT_DIR, type AnimalsSearch } from "./schema";

export interface AnimalRegisterRow {
  id: string;
  tagNumber: string;
  name: string | null;
  speciesId: string | null;
  speciesName: string | null;
  breedName: string | null;
  sex: string;
  dateOfBirth: string | null;
  dobIsEstimated: boolean;
  ranchName: string;
  sectionName: string | null;
  statusId: string;
  statusName: string;
  statusColorToken: string;
  attentionSeverity: "high" | "medium" | "info" | null;
  attentionReasonCount: number;
  photoPath: string | null;
  lastEventDate: string | null;
}

export interface AnimalRegisterParams extends AnimalsSearch {
  /** From `_authenticated`'s global scope (Session 2) — not a local filter. */
  ranchId?: string;
}

export interface AnimalRegisterResult {
  rows: AnimalRegisterRow[];
  totalCount: number;
}

// PostgREST's `.or()` uses comma to separate conditions and parens to
// group them — strip those out of free-text search input rather than
// let a stray character silently produce a malformed filter (not a
// security issue, since PostgREST still parameterizes the parsed
// values, but a confusing "no results" for the person typing).
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()]/g, "").trim();
}

export async function fetchAnimalRegister(params: AnimalRegisterParams): Promise<AnimalRegisterResult> {
  const page = params.page ?? 0;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? DEFAULT_SORT;
  const sortDir = params.sortDir ?? DEFAULT_SORT_DIR;

  let query = supabase
    .from("v_animal_current")
    .select(
      "id, tag_number, name, species_id, species_name, breed_name, sex, date_of_birth, dob_is_estimated, ranch_name, section_name, status_id, status_name, status_color_token, attention_severity, attention_reason_count, photo_path, last_event_date",
      { count: "exact" },
    );

  if (params.ranchId) query = query.eq("ranch_id", params.ranchId);
  if (params.species) query = query.eq("species_id", params.species);
  if (params.breed) query = query.eq("breed_id", params.breed);
  if (params.sex) query = query.eq("sex", params.sex);
  if (params.status) query = query.eq("status_id", params.status);
  if (params.section) query = query.eq("section_id", params.section);
  if (params.attention) query = query.not("attention_severity", "is", null);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);
  if (params.search) {
    const term = sanitizeSearchTerm(params.search);
    if (term) {
      query = query.or(`tag_number.ilike.%${term}%,name.ilike.%${term}%`);
    }
  }

  query = query.order(sort, { ascending: sortDir === "asc" }).range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []).map(
      // v_animal_current is a view — PostgREST's codegen marks every one
      // of its columns nullable regardless of the underlying JOIN/NOT
      // NULL structure, so the genuinely-guaranteed ones are narrowed
      // here via nonNull() rather than loosening this row type to match.
      (row): AnimalRegisterRow => ({
        id: nonNull(row.id, "id"),
        tagNumber: nonNull(row.tag_number, "tag_number"),
        name: row.name,
        speciesId: row.species_id,
        speciesName: row.species_name,
        breedName: row.breed_name,
        sex: nonNull(row.sex, "sex"),
        dateOfBirth: row.date_of_birth,
        dobIsEstimated: nonNull(row.dob_is_estimated, "dob_is_estimated"),
        ranchName: nonNull(row.ranch_name, "ranch_name"),
        sectionName: row.section_name,
        statusId: nonNull(row.status_id, "status_id"),
        statusName: nonNull(row.status_name, "status_name"),
        statusColorToken: nonNull(row.status_color_token, "status_color_token"),
        attentionSeverity: row.attention_severity as AnimalRegisterRow["attentionSeverity"],
        attentionReasonCount: nonNull(row.attention_reason_count, "attention_reason_count"),
        photoPath: row.photo_path,
        lastEventDate: row.last_event_date,
      }),
    ),
    totalCount: count ?? 0,
  };
}

export interface FacetCounts {
  ranch: Record<string, number>;
  species: Record<string, number>;
  sex: Record<string, number>;
  status: Record<string, number>;
  section: Record<string, number>;
}

const EMPTY_FACET_COUNTS: FacetCounts = { ranch: {}, species: {}, sex: {}, status: {}, section: {} };

// Live counts reflecting every OTHER active filter but not its own —
// computed server-side in one round trip (get_animal_facet_counts,
// 0020_animal_register.sql), never fetched-and-counted in JS
// (CLAUDE.md §6).
export async function fetchAnimalFacetCounts(params: AnimalRegisterParams): Promise<FacetCounts> {
  const { data, error } = await supabase.rpc("get_animal_facet_counts", {
    p_ranch_id: params.ranchId ?? undefined,
    p_species_ids: params.species ? [params.species] : undefined,
    p_breed_ids: params.breed ? [params.breed] : undefined,
    p_sexes: params.sex ? [params.sex] : undefined,
    p_status_ids: params.status ? [params.status] : undefined,
    p_section_ids: params.section ? [params.section] : undefined,
    p_search: params.search ? sanitizeSearchTerm(params.search) || undefined : undefined,
  });
  if (error) throw error;
  // The RPC returns jsonb, typed generically as Json by codegen — not
  // enough overlap with FacetCounts for a direct assertion, so this
  // goes through `unknown` first. Still a controlled assertion of a
  // shape this project defines and owns (the RPC body above), not a
  // blind trust of arbitrary external `any` the way a third-party
  // library's loose types would be.
  return (data as unknown as FacetCounts | null) ?? EMPTY_FACET_COUNTS;
}

// ---------------------------------------------------------------------
// Animal profile (Session 4) — the single-animal read behind the
// profile header and Overview tab. A distinct, richer shape from
// AnimalRegisterRow above rather than reusing it: the register
// deliberately stays lean (CLAUDE.md's register column list), the
// profile needs color/acquisition/notes/dam/sire/ANITRAC that the
// register has no use for.
// ---------------------------------------------------------------------
export interface AnimalProfile {
  id: string;
  orgId: string;
  ranchId: string;
  ranchName: string;
  sectionId: string | null;
  sectionName: string | null;
  tagNumber: string;
  name: string | null;
  speciesId: string | null;
  speciesName: string | null;
  breedId: string | null;
  breedName: string | null;
  sex: string;
  color: string | null;
  dateOfBirth: string | null;
  dobIsEstimated: boolean;
  acquisitionType: string;
  acquisitionDate: string | null;
  damId: string | null;
  sireId: string | null;
  statusId: string;
  statusName: string;
  statusColorToken: string;
  photoPath: string | null;
  anitracAin: string | null;
  notes: string | null;
  attentionSeverity: "high" | "medium" | "info" | null;
  attentionReasonCount: number;
  createdAt: string;
}

export async function fetchAnimalProfile(animalId: string): Promise<AnimalProfile | null> {
  const { data, error } = await supabase
    .from("v_animal_current")
    .select(
      "id, org_id, ranch_id, ranch_name, section_id, section_name, tag_number, name, species_id, species_name, breed_id, breed_name, sex, color, date_of_birth, dob_is_estimated, acquisition_type, acquisition_date, dam_id, sire_id, status_id, status_name, status_color_token, photo_path, anitrac_ain, notes, attention_severity, attention_reason_count, created_at",
    )
    .eq("id", animalId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: nonNull(data.id, "id"),
    orgId: nonNull(data.org_id, "org_id"),
    ranchId: nonNull(data.ranch_id, "ranch_id"),
    ranchName: nonNull(data.ranch_name, "ranch_name"),
    sectionId: data.section_id,
    sectionName: data.section_name,
    tagNumber: nonNull(data.tag_number, "tag_number"),
    name: data.name,
    speciesId: data.species_id,
    speciesName: data.species_name,
    breedId: data.breed_id,
    breedName: data.breed_name,
    sex: nonNull(data.sex, "sex"),
    color: data.color,
    dateOfBirth: data.date_of_birth,
    dobIsEstimated: nonNull(data.dob_is_estimated, "dob_is_estimated"),
    acquisitionType: nonNull(data.acquisition_type, "acquisition_type"),
    acquisitionDate: data.acquisition_date,
    damId: data.dam_id,
    sireId: data.sire_id,
    statusId: nonNull(data.status_id, "status_id"),
    statusName: nonNull(data.status_name, "status_name"),
    statusColorToken: nonNull(data.status_color_token, "status_color_token"),
    photoPath: data.photo_path,
    anitracAin: data.anitrac_ain,
    notes: data.notes,
    attentionSeverity: data.attention_severity as AnimalProfile["attentionSeverity"],
    attentionReasonCount: nonNull(data.attention_reason_count, "attention_reason_count"),
    createdAt: nonNull(data.created_at, "created_at"),
  };
}

// ---------------------------------------------------------------------
// Lightweight animal identity — parents-linked (Overview) and the
// Lineage tree's cards both just need id/tag/name/sex/photo, not the
// full profile. One shared shape and fetcher for both rather than two
// near-duplicate queries.
// ---------------------------------------------------------------------
export interface AnimalSummary {
  id: string;
  tagNumber: string;
  name: string | null;
  sex: string;
  photoPath: string | null;
  speciesName: string | null;
}

export async function fetchAnimalSummaries(ids: string[]): Promise<AnimalSummary[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("v_animal_current")
    .select("id, tag_number, name, sex, photo_path, species_name")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    tagNumber: nonNull(row.tag_number, "tag_number"),
    name: row.name,
    sex: nonNull(row.sex, "sex"),
    photoPath: row.photo_path,
    speciesName: row.species_name,
  }));
}

export type LineageDirection = "ancestors" | "descendants";

export interface LineageNode extends AnimalSummary {
  depth: number;
  relation: "dam" | "sire" | null;
}

// get_ancestors/get_descendants (0006_animals.sql) return bare
// id/depth(/relation) — this joins that against v_animal_current for
// the tag/name/sex/photo the Lineage tab's cards actually render, in
// one extra round trip rather than a client-side loop of per-id
// fetches. Two explicit branches rather than one call keyed by a
// runtime rpc-name string: the two RPCs return different shapes
// (get_ancestors alone carries `relation`), and branching on the
// literal call keeps each one fully typed instead of leaning on a
// union TypeScript would otherwise have to narrow by hand.
export async function fetchAnimalLineage(
  animalId: string,
  direction: LineageDirection,
  maxDepth = 3,
): Promise<LineageNode[]> {
  const nodes: { id: string; depth: number; relation: "dam" | "sire" | null }[] = [];

  if (direction === "ancestors") {
    const { data, error } = await supabase.rpc("get_ancestors", { p_animal_id: animalId, p_max_depth: maxDepth });
    if (error) throw error;
    for (const n of data ?? []) nodes.push({ id: n.id, depth: n.depth, relation: n.relation as "dam" | "sire" });
  } else {
    const { data, error } = await supabase.rpc("get_descendants", { p_animal_id: animalId, p_max_depth: maxDepth });
    if (error) throw error;
    for (const n of data ?? []) nodes.push({ id: n.id, depth: n.depth, relation: null });
  }

  if (nodes.length === 0) return [];

  const summaries = await fetchAnimalSummaries(nodes.map((n) => n.id));
  const summaryById = new Map(summaries.map((s) => [s.id, s]));

  return nodes
    .map((n): LineageNode | null => {
      const summary = summaryById.get(n.id);
      return summary ? { ...summary, depth: n.depth, relation: n.relation } : null;
    })
    .filter((n): n is LineageNode => n !== null);
}

// ---------------------------------------------------------------------
// Documents tab — attachments metadata rows. The actual file bytes go
// through Supabase Storage directly (uploadAnimalDocument/
// getDocumentSignedUrl below), not through this table's own client
// insert alone — the two calls happen together at the call site.
// ---------------------------------------------------------------------
export interface AnimalDocument {
  id: string;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedByName: string | null;
  createdAt: string;
}

export async function fetchAnimalDocuments(animalId: string): Promise<AnimalDocument[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("id, file_path, file_name, mime_type, size_bytes, created_at, uploader:profiles!uploaded_by(full_name)")
    .eq("entity_type", "animal")
    .eq("entity_id", animalId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: nonNull(row.id, "id"),
    filePath: nonNull(row.file_path, "file_path"),
    fileName: nonNull(row.file_name, "file_name"),
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedByName: row.uploader?.full_name ?? null,
    createdAt: nonNull(row.created_at, "created_at"),
  }));
}

// Path convention enforced by storage.objects RLS (0024_documents_storage.sql):
// {org_id}/{animal_id}/{uuid}-{filename} — has_animal_access() checks the
// second path segment, so this shape is load-bearing, not cosmetic.
export async function uploadAnimalDocument(
  orgId: string,
  animalId: string,
  file: File,
  uploadedBy: string,
): Promise<void> {
  const path = `${orgId}/${animalId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("attachments").insert({
    org_id: orgId,
    entity_type: "animal",
    entity_id: animalId,
    file_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: uploadedBy,
  });
  if (insertError) throw insertError;
}

// Signed, short-lived — no public bucket reads anywhere (CLAUDE.md §7).
export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------------------------------------------------------------
// Overview tab summary — "last X" per health/weight domain, queried
// directly against each domain's own table rather than derived from
// v_recent_activity: these are specific per-type facts ("last
// vaccination"), not a flattened feed, and stay buildable without
// 0023's new view columns. The "three most recent events" strip is the
// one Overview piece that does use the richer feed — see
// fetchAnimalTimeline further down.
// ---------------------------------------------------------------------
export interface AnimalOverviewSummary {
  lastVaccination: { date: string; vaccineName: string } | null;
  lastTreatment: { date: string; medicationName: string | null } | null;
  lastVetVisit: { date: string; purpose: string | null } | null;
  lastWeight: { date: string; weightKg: number | null; bodyConditionScore: number | null; adgKg: number | null } | null;
  activePregnancy: { breedingEventId: string; status: string; expectedDueDate: string | null } | null;
}

export async function fetchAnimalOverviewSummary(animalId: string, sex: string): Promise<AnimalOverviewSummary> {
  const [vacRes, treatRes, vetRes, weightRes, pregRes] = await Promise.all([
    supabase
      .from("vaccinations")
      .select("date_administered, vaccine:vaccines(name)")
      .eq("animal_id", animalId)
      .is("deleted_at", null)
      .order("date_administered", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("treatments")
      .select("treatment_date, medication:medications(name), custom_medication")
      .eq("animal_id", animalId)
      .is("deleted_at", null)
      .order("treatment_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vet_visit_animals")
      .select("vet_visit:vet_visits(visit_date, purpose)")
      .eq("animal_id", animalId)
      .is("deleted_at", null)
      .order("visit_date", { foreignTable: "vet_visits", ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("v_animal_weight_series")
      .select("weight_date, weight_kg, body_condition_score, average_daily_gain_kg")
      .eq("animal_id", animalId)
      .order("weight_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sex === "female"
      ? supabase
          .from("breeding_events")
          .select("id, status, expected_due_date, expected_due_window_start")
          .eq("dam_id", animalId)
          .is("deleted_at", null)
          .in("status", ["served", "confirmed_pregnant"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (vacRes.error) throw vacRes.error;
  if (treatRes.error) throw treatRes.error;
  if (vetRes.error) throw vetRes.error;
  if (weightRes.error) throw weightRes.error;
  if (pregRes.error) throw pregRes.error;

  return {
    lastVaccination: vacRes.data
      ? { date: vacRes.data.date_administered, vaccineName: vacRes.data.vaccine?.name ?? "Vaccine" }
      : null,
    lastTreatment: treatRes.data
      ? {
          date: treatRes.data.treatment_date,
          medicationName: treatRes.data.medication?.name ?? treatRes.data.custom_medication,
        }
      : null,
    lastVetVisit: vetRes.data?.vet_visit
      ? { date: vetRes.data.vet_visit.visit_date, purpose: vetRes.data.vet_visit.purpose }
      : null,
    lastWeight: weightRes.data
      ? {
          date: nonNull(weightRes.data.weight_date, "weight_date"),
          weightKg: weightRes.data.weight_kg,
          bodyConditionScore: weightRes.data.body_condition_score,
          adgKg: weightRes.data.average_daily_gain_kg,
        }
      : null,
    activePregnancy: pregRes.data
      ? {
          breedingEventId: pregRes.data.id,
          status: pregRes.data.status,
          expectedDueDate: pregRes.data.expected_due_date ?? pregRes.data.expected_due_window_start,
        }
      : null,
  };
}

// ---------------------------------------------------------------------
// Timeline — the profile's signature element (Timeline tab) and the
// Overview tab's "three most recent events" strip both read this one
// function; Overview just takes the first few rows. Backed by
// v_recent_activity as extended in 0023_animal_profile.sql — until
// that migration is applied and types regenerated, actor_name/
// source_id/details won't exist on the generated row type. Same
// "written against the real intended schema, blocked honestly on the
// pending migration" approach as fetchAnimalRegister in Session 3.
// ---------------------------------------------------------------------
export type TimelineEventType =
  | "origin"
  | "vaccination"
  | "treatment"
  | "illness"
  | "illness_resolved"
  | "vet_visit"
  | "weight"
  | "movement"
  | "breeding"
  | "birth"
  | "mortality";

export interface TimelineEvent {
  eventType: TimelineEventType;
  eventDate: string;
  description: string;
  actorName: string | null;
  sourceId: string;
  details: Record<string, unknown>;
}

export async function fetchAnimalTimeline(
  animalId: string,
  options: { eventType?: TimelineEventType; limit?: number } = {},
): Promise<TimelineEvent[]> {
  let query = supabase
    .from("v_recent_activity")
    .select("event_type, event_date, description, actor_name, source_id, details")
    .eq("animal_id", animalId)
    .order("event_date", { ascending: false });

  if (options.eventType) query = query.eq("event_type", options.eventType);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    eventType: nonNull(row.event_type, "event_type") as TimelineEventType,
    eventDate: nonNull(row.event_date, "event_date"),
    description: nonNull(row.description, "description"),
    actorName: row.actor_name,
    sourceId: nonNull(row.source_id, "source_id"),
    details: (row.details as Record<string, unknown> | null) ?? {},
  }));
}

export interface AnimalFilterOptions {
  // defaultTagPrefix feeds Enrollment Mode's tag suggestion
  // (features/enrollment, Session 5b) — species.default_tag_prefix,
  // not invented here, just carried through to the one other place
  // that already needed the rest of this reference data.
  species: { id: string; name: string; defaultTagPrefix: string | null }[];
  breeds: { id: string; name: string; speciesId: string }[];
  statuses: { id: string; name: string; colorToken: string }[];
  sections: { id: string; name: string; ranchId: string }[];
}

// Reference data for filter dropdown labels — facet counts are keyed
// by id, this supplies the names. RLS on all four tables already
// scopes to the current org; no explicit filter needed here.
export async function fetchAnimalFilterOptions(): Promise<AnimalFilterOptions> {
  const [speciesRes, breedsRes, statusesRes, sectionsRes] = await Promise.all([
    supabase.from("species").select("id, name, default_tag_prefix").order("name"),
    supabase.from("breeds").select("id, name, species_id").order("name"),
    supabase.from("animal_statuses").select("id, name, color_token").order("sort_order"),
    supabase.from("ranch_sections").select("id, name, ranch_id").order("sort_order"),
  ]);

  if (speciesRes.error) throw speciesRes.error;
  if (breedsRes.error) throw breedsRes.error;
  if (statusesRes.error) throw statusesRes.error;
  if (sectionsRes.error) throw sectionsRes.error;

  return {
    species: speciesRes.data.map((s) => ({ id: s.id, name: s.name, defaultTagPrefix: s.default_tag_prefix })),
    breeds: breedsRes.data.map((b) => ({ id: b.id, name: b.name, speciesId: b.species_id })),
    statuses: statusesRes.data.map((s) => ({ id: s.id, name: s.name, colorToken: s.color_token })),
    sections: sectionsRes.data.map((s) => ({ id: s.id, name: s.name, ranchId: s.ranch_id })),
  };
}
