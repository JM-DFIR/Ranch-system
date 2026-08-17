import { useState } from "react";
import { Camera, MoreVertical, PawPrint } from "lucide-react";

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
import { RecordVaccinationDrawer } from "@/features/health/components/RecordVaccinationDrawer";
import { RecordTreatmentDrawer } from "@/features/health/components/RecordTreatmentDrawer";
import { RecordIllnessDrawer } from "@/features/health/components/RecordIllnessDrawer";
import { RecordVetVisitDrawer } from "@/features/health/components/RecordVetVisitDrawer";
import { RecordWeightDrawer } from "@/features/weights/components/RecordWeightDrawer";
import { RecordTransferDrawer } from "@/features/movements/components/RecordTransferDrawer";
import { RecordBreedingDrawer } from "@/features/breeding/components/RecordBreedingDrawer";
import { RecordBirthDrawer } from "@/features/breeding/components/RecordBirthDrawer";
import { ChangeStatusDialog } from "./ChangeStatusDialog";
import { RecordDeathDialog } from "./RecordDeathDialog";
import { EditAnimalDrawer } from "./EditAnimalDrawer";
import { ChangeAnimalPhotoDialog } from "./ChangeAnimalPhotoDialog";
import { useAnimalPhotoUrl } from "../hooks";
import type { AnimalProfile } from "../api";

const SEX_GLYPH: Record<string, string> = { male: "♂", female: "♀", unknown: "—" };

interface ProfileHeaderProps {
  animal: AnimalProfile;
}

// Record vaccination, weight, treatment, illness, vet visit, transfer,
// breeding, birth and edit are all real now (Sessions 6, 8, M4, and the
// edit form). Change status and Record death were already real from
// Session 4. Breeding/birth only show for a female animal —
// breeding_events.dam_id and births.dam_id are both females-only by the
// schema's own design (BreedingTab.tsx draws the same line for the read
// side).
export function ProfileHeader({ animal }: ProfileHeaderProps) {
  const { data: photoUrl } = useAnimalPhotoUrl(animal.photoPath);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [recordDeathOpen, setRecordDeathOpen] = useState(false);
  const [recordVaccinationOpen, setRecordVaccinationOpen] = useState(false);
  const [recordWeightOpen, setRecordWeightOpen] = useState(false);
  const [recordTreatmentOpen, setRecordTreatmentOpen] = useState(false);
  const [recordIllnessOpen, setRecordIllnessOpen] = useState(false);
  const [recordVetVisitOpen, setRecordVetVisitOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [recordBreedingOpen, setRecordBreedingOpen] = useState(false);
  const [recordBirthOpen, setRecordBirthOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => setPhotoOpen(true)}
          className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-card bg-muted text-muted-foreground"
          aria-label={photoUrl ? "Change photo" : "Add a photo"}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <PawPrint className="size-8" aria-hidden />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 focus-visible:bg-black/40 focus-visible:opacity-100">
            <Camera className="size-6 text-white" aria-hidden />
          </span>
        </button>

        <div className="min-w-0 w-full space-y-1.5 sm:w-auto sm:flex-1">
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

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          <Button size="sm" onClick={() => setRecordVaccinationOpen(true)}>
            Record vaccination
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRecordWeightOpen(true)}>
            Record weight
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)}>
            Transfer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="outline" aria-label="More actions">
                <MoreVertical className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRecordTreatmentOpen(true)}>Record treatment</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRecordIllnessOpen(true)}>Record illness</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRecordVetVisitOpen(true)}>Record vet visit</DropdownMenuItem>
              {animal.sex === "female" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setRecordBreedingOpen(true)}>Record breeding</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRecordBirthOpen(true)}>Record birth</DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
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
      <EditAnimalDrawer open={editOpen} onOpenChange={setEditOpen} animal={animal} />
      <ChangeAnimalPhotoDialog open={photoOpen} onOpenChange={setPhotoOpen} animal={animal} />
      <RecordTreatmentDrawer
        open={recordTreatmentOpen}
        onOpenChange={setRecordTreatmentOpen}
        preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber }]}
      />
      <RecordIllnessDrawer
        open={recordIllnessOpen}
        onOpenChange={setRecordIllnessOpen}
        preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber }]}
      />
      <RecordVetVisitDrawer
        open={recordVetVisitOpen}
        onOpenChange={setRecordVetVisitOpen}
        preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber }]}
      />
      <RecordWeightDrawer
        open={recordWeightOpen}
        onOpenChange={setRecordWeightOpen}
        preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber }]}
      />
      <RecordVaccinationDrawer
        open={recordVaccinationOpen}
        onOpenChange={setRecordVaccinationOpen}
        preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber, speciesId: animal.speciesId }]}
      />
      <RecordTransferDrawer
        open={transferOpen}
        onOpenChange={setTransferOpen}
        preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber }]}
      />
      {animal.sex === "female" ? (
        <>
          <RecordBreedingDrawer
            open={recordBreedingOpen}
            onOpenChange={setRecordBreedingOpen}
            preselectedAnimals={[{ id: animal.id, tagNumber: animal.tagNumber }]}
          />
          <RecordBirthDrawer open={recordBirthOpen} onOpenChange={setRecordBirthOpen} dam={{ id: animal.id, tagNumber: animal.tagNumber }} />
        </>
      ) : null}
    </div>
  );
}
