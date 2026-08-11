import { useState } from "react";
import { History } from "lucide-react";

import { formatMonthHeading } from "@/lib/format";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnimalTimeline } from "../../hooks";
import type { TimelineEvent, TimelineEventType } from "../../api";
import { EVENT_TYPE_META, EVENT_TYPE_ORDER } from "../timeline/eventTypes";
import { TimelineEntry } from "../timeline/TimelineEntry";

interface TimelineTabProps {
  animalId: string;
}

const ALL = "__all__";

function groupByMonth(events: TimelineEvent[]): { monthKey: string; monthLabel: string; events: TimelineEvent[] }[] {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const monthKey = event.eventDate.slice(0, 7);
    const group = groups.get(monthKey);
    if (group) group.push(event);
    else groups.set(monthKey, [event]);
  }
  return Array.from(groups.entries()).map(([monthKey, monthEvents]) => ({
    monthKey,
    monthLabel: formatMonthHeading(monthEvents[0]?.eventDate ?? monthKey),
    events: monthEvents,
  }));
}

// The signature element (session-pack.md, Session 4 / blueprint.md §5.1):
// a single vertical spine, reverse chronological, every event type its
// own marker + colour (eventTypes.ts), sticky month headers, filterable,
// each entry expands in place. This is the one screen in the product
// the design is allowed to be memorable on — everything else stays
// quiet by comparison (CLAUDE.md §4).
export function TimelineTab({ animalId }: TimelineTabProps) {
  const [eventType, setEventType] = useState<TimelineEventType | undefined>(undefined);
  const { data: events, isLoading } = useAnimalTimeline(animalId, eventType);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const months = groupByMonth(events ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Select value={eventType ?? ALL} onValueChange={(v) => setEventType(v === ALL ? undefined : (v as TimelineEventType))}>
          <SelectTrigger size="sm" className="w-48" aria-label="Filter by event type">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All events</SelectItem>
            {EVENT_TYPE_ORDER.map((type) => (
              <SelectItem key={type} value={type}>
                {EVENT_TYPE_META[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {months.length === 0 ? (
        <EmptyState
          icon={History}
          title={eventType ? "No events of this type yet" : "No history yet"}
          description={
            eventType
              ? "Try a different event type, or clear the filter to see everything."
              : "Every vaccination, weight, movement and more will build this animal's life story here."
          }
        />
      ) : (
        months.map((group) => (
          <div key={group.monthKey}>
            <div className="sticky top-0 z-20 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm">
              <h2 className="text-13 font-medium text-foreground">{group.monthLabel}</h2>
            </div>
            <ul>
              {group.events.map((event) => (
                <TimelineEntry key={`${event.eventType}-${event.sourceId}`} event={event} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
