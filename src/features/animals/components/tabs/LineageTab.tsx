import { useState } from "react";
import { GitBranch } from "lucide-react";

import { EmptyState } from "@/components/patterns/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAnimalLineage } from "../../hooks";
import { LineageCard } from "../LineageCard";
import type { AnimalProfile, LineageNode } from "../../api";

interface LineageTabProps {
  animal: AnimalProfile;
}

function groupByDepth(nodes: LineageNode[]): LineageNode[][] {
  const maxDepth = Math.max(0, ...nodes.map((n) => n.depth));
  const groups: LineageNode[][] = [];
  for (let d = 1; d <= maxDepth; d++) {
    groups.push(nodes.filter((n) => n.depth === d));
  }
  return groups;
}

const GENERATION_LABELS = ["Parents", "Grandparents", "Great-grandparents", "Great-great-grandparents"];
const DESCENDANT_LABELS = ["Offspring", "Grandoffspring", "Great-grandoffspring", "Great-great-grandoffspring"];

// Three generations by default (session-pack.md, Session 4), each an
// "Expand" step further via maxDepth — get_ancestors/get_descendants
// are capped at 20 server-side regardless (0006_animals.sql), so this
// can never run away.
export function LineageTab({ animal }: LineageTabProps) {
  const [maxDepth, setMaxDepth] = useState(3);
  const { data: ancestors, isLoading: ancestorsLoading } = useAnimalLineage(animal.id, "ancestors", maxDepth);
  const { data: descendants, isLoading: descendantsLoading } = useAnimalLineage(animal.id, "descendants", maxDepth);

  const isLoading = ancestorsLoading || descendantsLoading;
  const hasNoLineage = !isLoading && !ancestors?.length && !descendants?.length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (hasNoLineage) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No family tree yet"
        description="Dam, sire, and offspring links appear here as they're recorded on animal records."
      />
    );
  }

  const ancestorGroups = groupByDepth(ancestors ?? []).slice(0, maxDepth);
  const descendantGroups = groupByDepth(descendants ?? []).slice(0, maxDepth);
  const canExpand = maxDepth < 20 && ((ancestorGroups.at(-1)?.length ?? 0) > 0 || (descendantGroups.at(-1)?.length ?? 0) > 0);

  return (
    <div className="flex flex-col items-center gap-6">
      {[...ancestorGroups].reverse().map((group, i) => (
        <div key={`ancestor-${maxDepth - ancestorGroups.length + i}`} className="flex flex-col items-center gap-2">
          <p className="text-12 font-medium text-muted-foreground">
            {GENERATION_LABELS[ancestorGroups.length - 1 - i] ?? `Generation −${ancestorGroups.length - i}`}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {group.map((n) => (
              <LineageCard key={n.id} animal={n} />
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col items-center gap-2">
        <p className="text-12 font-medium text-muted-foreground">{animal.tagNumber}</p>
        <LineageCard
          animal={{
            id: animal.id,
            tagNumber: animal.tagNumber,
            name: animal.name,
            sex: animal.sex,
            photoPath: animal.photoPath,
            speciesName: animal.speciesName,
          }}
          highlighted
        />
      </div>

      {descendantGroups.map((group, i) => (
        <div key={`descendant-${i}`} className="flex flex-col items-center gap-2">
          <p className="text-12 font-medium text-muted-foreground">{DESCENDANT_LABELS[i] ?? `Generation +${i + 1}`}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {group.map((n) => (
              <LineageCard key={n.id} animal={n} />
            ))}
          </div>
        </div>
      ))}

      {canExpand ? (
        <Button variant="outline" size="sm" onClick={() => setMaxDepth((d) => d + 2)}>
          Show more generations
        </Button>
      ) : null}
    </div>
  );
}
