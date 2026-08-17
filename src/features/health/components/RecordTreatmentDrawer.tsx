import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { CatalogueOrCustomField } from "@/components/patterns/CatalogueOrCustomField";
import { OfflineBlock } from "@/components/patterns/OfflineBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAdministeredByOptions, useIllnesses, useMedicationOptions, useRecordTreatment } from "../hooks";
import { createMedication, undoRecordTreatment, type RecordTreatmentResult } from "../api";
import { treatmentFormSchema, type TreatmentFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordTreatmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

// Record Treatment (session-pack.md, Session 8) — same shape as Record
// Vaccination (docs/patterns/record-drawer.md), online-only (CLAUDE.md
// §8). The illness link only shows for a single selected animal —
// linking one illness record to several different animals' treatments
// isn't a meaningful default, and picking per-animal illnesses inside a
// bulk form would need a form-within-a-form this session doesn't build.
export function RecordTreatmentDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordTreatmentDrawerProps) {
  const { profile } = useAuth();
  const isOnline = useOnlineStatus();
  const isReadOnlySelection = !!preselectedAnimals && preselectedAnimals.length > 0;

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: {
      animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
      illnessId: "",
      medication: { type: "catalogue", id: "" },
      treatmentDate: TODAY(),
      dosage: "",
      route: "",
      durationDays: "",
      administeredBy: { type: "profile", id: profile?.id ?? "" },
      withdrawalUntil: "",
      outcome: "",
      followUpDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
        illnessId: "",
        medication: { type: "catalogue", id: "" },
        treatmentDate: TODAY(),
        dosage: "",
        route: "",
        durationDays: "",
        administeredBy: { type: "profile", id: profile?.id ?? "" },
        withdrawalUntil: "",
        outcome: "",
        followUpDate: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const animalIds = watch("animalIds");
  const singleAnimalId = animalIds.length === 1 ? animalIds[0] : undefined;

  const { data: medicationOptions } = useMedicationOptions(profile?.orgId);
  const { data: administeredByOptions } = useAdministeredByOptions(profile?.orgId);
  const { data: openIllnesses } = useIllnesses(singleAnimalId);
  const mutation = useRecordTreatment();
  const queryClient = useQueryClient();

  const handleCreateMedication = async (name: string) => {
    if (!profile) return;
    try {
      const created = await createMedication(profile.orgId, name);
      setValue("medication", { type: "catalogue", id: created.id }, { shouldDirty: true });
      toast.success(`Added "${name}" to the medication catalogue`);
    } catch (error) {
      toast.error("Couldn't add medication", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleUndo = async (result: RecordTreatmentResult, animalIds: string[]) => {
    try {
      const undone = await undoRecordTreatment(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Treatment undone");
      for (const animalId of animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.treatments(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ result }) => {
        const count = values.animalIds.length;
        const label = count === 1 ? "Treatment recorded" : `Treatment recorded for ${count} animals`;
        toast.success(label, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result, values.animalIds) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record treatment", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  const administeredByValue = watch("administeredBy");
  const administeredByComboValue = administeredByValue ? `${administeredByValue.type}:${administeredByValue.id}` : undefined;

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record treatment"
      description={isReadOnlySelection ? undefined : "Pick the animals, then fill in the treatment details."}
      isDirty={isDirty}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        {!isOnline ? <OfflineBlock /> : null}

        <div className="space-y-1.5">
          <Label>Animals</Label>
          {isReadOnlySelection ? (
            <div className="flex flex-wrap gap-1">
              {preselectedAnimals?.map((a) => (
                <Badge key={a.id} variant="neutral">
                  {a.tagNumber}
                </Badge>
              ))}
            </div>
          ) : (
            <Controller
              control={control}
              name="animalIds"
              render={({ field }) => (
                <MultiCombobox
                  options={searchableAnimals.map((a) => ({ value: a.id, label: a.tagNumber }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search by tag number…"
                  searchPlaceholder="Search animals…"
                />
              )}
            />
          )}
          {errors.animalIds ? <p className="text-13 text-status-critical">{errors.animalIds.message}</p> : null}
        </div>

        {singleAnimalId && openIllnesses && openIllnesses.length > 0 ? (
          <div className="space-y-1.5">
            <Label>Link to an illness (optional)</Label>
            <Controller
              control={control}
              name="illnessId"
              render={({ field }) => (
                <Combobox
                  options={openIllnesses.map((i) => ({ value: i.id, label: `${i.illnessName ?? "Illness"} — onset ${i.onsetDate}` }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Not linked to a specific illness"
                  searchPlaceholder="Search illnesses…"
                />
              )}
            />
          </div>
        ) : null}

        <Controller
          control={control}
          name="medication"
          render={({ field }) => (
            <CatalogueOrCustomField
              label="Medication"
              value={field.value}
              onChange={field.onChange}
              options={(medicationOptions ?? []).map((m) => ({ value: m.id, label: m.name }))}
              onCreateNew={(name) => void handleCreateMedication(name)}
              createNewLabel={(name) => `Add "${name}" as a new medication`}
              placeholder="Choose a medication…"
              searchPlaceholder="Search medications…"
              error={errors.medication?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="treat-date">Treatment date</Label>
            <Input id="treat-date" type="date" max={TODAY()} {...register("treatmentDate")} />
            {errors.treatmentDate ? <p className="text-13 text-status-critical">{errors.treatmentDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="treat-dosage">Dosage</Label>
            <Input id="treat-dosage" {...register("dosage")} placeholder="e.g. 10 ml" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="treat-route">Route</Label>
            <Input id="treat-route" {...register("route")} placeholder="e.g. Intramuscular" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="treat-duration">Duration (days)</Label>
            <Input id="treat-duration" type="number" min="0" {...register("durationDays")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Administered by</Label>
          <Combobox
            options={(administeredByOptions ?? []).map((o) => ({
              value: `${o.type}:${o.id}`,
              label: o.type === "veterinarian" ? `${o.name} (Veterinarian)` : o.name,
            }))}
            value={administeredByComboValue}
            onChange={(v) => {
              if (!v) return;
              const [type, id] = v.split(":");
              if (type === "profile" || type === "veterinarian") setValue("administeredBy", { type, id: id ?? "" }, { shouldDirty: true });
            }}
            placeholder="Choose who administered it…"
            searchPlaceholder="Search staff or veterinarians…"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="treat-withdrawal">Withdrawal until</Label>
            <Input id="treat-withdrawal" type="date" {...register("withdrawalUntil")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="treat-followup">Follow-up date</Label>
            <Input id="treat-followup" type="date" {...register("followUpDate")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="treat-outcome">Outcome</Label>
          <Input id="treat-outcome" {...register("outcome")} placeholder="e.g. Improved" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="treat-notes">Notes</Label>
          <Textarea id="treat-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending || !isOnline}>
            {mutation.isPending ? "Saving…" : "Record treatment"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
