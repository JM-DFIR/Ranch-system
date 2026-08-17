import { Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEnrollmentProgress } from "../useEnrollmentProgress";

export interface SessionEnrollment {
  tagNumber: string;
  previewUrl: string | null;
}

interface SessionSummaryProps {
  enrollments: SessionEnrollment[];
  onContinue: () => void;
  ranchId: string;
}

// Shown when the exit control is used (session-pack.md, Session 5b) —
// "Exit control returns to the app WITH a session summary," not a
// straight navigation away, so the visible "Back to app" link here is
// the one moment this screen actually leaves Enrollment Mode. It carries
// the ranch just enrolled against back into the app, rather than
// dropping to "all ranches" — you were just standing on this ranch.
export function SessionSummary({ enrollments, onContinue, ranchId }: SessionSummaryProps) {
  const { waitingToSync } = useEnrollmentProgress();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 p-4 pt-12 text-center">
      <div>
        <p className="font-display text-34 font-semibold text-foreground">{enrollments.length}</p>
        <p className="text-14 text-muted-foreground">
          {enrollments.length === 1 ? "animal enrolled this session" : "animals enrolled this session"}
        </p>
      </div>

      {enrollments.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {enrollments.map((e, i) => (
            <div key={`${e.tagNumber}-${i}`} className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-card border border-line bg-muted text-muted-foreground">
                {e.previewUrl ? (
                  <img src={e.previewUrl} alt={e.tagNumber} className="size-full object-cover" />
                ) : (
                  <PawPrint className="size-5" aria-hidden />
                )}
              </div>
              <span className="truncate font-mono text-11 tabular-nums text-muted-foreground">{e.tagNumber}</span>
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-13 text-muted-foreground">
        {waitingToSync === 0
          ? "Everything is synced."
          : `${waitingToSync} ${waitingToSync === 1 ? "record is" : "records are"} still waiting to sync.`}
      </p>

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={onContinue}>
          Continue enrolling
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/animals" search={{ ranch: ranchId }}>
            Back to app
          </Link>
        </Button>
      </div>
    </div>
  );
}
