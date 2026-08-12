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

// Medication is either a catalogue entry or free text (blueprint.md
// §12: treatments.medication_id / custom_medication) — modelled as a
// tagged field for the same reason administeredBySchema is, so the
// form can't end up with both set or neither.
export const medicationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("catalogue"), id: z.string().min(1, { error: "Choose a medication from the list." }) }),
  z.object({ type: z.literal("custom"), name: z.string().min(1, { error: "Enter a medication name." }) }),
]);

export const treatmentFormSchema = z
  .object({
    animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }),
    illnessId: z.string().optional(),
    medication: medicationSchema,
    treatmentDate: z.string().min(1, { error: "Treatment date is required." }),
    dosage: z.string().optional(),
    route: z.string().optional(),
    durationDays: z.string().optional(),
    administeredBy: administeredBySchema,
    withdrawalUntil: z.string().optional(),
    outcome: z.string().optional(),
    followUpDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.treatmentDate <= new Date().toISOString().slice(0, 10), {
    error: "Treatment date can't be in the future.",
    path: ["treatmentDate"],
  });

export type TreatmentFormValues = z.infer<typeof treatmentFormSchema>;

export const newMedicationSchema = z.object({
  name: z.string().min(1, { error: "Medication name is required." }),
});

// Illness type is either a catalogue entry or free text (illnesses.
// illness_type_id / custom_name), same either/or shape as medication.
export const illnessNameSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("catalogue"), id: z.string().min(1, { error: "Choose an illness from the list." }) }),
  z.object({ type: z.literal("custom"), name: z.string().min(1, { error: "Enter an illness name." }) }),
]);

export const illnessFormSchema = z
  .object({
    animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }),
    illnessName: illnessNameSchema,
    onsetDate: z.string().min(1, { error: "Onset date is required." }),
    severity: z.enum(["mild", "moderate", "severe"], { error: "Choose a severity." }),
    // No `.default()` here — the actual default (`"suspected"`) comes
    // from useForm's `defaultValues` instead. Zod 4's `.default()`
    // makes the field optional on the resolver's *input* type but
    // required on its *output* type, which react-hook-form's
    // `useForm<IllnessFormValues>` can't reconcile against a single
    // form-values type — the exact TS2322 this avoids.
    status: z.enum(["suspected", "confirmed", "under_treatment", "recovered", "chronic"]),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    diagnosedBy: z.string().optional(),
    resolvedDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.onsetDate <= new Date().toISOString().slice(0, 10), {
    error: "Onset date can't be in the future.",
    path: ["onsetDate"],
  })
  .refine((data) => data.status !== "recovered" || !!data.resolvedDate, {
    error: "Enter the date it resolved.",
    path: ["resolvedDate"],
  });

export type IllnessFormValues = z.infer<typeof illnessFormSchema>;

export const newIllnessTypeSchema = z.object({
  name: z.string().min(1, { error: "Illness name is required." }),
});

export const vetVisitFormSchema = z
  .object({
    animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }),
    veterinarianId: z.string().optional(),
    visitDate: z.string().min(1, { error: "Visit date is required." }),
    purpose: z.string().optional(),
    findings: z.string().optional(),
    recommendations: z.string().optional(),
    nextVisitDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.visitDate <= new Date().toISOString().slice(0, 10), {
    error: "Visit date can't be in the future.",
    path: ["visitDate"],
  });

export type VetVisitFormValues = z.infer<typeof vetVisitFormSchema>;

export const newVeterinarianSchema = z.object({
  name: z.string().min(1, { error: "Veterinarian name is required." }),
  practice: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});
