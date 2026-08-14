import { z } from "zod";

// ---------------------------------------------------------------------
// Users & Roles / Invite User (blueprint.md §4.1 Admin: "Users & Roles
// · Invite User · Ranch Assignments"). Owner-only — mirrors
// invitations_owner_insert (0014_rls.sql).
// ---------------------------------------------------------------------
export const inviteUserSchema = z.object({
  email: z.string().min(1, { error: "Email is required." }).email({ error: "Enter a valid email address." }),
  role: z.enum(["owner", "ranch_manager"], { error: "Choose a role." }),
});
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export const usersRegisterSearchSchema = z.object({
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});
export type UsersRegisterSearch = z.infer<typeof usersRegisterSearchSchema>;

// ---------------------------------------------------------------------
// Organisation Settings — `organizations` (name, timezone) and
// `organization_settings` (weight_unit, stale_health_days, and the
// `finance` flag inside feature_flags — CLAUDE.md §9's switch) are two
// tables, edited from one screen. Owner-only (organizations_owner_update /
// organization_settings_owner_update, 0014_rls.sql).
// ---------------------------------------------------------------------
export const orgSettingsFormSchema = z.object({
  name: z.string().min(1, { error: "Organisation name is required." }),
  timezone: z.string().min(1, { error: "Timezone is required." }),
  weightUnit: z.enum(["kg", "lb"], { error: "Choose a weight unit." }),
  staleHealthDays: z
    .string()
    .min(1, { error: "Required." })
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, { error: "Enter a whole number greater than zero." }),
  financeEnabled: z.boolean(),
});
export type OrgSettingsFormValues = z.infer<typeof orgSettingsFormSchema>;

// ---------------------------------------------------------------------
// Audit Log viewer — filters only (the log itself is read-only, no
// client write path exists or should exist per audit_log's own design,
// 0012_system.sql).
// ---------------------------------------------------------------------
export const auditLogRegisterSearchSchema = z.object({
  tableName: z.string().optional(),
  action: z.enum(["insert", "update", "delete", "restore"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});
export type AuditLogRegisterSearch = z.infer<typeof auditLogRegisterSearchSchema>;

// ---------------------------------------------------------------------
// Reference Data Manager — eight org-wide catalogues (CLAUDE.md §6; the
// ninth, veterinarians, already has its own directory screen from
// Session 8 and isn't repeated here). Any org member can write
// (0021_reference_catalogue_manager_write.sql) — this is not
// owner-gated, unlike the rest of Admin.
// ---------------------------------------------------------------------
export const newSpeciesSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  defaultTagPrefix: z.string().optional(),
  defaultGestationDays: z.string().optional(),
});
export type NewSpeciesFormValues = z.infer<typeof newSpeciesSchema>;

export const newBreedSchema = z.object({
  speciesId: z.string().min(1, { error: "Choose a species." }),
  name: z.string().min(1, { error: "Name is required." }),
});
export type NewBreedFormValues = z.infer<typeof newBreedSchema>;

export const newAnimalStatusSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  isActiveStatus: z.boolean(),
});
export type NewAnimalStatusFormValues = z.infer<typeof newAnimalStatusSchema>;

export const newVaccineSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  speciesId: z.string().optional(),
  targetDisease: z.string().optional(),
  defaultIntervalDays: z.string().optional(),
});
export type NewVaccineFormValues = z.infer<typeof newVaccineSchema>;

export const newMedicationSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  activeIngredient: z.string().optional(),
  defaultWithdrawalDays: z.string().optional(),
});
export type NewMedicationFormValues = z.infer<typeof newMedicationSchema>;

export const newIllnessTypeSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  speciesId: z.string().optional(),
});
export type NewIllnessTypeFormValues = z.infer<typeof newIllnessTypeSchema>;

export const newFeedItemSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  unit: z.string().min(1, { error: "Unit is required." }),
});
export type NewFeedItemFormValues = z.infer<typeof newFeedItemSchema>;

export const newCareActivityTypeSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
});
export type NewCareActivityTypeFormValues = z.infer<typeof newCareActivityTypeSchema>;
