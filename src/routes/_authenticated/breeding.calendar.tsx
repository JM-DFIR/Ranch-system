import { createFileRoute } from "@tanstack/react-router";

import { BreedingCalendarPage } from "@/features/breeding/components/BreedingCalendarPage";

export const Route = createFileRoute("/_authenticated/breeding/calendar")({
  component: BreedingCalendarPage,
});
