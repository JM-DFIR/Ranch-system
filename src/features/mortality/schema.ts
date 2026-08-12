import { z } from "zod";

// Shared by the standalone Mortality register (Part 5's "M4").
export const mortalityRegisterSearchSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.union([z.literal(25), z.literal(50), z.literal(100), z.literal(200)]).optional(),
});

export type MortalityRegisterSearch = z.infer<typeof mortalityRegisterSearchSchema>;
