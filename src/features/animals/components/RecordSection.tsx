import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RecordSectionProps {
  title: string;
  /** Undefined = no record action for this section (e.g. read-only history). */
  recordActionLabel?: string;
  /** Undefined = the drawer this action needs doesn't exist yet — renders disabled, not hidden. */
  onRecordAction?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

// The shared shell for every profile tab's "sub-sections, each a
// compact table with a record action" (session-pack.md, Session 4:
// Health, Breeding, Movements, Feeding & Care all use this). The
// record button renders disabled wherever its drawer doesn't exist yet
// (Breeding/Movements/Feeding & Care, still M4/M5) and real wherever it
// does (Health's four sections + Weights, wired in Session 8) — same
// optional-callback convention as EmptyState's action buttons.
export function RecordSection({ title, recordActionLabel, onRecordAction, isLoading, isEmpty, emptyMessage, children }: RecordSectionProps) {
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-14 font-medium text-foreground">{title}</h2>
        {recordActionLabel ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!onRecordAction}
            title={onRecordAction ? undefined : "Coming in a later session"}
            onClick={onRecordAction}
          >
            {recordActionLabel}
          </Button>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : isEmpty ? (
        <p className="text-13 text-muted-foreground">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}
