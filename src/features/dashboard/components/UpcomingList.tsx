import { Link } from "@tanstack/react-router";
import { CalendarClock, Stethoscope, Syringe } from "lucide-react";

import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { UpcomingResult } from "../api";

interface UpcomingListProps {
  upcoming: UpcomingResult | undefined;
  isLoading: boolean;
  ranch: string | undefined;
}

// "Upcoming — merged, date-sorted list... capped at eight with 'view
// all'" (session-pack.md, Session 7). "View all" renders disabled: the
// natural destination (a Health Hub / Upcoming screen) isn't built
// yet, same "coming in a later session" convention EmptyState already
// uses rather than a link to nowhere.
export function UpcomingList({ upcoming, isLoading, ranch }: UpcomingListProps) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const items = upcoming?.items ?? [];

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-14 font-medium text-foreground">Upcoming</h2>
        {upcoming?.hasMore ? (
          <button type="button" disabled title="Coming in a later session" className="text-12 text-muted-foreground/50">
            View all
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing due in the next 30 days"
          description="Vaccinations coming due and vet follow-ups will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-card bg-status-info/10 text-status-info">
                {item.kind === "vaccination" ? <Syringe className="size-3.5" aria-hidden /> : <Stethoscope className="size-3.5" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                {item.kind === "vaccination" ? (
                  <Link to="/animals/$animalId" params={{ animalId: item.animalId }} search={{ ranch }} className="block hover:underline">
                    <span className="font-mono text-13 tabular-nums text-foreground">{item.tagNumber}</span>{" "}
                    <span className="text-13 text-muted-foreground">— {item.vaccineName} due</span>
                  </Link>
                ) : (
                  <p className="text-13 text-foreground">
                    Vet follow-up{item.purpose ? ` — ${item.purpose}` : ""}
                    {item.veterinarianName ? ` (${item.veterinarianName})` : ""}
                  </p>
                )}
                <p className="font-mono text-12 tabular-nums text-muted-foreground">{formatDate(item.dueDate)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
