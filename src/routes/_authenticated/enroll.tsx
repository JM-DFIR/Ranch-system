import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { EmptyState } from "@/components/patterns/EmptyState";
import { EnrollmentScreen } from "@/features/enrollment/components/EnrollmentScreen";

// Enrollment is inherently ranch-specific — you're standing on one
// ranch enrolling its animals — so this reads the same global ranch
// scope every other screen does (_authenticated's `ranch` search
// param, Session 2) rather than adding a second, competing ranch
// picker. Choosing a ranch is something to do before losing signal,
// not part of the minimal capture flow itself (session-pack.md,
// Session 5a).
export const Route = createFileRoute("/_authenticated/enroll")({
  component: EnrollRoute,
});

function EnrollRoute() {
  const { ranch } = AuthenticatedRoute.useSearch();

  if (!ranch) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          icon={MapPin}
          title="Choose a ranch first"
          description="Enrollment records animals against the ranch you're currently scoped to. Pick one from the switcher at the top of the screen before you head out."
        />
      </div>
    );
  }

  return <EnrollmentScreen ranchId={ranch} />;
}
