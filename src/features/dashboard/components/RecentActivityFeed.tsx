import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_TYPE_META, MARKER_CLASSES } from "@/features/animals/components/timeline/eventTypes";
import type { TimelineEventType } from "@/features/animals/api";
import type { ActivityItem } from "../api";

interface RecentActivityFeedProps {
  activity: ActivityItem[] | undefined;
  isLoading: boolean;
  ranch: string | undefined;
}

// "Recent activity — unified feed from v_recent_activity, ten items,
// each linking to its animal" (session-pack.md, Session 7). Reuses the
// Animal Timeline's own event markers (eventTypes.ts) — the same
// vocabulary in miniature, not a second one invented for this feed.
export function RecentActivityFeed({ activity, isLoading, ranch }: RecentActivityFeedProps) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const items = activity ?? [];

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <h2 className="mb-3 text-14 font-medium text-foreground">Recent activity</h2>
      {items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing recorded yet"
          description="Every vaccination, weight, movement and more will show up here as it's recorded."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => {
            const meta = EVENT_TYPE_META[item.eventType as TimelineEventType];
            const Icon = meta?.icon ?? History;
            const markerClass = MARKER_CLASSES[meta?.colorToken ?? "neutral"];
            const content = (
              <>
                <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border", markerClass)}>
                  <Icon className="size-3.5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-13 text-foreground">{item.description}</p>
                  <p className="font-mono text-12 tabular-nums text-muted-foreground">
                    {formatDate(item.eventDate)}
                    {item.actorName ? ` · ${item.actorName}` : ""}
                  </p>
                </div>
              </>
            );
            return (
              <li key={`${item.eventType}-${item.occurredAt}-${index}`} className="flex items-start gap-2.5">
                {item.animalId ? (
                  <Link to="/animals/$animalId" params={{ animalId: item.animalId }} search={{ ranch }} className="flex flex-1 items-start gap-2.5 hover:underline">
                    {content}
                  </Link>
                ) : (
                  <div className="flex flex-1 items-start gap-2.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
