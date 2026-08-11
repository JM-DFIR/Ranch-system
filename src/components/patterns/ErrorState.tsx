import { RefreshCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

// Distinct from EmptyState — a failed fetch is not "there's nothing
// here," and rendering the empty-register copy on a query error would
// actively mislead ("no animals recorded yet" when the real problem is
// RLS/network/config). Red is reserved for exactly this: something is
// actually wrong (CLAUDE.md §4, §5, §10's "error states" requirement).
export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-status-critical/25 bg-status-critical/10 px-8 py-12 text-center">
      <TriangleAlert className="size-8 text-status-critical" aria-hidden />
      <p className="text-14 font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-13 text-muted-foreground">{description}</p> : null}
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-2 gap-1.5">
          <RefreshCcw className="size-3.5" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
