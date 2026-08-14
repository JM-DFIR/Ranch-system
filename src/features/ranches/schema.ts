import { z } from "zod";

// Create/Edit Ranch (blueprint.md §4.1). Creating and structurally
// editing a ranch is an owner action (ranches_owner_insert/update,
// 0014_rls.sql) — this schema backs both, same form either way.
export const ranchFormSchema = z.object({
  name: z.string().min(1, { error: "Ranch name is required." }),
  location: z.string().optional(),
  description: z.string().optional(),
  sizeAcres: z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) > 0), { error: "Enter a size greater than zero." }),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional().refine((v) => !v || z.email().safeParse(v).success, { error: "Enter a valid email address." }),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional(),
});
export type RanchFormValues = z.infer<typeof ranchFormSchema>;

// Manage Sections — ranch_sections is manager-writable, not owner-only
// (ranch_sections_insert/update, 0014_rls.sql: "organising sections
// within a ranch you already manage is operational, not structural").
export const ranchSectionFormSchema = z.object({
  name: z.string().min(1, { error: "Section name is required." }),
  description: z.string().optional(),
});
export type RanchSectionFormValues = z.infer<typeof ranchSectionFormSchema>;
