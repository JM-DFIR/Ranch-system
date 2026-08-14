import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Pencil } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ErrorState } from "@/components/patterns/ErrorState";
import { StatCard } from "@/components/patterns/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRanchCoverUrl, useRanchDetail } from "../hooks";
import { RanchFormDrawer } from "./RanchFormDrawer";
import { SectionsPanel } from "./SectionsPanel";

interface RanchDetailPageProps {
  ranchId: string;
}

function topSpecies(breakdown: Record<string, number>): { name: string; count: number }[] {
  return Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function RanchDetailPage({ ranchId }: RanchDetailPageProps) {
  const { isOwner } = useAuth();
  const { data: ranch, isLoading, isError, error, refetch } = useRanchDetail(ranchId);
  const [editOpen, setEditOpen] = useState(false);

  const { data: coverUrl } = useRanchCoverUrl(ranch?.coverImagePath);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !ranch) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          title="Couldn't load this ranch"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="overflow-hidden rounded-card border border-line">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-secondary/40 text-muted-foreground">
            <MapPin className="size-10" aria-hidden />
          </div>
        )}
      </div>

      <PageHeader
        breadcrumbs={[{ label: "Ranches", to: "/ranches" }, { label: ranch.name }]}
        title={ranch.name}
        description={ranch.location ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={ranch.status === "active" ? "ok" : "neutral"}>{ranch.status === "active" ? "Active" : "Inactive"}</Badge>
            {isOwner ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active animals" value={ranch.stats.activeAnimalCount.toLocaleString()} emphasis="dominant" />
        <StatCard label="Male" value={ranch.stats.maleCount.toLocaleString()} />
        <StatCard label="Female" value={ranch.stats.femaleCount.toLocaleString()} />
        <StatCard
          label="Needs attention"
          value={ranch.stats.attentionCount.toLocaleString()}
          tone={ranch.stats.attentionCount > 0 ? "warn" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {topSpecies(ranch.stats.speciesBreakdown).length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-14 font-medium text-foreground">Livestock by species</h2>
              <ul className="flex flex-col gap-1.5 rounded-card border border-line p-3">
                {topSpecies(ranch.stats.speciesBreakdown).map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-14">
                    <span>{s.name}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{s.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {ranch.description ? (
            <div className="space-y-1.5">
              <h2 className="text-14 font-medium text-foreground">Description</h2>
              <p className="text-14 text-muted-foreground">{ranch.description}</p>
            </div>
          ) : null}

          {ranch.contactName || ranch.contactPhone || ranch.contactEmail ? (
            <div className="space-y-1.5">
              <h2 className="text-14 font-medium text-foreground">Contact</h2>
              <div className="rounded-card border border-line p-3 text-14">
                {ranch.contactName ? <p className="text-foreground">{ranch.contactName}</p> : null}
                {ranch.contactPhone ? <p className="font-mono text-muted-foreground">{ranch.contactPhone}</p> : null}
                {ranch.contactEmail ? <p className="text-muted-foreground">{ranch.contactEmail}</p> : null}
              </div>
            </div>
          ) : null}

          {ranch.sizeAcres ? (
            <div className="space-y-1.5">
              <h2 className="text-14 font-medium text-foreground">Size</h2>
              <p className="font-mono text-14 tabular-nums text-foreground">{ranch.sizeAcres.toLocaleString()} acres</p>
            </div>
          ) : null}

          {ranch.notes ? (
            <div className="space-y-1.5">
              <h2 className="text-14 font-medium text-foreground">Notes</h2>
              <p className="text-14 text-muted-foreground">{ranch.notes}</p>
            </div>
          ) : null}

          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link to="/animals" search={{ ranch: ranch.id }}>
              View animals on this ranch
            </Link>
          </Button>
        </div>

        <SectionsPanel ranchId={ranch.id} />
      </div>

      {isOwner ? <RanchFormDrawer open={editOpen} onOpenChange={setEditOpen} ranch={ranch} /> : null}
    </div>
  );
}
