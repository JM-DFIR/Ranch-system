import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/session-expired")({
  component: SessionExpiredPage,
});

function SessionExpiredPage() {
  return (
    <AuthPageShell
      title="You've been signed out"
      description="Your session ended, most likely from inactivity. Log in again to continue."
    >
      <Button asChild className="w-full">
        <Link to="/login">Log in again</Link>
      </Button>
    </AuthPageShell>
  );
}
