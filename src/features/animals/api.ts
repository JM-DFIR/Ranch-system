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

export interface AnimalFilterOptions {
  species: { id: string; name: string }[];
  breeds: { id: string; name: string; speciesId: string }[];
  statuses: { id: string; name: string; colorToken: string }[];
  sections: { id: string; name: string; ranchId: string }[];
}

// Reference data for filter dropdown labels — facet counts are keyed
// by id, this supplies the names. RLS on all four tables already
// scopes to the current org; no explicit filter needed here.
export async function fetchAnimalFilterOptions(): Promise<AnimalFilterOptions> {
  const [speciesRes, breedsRes, statusesRes, sectionsRes] = await Promise.all([
    supabase.from("species").select("id, name").order("name"),
    supabase.from("breeds").select("id, name, species_id").order("name"),
    supabase.from("animal_statuses").select("id, name, color_token").order("sort_order"),
    supabase.from("ranch_sections").select("id, name, ranch_id").order("sort_order"),
  ]);

  if (speciesRes.error) throw speciesRes.error;
  if (breedsRes.error) throw breedsRes.error;
  if (statusesRes.error) throw statusesRes.error;
  if (sectionsRes.error) throw sectionsRes.error;

  return {
    species: speciesRes.data,
    breeds: breedsRes.data.map((b) => ({ id: b.id, name: b.name, speciesId: b.species_id })),
    statuses: statusesRes.data.map((s) => ({ id: s.id, name: s.name, colorToken: s.color_token })),
    sections: sectionsRes.data.map((s) => ({ id: s.id, name: s.name, ranchId: s.ranch_id })),
  };
}
