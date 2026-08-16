import { supabase } from "@/lib/supabase";
import { emptyToUndefined, nonNull } from "@/lib/utils";
import type { PageSize } from "@/features/animals/schema";
import type {
  InviteUserFormValues,
  NewAnimalStatusFormValues,
  NewBreedFormValues,
  NewCareActivityTypeFormValues,
  NewFeedItemFormValues,
  NewIllnessTypeFormValues,
  NewMedicationFormValues,
  NewSpeciesFormValues,
  NewVaccineFormValues,
  OrgSettingsFormValues,
} from "./schema";

// ---------------------------------------------------------------------
// Users & Roles — v_org_members (0030_admin.sql) aggregates each
// member's live ranch assignments so this stays one query, server-side
// paginated like every other register in this project.
// ---------------------------------------------------------------------
export interface OrgMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "owner" | "ranch_manager";
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  ranchNames: string[];
  ranchCount: number;
}

export interface OrgMembersResult {
  rows: OrgMember[];
  totalCount: number;
}

export async function fetchOrgMembers(orgId: string, page: number, pageSize: PageSize): Promise<OrgMembersResult> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("v_org_members")
    .select("id, full_name, email, phone, role, is_active, last_seen_at, created_at, ranch_names, ranch_count", { count: "exact" })
    .eq("org_id", orgId)
    .order("full_name")
    .range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      fullName: nonNull(row.full_name, "full_name"),
      email: nonNull(row.email, "email"),
      phone: row.phone,
      role: row.role === "owner" ? "owner" : "ranch_manager",
      isActive: nonNull(row.is_active, "is_active"),
      lastSeenAt: row.last_seen_at,
      createdAt: nonNull(row.created_at, "created_at"),
      ranchNames: row.ranch_names ?? [],
      ranchCount: row.ranch_count ?? 0,
    })),
    totalCount: count ?? 0,
  };
}

export async function updateProfileRole(profileId: string, role: "owner" | "ranch_manager"): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw error;
}

export async function updateProfileActive(profileId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Ranch Assignments — per-member editor. Unassign is a soft delete;
// reassigning the same (ranch_id, profile_id) pair afterwards relies on
// 0030_admin.sql's partial unique index, not the original plain one.
// ---------------------------------------------------------------------
export interface RanchAssignmentRow {
  id: string;
  ranchId: string;
  ranchName: string;
}

export async function fetchRanchAssignments(profileId: string): Promise<RanchAssignmentRow[]> {
  const { data, error } = await supabase
    .from("ranch_assignments")
    .select("id, ranch_id, ranches(name)")
    .eq("profile_id", profileId)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, ranchId: row.ranch_id, ranchName: row.ranches?.name ?? "—" }));
}

export async function assignRanch(orgId: string, ranchId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from("ranch_assignments").insert({ org_id: orgId, ranch_id: ranchId, profile_id: profileId });
  if (error) throw error;
}

// A SECURITY DEFINER RPC (0032_soft_delete_rpcs.sql), not a plain
// client-side update: Postgres RLS requires the row RESULTING from an
// UPDATE to still satisfy the table's SELECT policy, not just the
// UPDATE policy's own with_check — and ranch_assignments_select filters
// deleted_at is null, so a plain `.update({deleted_at})` here would
// reject its own write with 42501. Found running the pgTAP suite for
// real, not theoretical.
export async function unassignRanch(assignmentId: string): Promise<void> {
  const { error } = await supabase.rpc("unassign_ranch", { p_assignment_id: assignmentId });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Invitations — plain insert under invitations_owner_insert (0014_rls.sql).
// No email is sent (Resend integration is post-v1, CLAUDE.md §9's
// reminders-table sibling); the owner shares the resulting link
// themselves. Token is server-generated (invitations.token default).
// ---------------------------------------------------------------------
export interface InvitationRecord {
  id: string;
  email: string;
  role: "owner" | "ranch_manager";
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export async function fetchInvitations(orgId: string): Promise<InvitationRecord[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role === "owner" ? "owner" : "ranch_manager",
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }));
}

export async function inviteUser(orgId: string, invitedBy: string, values: InviteUserFormValues): Promise<InvitationRecord> {
  const { data, error } = await supabase
    .from("invitations")
    .insert({ org_id: orgId, invited_by: invitedBy, email: values.email, role: values.role })
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    email: data.email,
    role: data.role === "owner" ? "owner" : "ranch_manager",
    token: data.token,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    createdAt: data.created_at,
  };
}

// SECURITY DEFINER RPC — see unassignRanch's note; invitations_select
// also filters deleted_at is null.
export async function revokeInvitation(id: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: id });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Organisation Settings — two tables, one form (see schema.ts).
// ---------------------------------------------------------------------
export interface OrgSettings {
  orgId: string;
  name: string;
  timezone: string;
  weightUnit: "kg" | "lb";
  staleHealthDays: number;
  featureFlags: Record<string, boolean>;
}

export async function fetchOrgSettings(orgId: string): Promise<OrgSettings> {
  const [orgRes, settingsRes] = await Promise.all([
    supabase.from("organizations").select("name, timezone").eq("id", orgId).single(),
    supabase.from("organization_settings").select("weight_unit, stale_health_days, feature_flags").eq("org_id", orgId).single(),
  ]);
  if (orgRes.error) throw orgRes.error;
  if (settingsRes.error) throw settingsRes.error;

  return {
    orgId,
    name: orgRes.data.name,
    timezone: orgRes.data.timezone,
    weightUnit: settingsRes.data.weight_unit === "lb" ? "lb" : "kg",
    staleHealthDays: settingsRes.data.stale_health_days,
    featureFlags: (settingsRes.data.feature_flags as Record<string, boolean> | null) ?? {},
  };
}

export async function updateOrgSettings(orgId: string, current: OrgSettings, values: OrgSettingsFormValues): Promise<void> {
  const [orgResult, settingsResult] = await Promise.all([
    supabase.from("organizations").update({ name: values.name, timezone: values.timezone }).eq("id", orgId),
    supabase
      .from("organization_settings")
      .update({
        weight_unit: values.weightUnit,
        stale_health_days: Number(values.staleHealthDays),
        feature_flags: { ...current.featureFlags, finance: values.financeEnabled },
      })
      .eq("org_id", orgId),
  ]);
  if (orgResult.error) throw orgResult.error;
  if (settingsResult.error) throw settingsResult.error;
}

// ---------------------------------------------------------------------
// Audit Log — read-only, owner-only (v_audit_log / audit_log_select,
// 0014_rls.sql / 0030_admin.sql).
// ---------------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  actorName: string | null;
  tableName: string;
  recordId: string | null;
  action: "insert" | "update" | "delete" | "restore";
  occurredAt: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface AuditLogParams {
  tableName?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: PageSize;
}

export interface AuditLogResult {
  rows: AuditLogEntry[];
  totalCount: number;
}

export async function fetchAuditLog(orgId: string, params: AuditLogParams): Promise<AuditLogResult> {
  const from = params.page * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .from("v_audit_log")
    .select("id, actor_name, table_name, record_id, action, occurred_at, before, after", { count: "exact" })
    .eq("org_id", orgId);

  if (params.tableName) query = query.eq("table_name", params.tableName);
  if (params.action) query = query.eq("action", params.action);
  if (params.dateFrom) query = query.gte("occurred_at", params.dateFrom);
  if (params.dateTo) query = query.lte("occurred_at", `${params.dateTo}T23:59:59`);

  const { data, error, count } = await query.order("occurred_at", { ascending: false }).range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []).map((row) => ({
      id: nonNull(row.id, "id"),
      actorName: row.actor_name,
      tableName: nonNull(row.table_name, "table_name"),
      recordId: row.record_id,
      action: row.action as AuditLogEntry["action"],
      occurredAt: nonNull(row.occurred_at, "occurred_at"),
      before: row.before as Record<string, unknown> | null,
      after: row.after as Record<string, unknown> | null,
    })),
    totalCount: count ?? 0,
  };
}

// distinct table names for the Audit Log's filter dropdown — the
// tables log_audit_event() is actually attached to (0012_system.sql),
// listed here rather than queried, since it's a fixed, small set.
export const AUDIT_LOG_TABLES = [
  "animals",
  "movements",
  "mortalities",
  "breeding_events",
  "births",
  "vaccinations",
  "treatments",
  "illnesses",
] as const;

// ---------------------------------------------------------------------
// Reference Data Manager — eight org-wide catalogues (veterinarians has
// its own directory screen already, see health/api.ts). Each table gets
// its own small fetch/create/softDelete trio rather than one generic
// function taking a table name — PostgREST's generated types don't
// unify cleanly across tables with different columns, and past sessions
// already hit real type-inference bugs trying to shortcut that
// (conditional .select() strings, ternary-derived insert rows). Plain
// and repetitive here is the safer choice.
// ---------------------------------------------------------------------

export interface SpeciesRecord {
  id: string;
  name: string;
  defaultTagPrefix: string | null;
  defaultGestationDays: number | null;
  isSystem: boolean;
}

export async function fetchSpeciesList(orgId: string): Promise<SpeciesRecord[]> {
  const { data, error } = await supabase
    .from("species")
    .select("id, name, default_tag_prefix, default_gestation_days, is_system")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    defaultTagPrefix: r.default_tag_prefix,
    defaultGestationDays: r.default_gestation_days,
    isSystem: r.is_system,
  }));
}

export async function createSpecies(orgId: string, values: NewSpeciesFormValues): Promise<void> {
  const { error } = await supabase.from("species").insert({
    org_id: orgId,
    name: values.name,
    default_tag_prefix: emptyToUndefined(values.defaultTagPrefix),
    default_gestation_days: values.defaultGestationDays ? Number(values.defaultGestationDays) : undefined,
  });
  if (error) throw error;
}

// A SECURITY DEFINER RPC (0032_soft_delete_rpcs.sql), not a plain
// client-side update: Postgres RLS requires the row RESULTING from an
// UPDATE to still satisfy the table's SELECT policy, not just the
// UPDATE policy's own with_check — and every reference catalogue's
// select policy filters deleted_at is null, so a plain
// `.update({deleted_at})` here rejects its own write with 42501. Found
// running the pgTAP suite for real, not theoretical — same fix applies
// to every softDelete* function below, and to unassignRanch/
// revokeInvitation above.
export async function softDeleteSpecies(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "species", p_id: id });
  if (error) throw error;
}

export interface BreedRecord {
  id: string;
  name: string;
  speciesId: string;
  speciesName: string;
}

export async function fetchBreedsList(orgId: string): Promise<BreedRecord[]> {
  const { data, error } = await supabase
    .from("breeds")
    .select("id, name, species_id, species(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, speciesId: r.species_id, speciesName: r.species?.name ?? "—" }));
}

export async function createBreed(orgId: string, values: NewBreedFormValues): Promise<void> {
  const { error } = await supabase.from("breeds").insert({ org_id: orgId, species_id: values.speciesId, name: values.name });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteBreed(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "breeds", p_id: id });
  if (error) throw error;
}

export interface AnimalStatusRecord {
  id: string;
  name: string;
  isActiveStatus: boolean;
  isSystem: boolean;
}

export async function fetchAnimalStatusesList(orgId: string): Promise<AnimalStatusRecord[]> {
  const { data, error } = await supabase
    .from("animal_statuses")
    .select("id, name, is_active_status, is_system")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, isActiveStatus: r.is_active_status, isSystem: r.is_system }));
}

export async function createAnimalStatus(orgId: string, values: NewAnimalStatusFormValues): Promise<void> {
  const { error } = await supabase
    .from("animal_statuses")
    .insert({ org_id: orgId, name: values.name, is_active_status: values.isActiveStatus });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteAnimalStatus(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "animal_statuses", p_id: id });
  if (error) throw error;
}

export interface VaccineRecord {
  id: string;
  name: string;
  speciesName: string | null;
  targetDisease: string | null;
  defaultIntervalDays: number | null;
}

export async function fetchVaccinesList(orgId: string): Promise<VaccineRecord[]> {
  const { data, error } = await supabase
    .from("vaccines")
    .select("id, name, target_disease, default_interval_days, species(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    speciesName: r.species?.name ?? null,
    targetDisease: r.target_disease,
    defaultIntervalDays: r.default_interval_days,
  }));
}

export async function createVaccineDetailed(orgId: string, values: NewVaccineFormValues): Promise<void> {
  const { error } = await supabase.from("vaccines").insert({
    org_id: orgId,
    name: values.name,
    species_id: emptyToUndefined(values.speciesId),
    target_disease: emptyToUndefined(values.targetDisease),
    default_interval_days: values.defaultIntervalDays ? Number(values.defaultIntervalDays) : undefined,
  });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteVaccine(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "vaccines", p_id: id });
  if (error) throw error;
}

export interface MedicationRecord {
  id: string;
  name: string;
  activeIngredient: string | null;
  defaultWithdrawalDays: number | null;
}

export async function fetchMedicationsList(orgId: string): Promise<MedicationRecord[]> {
  const { data, error } = await supabase
    .from("medications")
    .select("id, name, active_ingredient, default_withdrawal_days")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    activeIngredient: r.active_ingredient,
    defaultWithdrawalDays: r.default_withdrawal_days,
  }));
}

export async function createMedicationDetailed(orgId: string, values: NewMedicationFormValues): Promise<void> {
  const { error } = await supabase.from("medications").insert({
    org_id: orgId,
    name: values.name,
    active_ingredient: emptyToUndefined(values.activeIngredient),
    default_withdrawal_days: values.defaultWithdrawalDays ? Number(values.defaultWithdrawalDays) : undefined,
  });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteMedication(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "medications", p_id: id });
  if (error) throw error;
}

export interface IllnessTypeRecord {
  id: string;
  name: string;
  speciesName: string | null;
}

export async function fetchIllnessTypesList(orgId: string): Promise<IllnessTypeRecord[]> {
  const { data, error } = await supabase
    .from("illness_types")
    .select("id, name, species(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, speciesName: r.species?.name ?? null }));
}

export async function createIllnessTypeDetailed(orgId: string, values: NewIllnessTypeFormValues): Promise<void> {
  const { error } = await supabase
    .from("illness_types")
    .insert({ org_id: orgId, name: values.name, species_id: emptyToUndefined(values.speciesId) });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteIllnessType(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "illness_types", p_id: id });
  if (error) throw error;
}

export interface FeedItemRecord {
  id: string;
  name: string;
  unit: string;
}

export async function fetchFeedItemsList(orgId: string): Promise<FeedItemRecord[]> {
  const { data, error } = await supabase
    .from("feed_items")
    .select("id, name, unit")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createFeedItemDetailed(orgId: string, values: NewFeedItemFormValues): Promise<void> {
  const { error } = await supabase.from("feed_items").insert({ org_id: orgId, name: values.name, unit: values.unit });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteFeedItem(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "feed_items", p_id: id });
  if (error) throw error;
}

export interface CareActivityTypeRecord {
  id: string;
  name: string;
}

export async function fetchCareActivityTypesList(orgId: string): Promise<CareActivityTypeRecord[]> {
  const { data, error } = await supabase
    .from("care_activity_types")
    .select("id, name")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCareActivityTypeDetailed(orgId: string, values: NewCareActivityTypeFormValues): Promise<void> {
  const { error } = await supabase.from("care_activity_types").insert({ org_id: orgId, name: values.name });
  if (error) throw error;
}

// See softDeleteSpecies's note.
export async function softDeleteCareActivityType(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_reference_row", { p_table: "care_activity_types", p_id: id });
  if (error) throw error;
}
