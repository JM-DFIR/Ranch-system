import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bone, Pill, Sprout, Stethoscope, Syringe, Tag, ThermometerSun, Wheat } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/patterns/PageHeader";
import {
  softDeleteAnimalStatus,
  softDeleteBreed,
  softDeleteCareActivityType,
  softDeleteFeedItem,
  softDeleteIllnessType,
  softDeleteMedication,
  softDeleteSpecies,
  softDeleteVaccine,
} from "../api";
import {
  useAnimalStatusesList,
  useBreedsList,
  useCareActivityTypesList,
  useFeedItemsList,
  useIllnessTypesList,
  useMedicationsList,
  useSpeciesList,
  useVaccinesList,
} from "../hooks";
import { CatalogueListCard } from "./reference/CatalogueListCard";
import { AddAnimalStatusDialog } from "./reference/AddAnimalStatusDialog";
import { AddBreedDialog } from "./reference/AddBreedDialog";
import { AddCareActivityTypeDialog } from "./reference/AddCareActivityTypeDialog";
import { AddFeedItemDialog } from "./reference/AddFeedItemDialog";
import { AddIllnessTypeDialog } from "./reference/AddIllnessTypeDialog";
import { AddMedicationDialog } from "./reference/AddMedicationDialog";
import { AddSpeciesDialog } from "./reference/AddSpeciesDialog";
import { AddVaccineDialog } from "./reference/AddVaccineDialog";

type CatalogueKey = "species" | "breeds" | "statuses" | "vaccines" | "medications" | "illnessTypes" | "feedItems" | "careActivityTypes";

const TABS: { key: CatalogueKey; label: string }[] = [
  { key: "species", label: "Species" },
  { key: "breeds", label: "Breeds" },
  { key: "statuses", label: "Statuses" },
  { key: "vaccines", label: "Vaccines" },
  { key: "medications", label: "Medications" },
  { key: "illnessTypes", label: "Illness types" },
  { key: "feedItems", label: "Feed items" },
  { key: "careActivityTypes", label: "Care activities" },
];

// Admin > Reference Data Manager (blueprint.md §4.1) — eight org-wide
// catalogues in one screen, tabbed rather than routed: this is one
// logical screen with eight facets, not eight destinations worth
// bookmarking separately (unlike Health/Breeding/Feeding's real
// sub-routes, which are registers people link to and filter). Any org
// member can reach and use this screen — see admin.reference-data.tsx's
// route guard, which is the one Admin route that ISN'T owner-only.
export function ReferenceDataPage() {
  const [tab, setTab] = useState<CatalogueKey>("species");
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const species = useSpeciesList(profile?.orgId);
  const breeds = useBreedsList(profile?.orgId);
  const statuses = useAnimalStatusesList(profile?.orgId);
  const vaccines = useVaccinesList(profile?.orgId);
  const medications = useMedicationsList(profile?.orgId);
  const illnessTypes = useIllnessTypesList(profile?.orgId);
  const feedItems = useFeedItemsList(profile?.orgId);
  const careActivityTypes = useCareActivityTypesList(profile?.orgId);

  const invalidate = (key: readonly unknown[]) => void queryClient.invalidateQueries({ queryKey: key });

  const removeSpecies = useMutation({
    mutationFn: softDeleteSpecies,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.species(profile.orgId));
        invalidate(queryKeys.animals.filterOptions(profile.orgId));
      }
      toast.success("Species removed");
    },
    onError: (e) => toast.error("Couldn't remove species", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeBreed = useMutation({
    mutationFn: softDeleteBreed,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.breeds(profile.orgId));
        invalidate(queryKeys.animals.filterOptions(profile.orgId));
      }
      toast.success("Breed removed");
    },
    onError: (e) => toast.error("Couldn't remove breed", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeStatus = useMutation({
    mutationFn: softDeleteAnimalStatus,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.animalStatuses(profile.orgId));
        invalidate(queryKeys.animals.filterOptions(profile.orgId));
      }
      toast.success("Status removed");
    },
    onError: (e) => toast.error("Couldn't remove status", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeVaccine = useMutation({
    mutationFn: softDeleteVaccine,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.vaccines(profile.orgId));
        invalidate(queryKeys.health.vaccineOptions(profile.orgId, undefined));
      }
      toast.success("Vaccine removed");
    },
    onError: (e) => toast.error("Couldn't remove vaccine", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeMedication = useMutation({
    mutationFn: softDeleteMedication,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.medications(profile.orgId));
        invalidate(queryKeys.health.medicationOptions(profile.orgId));
      }
      toast.success("Medication removed");
    },
    onError: (e) => toast.error("Couldn't remove medication", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeIllnessType = useMutation({
    mutationFn: softDeleteIllnessType,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.illnessTypes(profile.orgId));
        invalidate(queryKeys.health.illnessTypeOptions(profile.orgId));
      }
      toast.success("Illness type removed");
    },
    onError: (e) => toast.error("Couldn't remove illness type", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeFeedItem = useMutation({
    mutationFn: softDeleteFeedItem,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.feedItems(profile.orgId));
        invalidate(queryKeys.feeding.feedItemOptions(profile.orgId));
      }
      toast.success("Feed item removed");
    },
    onError: (e) => toast.error("Couldn't remove feed item", { description: e instanceof Error ? e.message : undefined }),
  });

  const removeCareActivityType = useMutation({
    mutationFn: softDeleteCareActivityType,
    onSuccess: () => {
      if (profile) {
        invalidate(queryKeys.admin.careActivityTypes(profile.orgId));
        invalidate(queryKeys.feeding.careActivityTypeOptions(profile.orgId));
      }
      toast.success("Care activity type removed");
    },
    onError: (e) => toast.error("Couldn't remove activity type", { description: e instanceof Error ? e.message : undefined }),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Reference data"
        description="Species, breeds, statuses and the other shared lists every record draws from. Anyone in your organisation can extend these."
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Reference data catalogues">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-13 font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === t.key && "border-primary text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "species" ? (
        <CatalogueListCard
          rows={species.data}
          isLoading={species.isLoading}
          isError={species.isError}
          error={species.error}
          onRetry={() => void species.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => [r.defaultTagPrefix, r.defaultGestationDays ? `${r.defaultGestationDays}d gestation` : null].filter(Boolean).join(" · ") || "—"}
          canRemove={(r) => !r.isSystem}
          onRemove={(r) => removeSpecies.mutate(r.id)}
          isRemoving={removeSpecies.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add species"
          icon={Sprout}
          emptyTitle="No species yet"
          emptyDescription="Add the species you keep — goats, cattle, or anything else — with a tag prefix if you want the next-tag suggestion to work from day one."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Existing animals keep their species. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "breeds" ? (
        <CatalogueListCard
          rows={breeds.data}
          isLoading={breeds.isLoading}
          isError={breeds.isError}
          error={breeds.error}
          onRetry={() => void breeds.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => r.speciesName}
          onRemove={(r) => removeBreed.mutate(r.id)}
          isRemoving={removeBreed.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add breed"
          icon={Tag}
          emptyTitle="No breeds yet"
          emptyDescription="Add breeds under each species so they're one tap away when enrolling an animal."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Existing animals keep their breed. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "statuses" ? (
        <CatalogueListCard
          rows={statuses.data}
          isLoading={statuses.isLoading}
          isError={statuses.isError}
          error={statuses.error}
          onRetry={() => void statuses.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => (r.isActiveStatus ? "Active headcount" : "Not counted as active")}
          canRemove={(r) => !r.isSystem}
          onRemove={(r) => removeStatus.mutate(r.id)}
          isRemoving={removeStatus.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add status"
          icon={Bone}
          emptyTitle="No statuses yet"
          emptyDescription="Statuses like Active, Sold or Deceased drive the herd count. Add one to get started."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Existing animals keep this status. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "vaccines" ? (
        <CatalogueListCard
          rows={vaccines.data}
          isLoading={vaccines.isLoading}
          isError={vaccines.isError}
          error={vaccines.error}
          onRetry={() => void vaccines.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => [r.speciesName, r.targetDisease, r.defaultIntervalDays ? `every ${r.defaultIntervalDays}d` : null].filter(Boolean).join(" · ") || "—"}
          onRemove={(r) => removeVaccine.mutate(r.id)}
          isRemoving={removeVaccine.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add vaccine"
          icon={Syringe}
          emptyTitle="No vaccines yet"
          emptyDescription="Add the vaccines you use so they're ready to pick when you record one."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Past vaccination records are unaffected. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "medications" ? (
        <CatalogueListCard
          rows={medications.data}
          isLoading={medications.isLoading}
          isError={medications.isError}
          error={medications.error}
          onRetry={() => void medications.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => [r.activeIngredient, r.defaultWithdrawalDays ? `${r.defaultWithdrawalDays}d withdrawal` : null].filter(Boolean).join(" · ") || "—"}
          onRemove={(r) => removeMedication.mutate(r.id)}
          isRemoving={removeMedication.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add medication"
          icon={Pill}
          emptyTitle="No medications yet"
          emptyDescription="Add the medications you use so they're ready to pick when you record a treatment."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Past treatment records are unaffected. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "illnessTypes" ? (
        <CatalogueListCard
          rows={illnessTypes.data}
          isLoading={illnessTypes.isLoading}
          isError={illnessTypes.isError}
          error={illnessTypes.error}
          onRetry={() => void illnessTypes.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => r.speciesName ?? "All species"}
          onRemove={(r) => removeIllnessType.mutate(r.id)}
          isRemoving={removeIllnessType.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add illness type"
          icon={ThermometerSun}
          emptyTitle="No illness types yet"
          emptyDescription="Add the illnesses you commonly see so they're ready to pick when you log one."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Past illness records are unaffected. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "feedItems" ? (
        <CatalogueListCard
          rows={feedItems.data}
          isLoading={feedItems.isLoading}
          isError={feedItems.isError}
          error={feedItems.error}
          onRetry={() => void feedItems.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          renderDetail={(r) => r.unit}
          onRemove={(r) => removeFeedItem.mutate(r.id)}
          isRemoving={removeFeedItem.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add feed item"
          icon={Wheat}
          emptyTitle="No feed items yet"
          emptyDescription="Add what you feed — hay, dairy meal, silage — so it's ready to pick when you log feeding."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Past feeding records are unaffected. It just won't be offered for new ones."
        />
      ) : null}

      {tab === "careActivityTypes" ? (
        <CatalogueListCard
          rows={careActivityTypes.data}
          isLoading={careActivityTypes.isLoading}
          isError={careActivityTypes.isError}
          error={careActivityTypes.error}
          onRetry={() => void careActivityTypes.refetch()}
          getId={(r) => r.id}
          getName={(r) => r.name}
          onRemove={(r) => removeCareActivityType.mutate(r.id)}
          isRemoving={removeCareActivityType.isPending}
          onAdd={() => setAddOpen(true)}
          addLabel="Add activity type"
          icon={Stethoscope}
          emptyTitle="No care activity types yet"
          emptyDescription="Add activities like dipping or hoof trimming so they're ready to pick when you log one."
          removeConfirmTitle={(r) => `Remove ${r.name}?`}
          removeConfirmDescription="Past care activity records are unaffected. It just won't be offered for new ones."
        />
      ) : null}

      <AddSpeciesDialog open={addOpen && tab === "species"} onOpenChange={setAddOpen} />
      <AddBreedDialog open={addOpen && tab === "breeds"} onOpenChange={setAddOpen} />
      <AddAnimalStatusDialog open={addOpen && tab === "statuses"} onOpenChange={setAddOpen} />
      <AddVaccineDialog open={addOpen && tab === "vaccines"} onOpenChange={setAddOpen} />
      <AddMedicationDialog open={addOpen && tab === "medications"} onOpenChange={setAddOpen} />
      <AddIllnessTypeDialog open={addOpen && tab === "illnessTypes"} onOpenChange={setAddOpen} />
      <AddFeedItemDialog open={addOpen && tab === "feedItems"} onOpenChange={setAddOpen} />
      <AddCareActivityTypeDialog open={addOpen && tab === "careActivityTypes"} onOpenChange={setAddOpen} />
    </div>
  );
}
