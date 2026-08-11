import { z } from "zod";

// The canonical "record X" schema (session-pack.md, Session 6) —
// fifteen other record flows copy this shape. Zod 4 syntax throughout
// (`error:`, not v3's `message:` — CLAUDE.md's stack table pins this).
//
// "administered by" is either a staff profile or a veterinarian
// (session-pack.md: "defaults to current user, changeable, with a
// veterinarian option") — modelled as one tagged field rather than two
// separate optional columns, so the form can never end up with both or
// neither set.
export const administeredBySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("profile"), id: z.string() }),
  z.object({ type: z.literal("veterinarian"), id: z.string() }),
]);

export const vaccinationFormSchema = z
  .object({
    animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }),
    vaccineId: z.string({ error: "Choose a vaccine." }).min(1, { error: "Choose a vaccine." }),
    dateAdministered: z.string().min(1, { error: "Date administered is required." }),
    dose: z.string().optional(),
    batchNumber: z.string().optional(),
    route: z.string().optional(),
    administeredBy: administeredBySchema,
    nextDueDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.dateAdministered <= new Date().toISOString().slice(0, 10), {
    error: "Date administered can't be in the future.",
    path: ["dateAdministered"],
  });

export type VaccinationFormValues = z.infer<typeof vaccinationFormSchema>;

export const newVaccineSchema = z.object({
  name: z.string().min(1, { error: "Vaccine name is required." }),
});
