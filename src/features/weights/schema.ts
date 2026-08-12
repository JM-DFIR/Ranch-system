import { z } from "zod";

// Record Weight (Session 8) — one of the five offline-queued operations
// (CLAUDE.md §8), so this follows the vaccination schema's shape, not
// the online-only treatment/illness/vet-visit ones. `weight_kg` and
// `body_condition_score` are both nullable in the schema (blueprint.md
// §2.3: "many ranches have no scale"), but bulk_weight_event itself
// rejects a row with neither set — mirrored here so the form catches it
// before the round trip, not after.
export const weightFormSchema = z
  .object({
    animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }),
    weightDate: z.string().min(1, { error: "Weight date is required." }),
    method: z.enum(["scale", "girth_tape", "visual_estimate"], { error: "Choose a method." }),
    weightKg: z.string().optional(),
    bodyConditionScore: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.weightDate <= new Date().toISOString().slice(0, 10), {
    error: "Weight date can't be in the future.",
    path: ["weightDate"],
  })
  .refine((data) => !!data.weightKg || !!data.bodyConditionScore, {
    error: "Enter a weight, a body condition score, or both.",
    path: ["weightKg"],
  });

export type WeightFormValues = z.infer<typeof weightFormSchema>;
