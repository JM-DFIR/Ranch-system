import { z } from "zod";

const TODAY = () => new Date().toISOString().slice(0, 10);

// Sire is either a specific animal or free text (breeding_events.sire_id
// / external_sire_note, 0009_breeding.sql) — same either/or shape as
// medication/illness-name in features/health/schema.ts, for the same
// reason: an unrecorded or bought-in sire is a real, intended case, not
// an edge case to force into the catalogue.
export const sireSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("animal"), id: z.string().min(1, { error: "Choose a sire." }) }),
  z.object({ type: z.literal("external"), note: z.string().min(1, { error: "Describe the sire." }) }),
  z.object({ type: z.literal("unknown") }),
]);

// Service date (AI or a known single mating) and a joining window
// (buck/ram-run breeding, blueprint.md §2.2) are the same either/or the
// schema itself models — exactly one of the two is set, never both,
// never neither.
export const breedingDateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("service"), serviceDate: z.string().min(1, { error: "Service date is required." }) }),
  z.object({
    type: z.literal("joining"),
    joiningStart: z.string().min(1, { error: "Joining start is required." }),
    joiningEnd: z.string().optional(),
  }),
]);

export const breedingEventFormSchema = z.object({
  // Dams, plural — a buck/ram-run breeds several dams over one joining
  // window in a single action (blueprint.md §0.6's goat/cattle
  // convention), same "one action, N individual records" shape as the
  // bulk_*_event RPCs, just via a plain multi-row insert rather than
  // an RPC (breeding_events has no bulk RPC — its RLS insert policy
  // already checks has_animal_access(dam_id) per row).
  damIds: z.array(z.string()).min(1, { error: "Select at least one dam." }),
  method: z.enum(["natural", "artificial_insemination"], { error: "Choose a method." }),
  sire: sireSchema,
  breedingDate: breedingDateSchema,
  technician: z.string().optional(),
  strawCode: z.string().optional(),
  notes: z.string().optional(),
});

export type BreedingEventFormValues = z.infer<typeof breedingEventFormSchema>;

export const pregnancyCheckFormSchema = z
  .object({
    checkDate: z.string().min(1, { error: "Check date is required." }),
    method: z.string().optional(),
    result: z.enum(["pregnant", "not_pregnant", "inconclusive"], { error: "Choose a result." }),
    estimatedDays: z.string().optional(),
  })
  .refine((data) => data.checkDate <= TODAY(), { error: "Check date can't be in the future.", path: ["checkDate"] });

export type PregnancyCheckFormValues = z.infer<typeof pregnancyCheckFormSchema>;

const offspringSchema = z.object({
  tagNumber: z.string().optional(),
  sex: z.enum(["male", "female", "unknown"]),
  birthWeight: z.string().optional(),
  outcome: z.enum(["live", "stillborn", "died_shortly_after"]),
});

export const birthFormSchema = z.object({
  damId: z.string().min(1, { error: "Choose the dam." }),
  breedingEventId: z.string().optional(),
  birthDate: z.string().min(1, { error: "Birth date is required." }),
  ease: z.enum(["unassisted", "assisted", "veterinary"]),
  complications: z.string().optional(),
  offspring: z.array(offspringSchema).min(1, { error: "Add at least one offspring." }),
  notes: z.string().optional(),
});

export type BirthFormValues = z.infer<typeof birthFormSchema>;

// Shared by the standalone Breeding register (Part 5's "M4").
export const breedingRegisterSearchSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});

export type BreedingRegisterSearch = z.infer<typeof breedingRegisterSearchSchema>;
