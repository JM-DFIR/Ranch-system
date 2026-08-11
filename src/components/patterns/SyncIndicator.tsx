import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CircleAlert, RefreshCw } from "lucide-react";

import { offlineDb, type QueueEntry } from "@/lib/offline/db";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Hidden at zero pending and zero conflicts. A conflict is never
// collapsed into the same visual state as "waiting" — it needs a
// decision from the user (most often a duplicate tag_number), not just
// patience (CLAUDE.md §8, blueprint.md §2.5). Retrying a pending entry
// and resolving a conflict are both real local Dexie operations here —
// what's deferred to Session 5 is the network sync worker actually
// draining the queue against Supabase, not the queue-management UI
// itself.
export function SyncIndicator() {
  const [open, setOpen] = useState(false);
  const entries = useLiveQuery(() => offlineDb.writeQueue.toArray(), [], [] as QueueEntry[]);

  const pending = (entries ?? []).filter((e) => e.status === "pending" || e.status === "syncing" || e.status === "failed");
  const conflicts = (entries ?? []).filter((e) => e.status === "conflict");

  if (pending.length === 0 && conflicts.length === 0) {
    return null;
  }

  const hasConflicts = conflicts.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5",
            hasConflicts ? "text-status-critical hover:text-status-critical" : "text-status-warn hover:text-status-warn",
          )}
        >
          {hasConflicts ? <CircleAlert className="size-4" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
          {hasConflicts
            ? `${conflicts.length} ${conflicts.length === 1 ? "conflict" : "conflicts"}`
            : `${pending.length} waiting to sync`}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="max-h-96 overflow-y-auto">
          {conflicts.length > 0 ? (
            <div className="border-b border-line p-3">
              <p className="mb-2 text-12 font-medium text-status-critical">Needs your attention</p>
              <div className="space-y-2">
                {conflicts.map((entry) => (
                  <ConflictRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ) : null}
          {pending.length > 0 ? (
            <div className="p-3">
              <p className="mb-2 text-12 font-medium text-muted-foreground">Waiting to sync</p>
              <div className="space-y-2">
                {pending.map((entry) => (
                  <PendingRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PendingRow({ entry }: { entry: QueueEntry }) {
  const retry = () => {
    void offlineDb.writeQueue.update(entry.id, { status: "pending", lastError: undefined });
  };

  return (
    <div className="flex items-center justify-between gap-2 text-13">
      <div className="min-w-0">
        <p className="truncate text-foreground">{operationLabel(entry.operationType)}</p>
        {entry.lastError ? <p className="truncate text-12 text-status-critical">{entry.lastError}</p> : null}
      </div>
      {entry.status === "failed" ? (
        <Button size="sm" variant="outline" onClick={retry}>
          Retry
        </Button>
      ) : (
        <Badge variant="neutral">{entry.status}</Badge>
      )}
    </div>
  );
}

function ConflictRow({ entry }: { entry: QueueEntry }) {
  const currentTag = typeof entry.payload.tagNumber === "string" ? entry.payload.tagNumber : "";
  const [newTag, setNewTag] = useState(currentTag);

  const resolve = () => {
    void offlineDb.writeQueue.update(entry.id, {
      payload: { ...entry.payload, tagNumber: newTag },
      status: "pending",
      lastError: undefined,
    });
  };

  return (
    <div className="space-y-1.5 rounded-card border border-status-critical/25 bg-status-critical/5 p-2 text-13">
      <p className="text-foreground">
        Tag <span className="tabular font-medium">{currentTag}</span> is already in use
      </p>
      <div className="flex items-center gap-1.5">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="tabular h-8 text-13"
          aria-label="New tag number"
        />
        <Button size="sm" onClick={resolve} disabled={!newTag || newTag === currentTag}>
          Save &amp; retry
        </Button>
      </div>
    </div>
  );
}

function operationLabel(type: QueueEntry["operationType"]): string {
  switch (type) {
    case "create_animal":
      return "New animal";
    case "attach_photo":
      return "Photo upload";
    case "create_health_event":
      return "Health record";
    case "create_weight":
      return "Weight record";
    case "create_movement":
      return "Movement";
  }
}
