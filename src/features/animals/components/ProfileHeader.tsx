import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MoreVertical, PawPrint } from "lucide-react";

import { formatAge } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { AttentionBadge } from "@/components/patterns/AttentionBadge";
import { ChangeStatusDialog } from "./ChangeStatusDialog";
import { RecordDeathDialog } from "./RecordDeathDialog";
import type { AnimalProfile } from "../api";

const SEX_GLYPH: Record<string, string> = { male: "♂", female: "♀", unknown: "—" };

interface ProfileHeaderProps {
  animal: AnimalProfile;
}

// Primary actions (Record health event/weight, Transfer, Edit) render
// disabled — each needs either the RecordDrawer pattern Session 6
// establishes or a full edit form, neither of which exists yet. Change
// status and Record death are real: both are small enough (a direct
// field update; a short RPC call) not to need that pattern, and the
// spec explicitly calls for them behind a naming confirm dialog now.
export function ProfileHeader({ animal }: ProfileHeaderProps) {
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [recordDeathOpen, setRecordDeathOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-4">
      <Link to="/animals" className="flex w-fit items-center gap-1 text-13 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to register
      </Link>
      <div className="flex flex-wrap items-start gap-4">
        {/* photo_path resolution (upload/replace) is Session 5's camera +
            compression pipeline, same deferral as the register's thumbnail
            column (columns.tsx) — glyph fallback until that lands. */}
        <div className="flex size-20 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground">
          <PawPrint className="size-8" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-mono text-26 font-medium tabular-nums text-foreground">{animal.tagNumber}</h1>
            {animal.name ? <span className="text-20 text-muted-foreground">{animal.name}</span> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-13 text-muted-foreground">
            <span>{[animal.speciesName, animal.breedName].filter(Boolean).join(" · ") || "Species not set"}</span>
            <span aria-label={`Sex: ${animal.sex}`} className="font-mono text-14">
              {SEX_GLYPH[animal.sex] ?? "—"}
            </span>
            <span>{formatAge(animal.dateOfBirth, animal.dobIsEstimated)}</span>
            <span>
              {animal.ranchName}
              {animal.sectionName ? ` · ${animal.sectionName}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge name={animal.statusName} colorToken={animal.statusColorToken} />
            {animal.attentionSeverity ? (
              <AttentionBadge severity={animal.attentionSeverity} reasonCount={animal.attentionReasonCount} />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button size="sm" disabled title="Coming in a later session">
            Record health event
          </Button>
          <Button size="sm" variant="outline" disabled title="Coming in a later session">
            Record weight
          </Button>
          <Button size="sm" variant="outline" disabled title="Coming in a later session">
            Transfer
          </Button>
          <Button size="sm" variant="outline" disabled title="Coming in a later session">
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="outline" aria-label="More actions">
                <MoreVertical className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setChangeStatusOpen(true)}>Change status</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setRecordDeathOpen(true)}>
                Record death
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ChangeStatusDialog open={changeStatusOpen} onOpenChange={setChangeStatusOpen} animal={animal} />
      <RecordDeathDialog open={recordDeathOpen} onOpenChange={setRecordDeathOpen} animal={animal} />
    </div>
  );
}
