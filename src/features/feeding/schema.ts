import { z } from "zod";

const TODAY = () => new Date().toISOString().slice(0, 10);

// feeding_records/care_activities both carry animal_id and ranch_id as
// nullable with an "exactly one scope" CHECK (0011_feeding_care.sql) —
// most feeding is ranch-wide, not per-animal, unlike every other record
// flow so far, so this tagged union is the primary fork the form makes,
// not an afterthought. Animal scope is bulk-capable (several animals,
// one row each, same values) via a plain multi-row insert, same
// technique recordBreedingEvent already uses.
export const recordScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ranch"), ranchId: z.string().min(1, { error: "Choose a ranch." }), sectionId: z.string().optional() }),
  z.object({ type: z.literal("animal"), animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }) }),
]);

export const feedingFormSchema = z
  .object({
    scope: recordScopeSchema,
    feedItemId: z.string().min(1, { error: "Choose a feed item." }),
    feedDate: z.string().min(1, { error: "Feed date is required." }),
    quantity: z.string().min(1, { error: "Quantity is required." }),
    unit: z.string().min(1, { error: "Unit is required." }),
    notes: z.string().optional(),
  })
  .refine((data) => data.feedDate <= TODAY(), { error: "Feed date can't be in the future.", path: ["feedDate"] })
  .refine((data) => !Number.isNaN(Number(data.quantity)) && Number(data.quantity) > 0, {
    error: "Enter a quantity greater than zero.",
    path: ["quantity"],
  });

export type FeedingFormValues = z.infer<typeof feedingFormSchema>;

export const newFeedItemSchema = z.object({
  name: z.string().min(1, { error: "Feed item name is required." }),
  unit: z.string().min(1, { error: "Unit is required." }),
});

export const careActivityFormSchema = z
  .object({
    scope: recordScopeSchema,
    activityTypeId: z.string().min(1, { error: "Choose an activity type." }),
    activityDate: z.string().min(1, { error: "Activity date is required." }),
    product: z.string().optional(),
    nextDueDate: z.string().optional(),
    performedBy: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.activityDate <= TODAY(), { error: "Activity date can't be in the future.", path: ["activityDate"] });

export type CareActivityFormValues = z.infer<typeof careActivityFormSchema>;

export const newCareActivityTypeSchema = z.object({
  name: z.string().min(1, { error: "Activity type name is required." }),
});

// Shared by the standalone Feeding and Care registers (Part 5's "M5").
export const feedingRegisterSearchSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});

export type FeedingRegisterSearch = z.infer<typeof feedingRegisterSearchSchema>;
