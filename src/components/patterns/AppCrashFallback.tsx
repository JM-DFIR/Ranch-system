import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

// The top-level Sentry.ErrorBoundary fallback (src/main.tsx) — the last
// line of defence when something crashes outside any individual
// screen's own error handling. Same centered-card shape as
// AuthPageShell, since this can render before the app shell itself
// ever mounts.
export function AppCrashFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-card bg-status-critical/10 text-status-critical">
          <TriangleAlert className="size-6" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-20 font-semibold text-foreground">Something went wrong</h1>
          <p className="text-14 text-muted-foreground">
            The app hit an unexpected error. Reloading usually fixes it — your offline queue, if you have one, isn't
            affected.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} className="w-full">
          Reload
        </Button>
      </div>
    </main>
  );
}
