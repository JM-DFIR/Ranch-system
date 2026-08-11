import { Skeleton } from "@/components/ui/skeleton";

interface SexSplitBarProps {
  maleCount: number | undefined;
  femaleCount: number | undefined;
  isLoading: boolean;
}

// "Male / female split — single stacked bar with counts" (session-pack.md,
// Session 7). Two segments only, so a hand-built proportional bar reads
// more plainly than reaching for recharts for something this small.
// Two acacia tones rather than a status colour — sex isn't a functional
// signal (CLAUDE.md §4: status colours are functional only).
export function SexSplitBar({ maleCount, femaleCount, isLoading }: SexSplitBarProps) {
  if (isLoading) return <Skeleton className="h-24 w-full" />;

  const male = maleCount ?? 0;
  const female = femaleCount ?? 0;
  const total = male + female;
  const malePct = total > 0 ? (male / total) * 100 : 0;
  const femalePct = total > 0 ? (female / total) * 100 : 0;

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <h2 className="mb-3 text-14 font-medium text-foreground">Male / female split</h2>
      {total === 0 ? (
        <p className="text-13 text-muted-foreground">No animals recorded yet.</p>
      ) : (
        <>
          <div className="flex h-4 w-full overflow-hidden rounded-badge bg-secondary">
            {male > 0 ? <div style={{ width: `${malePct}%` }} className="h-full bg-acacia-600" /> : null}
            {female > 0 ? <div style={{ width: `${femalePct}%` }} className="h-full bg-acacia-300" /> : null}
          </div>
          <div className="mt-2 flex items-center gap-4 text-13">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="size-2.5 rounded-full bg-acacia-600" aria-hidden />
              Male <span className="font-mono tabular-nums text-muted-foreground">{male.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="size-2.5 rounded-full bg-acacia-300" aria-hidden />
              Female <span className="font-mono tabular-nums text-muted-foreground">{female.toLocaleString()}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
