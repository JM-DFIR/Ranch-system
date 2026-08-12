import { Link } from "@tanstack/react-router";
import { PawPrint, TriangleAlert } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { useAttentionQueue } from "../hooks";
import { ATTENTION_REASON_META } from "../reasonMeta";
import type { AttentionQueueItem } from "../api";

const SEVERITY_SECTIONS: { severity: AttentionQueueItem["severity"]; title: string; variant: "critical" | "warn" | "info" }[] = [
  { severity: "high", title: "High priority", variant: "critical" },
  { severity: "medium", title: "Medium priority", variant: "warn" },
  { severity: "info", title: "Worth a look", variant: "info" },
];

// The Attention Queue (session-pack.md, Session 8 — "M3 remainder"),
// built against v_animals_requiring_attention rather than the register/
// dashboard's summary view — this screen's whole job is showing every
// specific reason, not a collapsed count (blueprint.md §0.5 #5).
// Grouped by severity since that's the order an owner would actually
// work through it, not a flat sortable table.
export function AttentionQueuePage() {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const { data: items, isLoading, isError, error, refetch } = useAttentionQueue(profile?.orgId, ranch);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Attention queue"
        description={items && items.length > 0 ? `${items.length} ${items.length === 1 ? "item needs" : "items need"} a look` : undefined}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load the attention queue"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Nothing needs attention right now"
          description="Overdue vaccinations, unresolved illnesses, pending follow-ups and more will show up here the moment they need a look."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {SEVERITY_SECTIONS.map((section) => {
            const sectionItems = items.filter((i) => i.severity === section.severity);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section.severity} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={section.variant} className="gap-1">
                    <TriangleAlert aria-hidden />
                    {section.title}
                  </Badge>
                  <span className="text-13 text-muted-foreground">{sectionItems.length}</span>
                </div>
                <div className="divide-y divide-line rounded-card border border-line bg-card">
                  {sectionItems.map((item) => (
                    <AttentionRow key={`${item.animalId}-${item.reason}`} item={item} ranch={ranch} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AttentionRow({ item, ranch }: { item: AttentionQueueItem; ranch: string | undefined }) {
  const meta = ATTENTION_REASON_META[item.reason];
  const Icon = meta.icon;

  return (
    <Link
      to="/animals/$animalId"
      params={{ animalId: item.animalId }}
      search={{ ranch }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-13 font-medium tabular-nums text-foreground">{item.tagNumber}</span>
          {item.animalName ? <span className="text-13 text-muted-foreground">{item.animalName}</span> : null}
        </div>
        <p className="text-13 text-muted-foreground">
          {meta.label}
          {item.speciesName ? ` · ${item.speciesName}` : ""}
        </p>
      </div>
      {item.dueDate ? <span className="font-mono text-12 tabular-nums text-muted-foreground">{formatDate(item.dueDate)}</span> : null}
    </Link>
  );
}
