import { z } from "zod";

// Record Transfer (M4 — session-pack.md Part 5). One of the five
// offline-queued operations (CLAUDE.md §8: create_movement), so this
// follows the vaccination/weight schema's shape. `toRanchId` is the
// only ranch the client ever supplies — record_movement() resolves
// `from_ranch_id` itself, server-side, from the animal's current row
// (0017_rpc.sql) — never trusted from client input (CLAUDE.md §7).
export const transferFormSchema = z
  .object({
    animalIds: z.array(z.string()).min(1, { error: "Select at least one animal." }),
    toRanchId: z.string().min(1, { error: "Choose a destination ranch." }),
    toSectionId: z.string().optional(),
    movementDate: z.string().min(1, { error: "Movement date is required." }),
    reason: z.string().optional(),
    permitNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.movementDate <= new Date().toISOString().slice(0, 10), {
    error: "Movement date can't be in the future.",
    path: ["movementDate"],
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;

// Shared by the standalone Movements register (Part 5's "M4").
export const movementRegisterSearchSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});

export type MovementRegisterSearch = z.infer<typeof movementRegisterSearchSchema>;
