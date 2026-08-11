import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { TimelineEvent } from "../../api";
import { EVENT_TYPE_META } from "./eventTypes";

const MARKER_CLASSES: Record<string, string> = {
  ok: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  warn: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  critical: "border-status-critical/30 bg-status-critical/10 text-status-critical",
  info: "border-status-info/30 bg-status-info/10 text-status-info",
  neutral: "border-status-neutral/30 bg-status-neutral/10 text-status-neutral",
};

// details keys are formatted from snake_case to a plain label —
// generic on purpose, since every event type's details jsonb
// (0023_animal_profile.sql) has different keys and this renders any of
// them without a per-type switch statement to keep in sync.
function formatDetailKey(key: string): string {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function formatDetailValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  // Every current details payload (0023_animal_profile.sql) is flat —
  // string/number/boolean/null — but `details` is typed as
  // Record<string, unknown>, so a stray nested object still falls back
  // to JSON rather than risking "[object Object]".
  return JSON.stringify(value);
}

interface TimelineEntryProps {
  event: TimelineEvent;
}

export function TimelineEntry({ event }: TimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = EVENT_TYPE_META[event.eventType];
  const Icon = meta.icon;
  const detailEntries = Object.entries(event.details).filter(([, v]) => formatDetailValue(v) !== null);

  return (
    <li className="relative flex gap-3 pb-6 pl-1 last:pb-0">
      <div className="absolute top-8 bottom-0 left-[19px] w-px bg-line last:hidden" aria-hidden />
      <div
        className={cn(
          "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border",
          MARKER_CLASSES[meta.colorToken],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pt-1.5">
        <button
          type="button"
          onClick={() => detailEntries.length > 0 && setExpanded((e) => !e)}
          className="flex w-full items-start justify-between gap-2 text-left"
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <span className="font-mono text-12 tabular-nums text-muted-foreground">{formatDate(event.eventDate)}</span>
            <p className="text-14 text-foreground">{event.description}</p>
            {event.actorName ? <p className="text-12 text-muted-foreground">Recorded by {event.actorName}</p> : null}
          </div>
          {detailEntries.length > 0 ? (
            <ChevronDown
              className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          ) : null}
        </button>
        {expanded && detailEntries.length > 0 ? (
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-card border border-line bg-secondary/40 p-3">
            {detailEntries.map(([key, value]) => (
              <div key={key}>
                <dt className="text-12 text-muted-foreground">{formatDetailKey(key)}</dt>
                <dd className="text-13 text-foreground">{formatDetailValue(value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </li>
  );
}
