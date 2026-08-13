import { createFileRoute } from "@tanstack/react-router";

import { feedingRegisterSearchSchema } from "@/features/feeding/schema";
import { FeedingRegisterPage } from "@/features/feeding/components/FeedingRegisterPage";

export const Route = createFileRoute("/_authenticated/feeding/")({
  validateSearch: feedingRegisterSearchSchema,
  component: FeedingRegisterPage,
});
