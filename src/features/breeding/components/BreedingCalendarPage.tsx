import { Link } from "@tanstack/react-router";
import { Baby, CalendarClock } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { useBreedingCalendar } from "../hooks";
import type { BreedingCalendarItem } from "../api";

const KIND_META: Record<BreedingCalendarItem["kind"], { label: string; icon: typeof Baby; variant: "info" | "warn" }> = {
  calving_due: { label: "Calving/kidding due", icon: Baby, variant: "info" },
  pregnancy_check_due: { label: "Pregnancy check due", icon: CalendarClock, variant: "warn" },
};

// Breeding Calendar (M4 — session-pack.md Part 5): calving/kidding due
// within 60 days, and pregnancy checks due (served 45+ days, no check
// yet) — the same two conditions v_animals_requiring_attention's own
// pregnancy_check_due/calving_imminent reasons use, kept in sync
// deliberately (fetchBreedingCalendar, api.ts). Not capped like the
// dashboard's own "Upcoming" widget — this is the dedicated screen.
export function BreedingCalendarPage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const { data: items, isLoading, isError, error, refetch } = useBreedingCalendar(profile?.orgId, ranch);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Breeding calendar" description="Calving and pregnancy checks coming up." />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load the breeding calendar"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing coming up"
          description="Calving due dates and pregnancy checks appear here as breeding events are recorded."
        />
      ) : (
        <div className="divide-y divide-line rounded-card border border-line bg-card">
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            return (
              <Link
                key={`${item.kind}-${item.breedingEventId}`}
                to="/animals/$animalId"
                params={{ animalId: item.damId }}
                search={{ ranch }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-13 font-medium tabular-nums text-foreground">{item.damTagNumber}</span>
                  <p className="text-13 text-muted-foreground">{meta.label}</p>
                </div>
                <Badge variant={meta.variant}>{formatDate(item.dueDate)}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
