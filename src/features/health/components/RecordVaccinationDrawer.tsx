import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAdministeredByOptions, useRecordVaccination, useVaccineOptions } from "../hooks";
import { createVaccine, undoRecordVaccination, type RecordVaccinationResult } from "../api";
import { vaccinationFormSchema, type VaccinationFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
  speciesId: string | null;
}

export interface AnimalSearchOption {
  id: string;
  tagNumber: string;
  speciesId: string | null;
}

interface RecordVaccinationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set from a profile or the register's bulk selection — read-only when present. */
  preselectedAnimals?: PreselectedAnimal[];
  /** Only needed for the free-pick case (no preselection) — the dashboard quick-action entry point. */
  searchableAnimals?: AnimalSearchOption[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatPlainDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
}

// The canonical "record X" drawer (session-pack.md, Session 6) — every
// other record flow (treatment, weight, movement, ...) copies this
// exact shape. Documented in docs/patterns/record-drawer.md.
export function RecordVaccinationDrawer({
  open,
  onOpenChange,
  preselectedAnimals,
  searchableAnimals = [],
}: RecordVaccinationDrawerProps) {
  const { profile } = useAuth();
  const isReadOnlySelection = !!preselectedAnimals && preselectedAnimals.length > 0;

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: {
      animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
      vaccineId: "",
      dateAdministered: TODAY(),
      dose: "",
      batchNumber: "",
      route: "",
      administeredBy: { type: "profile", id: profile?.id ?? "" },
      nextDueDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
        vaccineId: "",
        dateAdministered: TODAY(),
        dose: "",
        batchNumber: "",
        route: "",
        administeredBy: { type: "profile", id: profile?.id ?? "" },
        nextDueDate: "",
        notes: "",
      });
    }
    // Deliberately keyed on `open` alone — this re-initializes the form
    // for each new opening, not on every change to who's preselected or
    // signed in while it's already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const animalIds = watch("animalIds");
  const vaccineId = watch("vaccineId");
  const dateAdministered = watch("dateAdministered");
  const [nextDueTouched, setNextDueTouched] = useState(false);

  // Filtered by the selected animals' species where the vaccine has one
  // set (session-pack.md) — only meaningful when every selected animal
  // shares one species; mixed-species bulk selections just see the
  // full catalogue rather than an arbitrary single species' filter.
  const allAnimals = [...(preselectedAnimals ?? []), ...searchableAnimals];
  const selectedAnimalRecords = allAnimals.filter((a) => animalIds.includes(a.id));
  const speciesIds = new Set(selectedAnimalRecords.map((a) => a.speciesId).filter((id): id is string => !!id));
  const singleSpeciesId: string | undefined = speciesIds.size === 1 ? [...speciesIds][0] : undefined;

  const { data: vaccineOptions } = useVaccineOptions(profile?.orgId, singleSpeciesId);
  const { data: administeredByOptions } = useAdministeredByOptions(profile?.orgId);
  const mutation = useRecordVaccination();

  const selectedVaccine = vaccineOptions?.find((v) => v.id === vaccineId);

  // Auto-calculated, editable, shown in plain words (session-pack.md) —
  // only overwrites the field while the user hasn't touched it
  // themselves, same "suggestion, never a constraint" rule Enrollment
  // Mode's tag suggestion follows.
  useEffect(() => {
    if (nextDueTouched || !selectedVaccine?.defaultIntervalDays || !dateAdministered) return;
    setValue("nextDueDate", addDays(dateAdministered, selectedVaccine.defaultIntervalDays), { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccineId, dateAdministered]);

  const nextDueDate = watch("nextDueDate");

  const handleCreateVaccine = async (name: string) => {
    if (!profile) return;
    try {
      const created = await createVaccine(profile.orgId, name, singleSpeciesId);
      setValue("vaccineId", created.id, { shouldDirty: true });
      toast.success(`Added "${name}" to the vaccine catalogue`);
    } catch (error) {
      toast.error("Couldn't add vaccine", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const queryClient = useQueryClient();

  const handleUndo = async (result: RecordVaccinationResult, animalIds: string[]) => {
    try {
      const undone = await undoRecordVaccination(result);
      if (!undone) {
        toast.info("Too late to undo — this already finished syncing.");
        return;
      }
      toast.success("Vaccination undone");
      for (const animalId of animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.vaccinations(animalId) });
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
        const label = count === 1 ? "Vaccination recorded" : `Vaccination recorded for ${count} animals`;
        toast.success(label, {
          duration: 8000,
          action: {
            label: "Undo",
            onClick: () => void handleUndo(result, values.animalIds),
          },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record vaccination", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  const administeredByValue = watch("administeredBy");
  const administeredByComboValue = administeredByValue ? `${administeredByValue.type}:${administeredByValue.id}` : undefined;

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record vaccination"
      description={isReadOnlySelection ? undefined : "Pick the animals, then fill in the vaccination details."}
      isDirty={isDirty}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
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

        <div className="space-y-1.5">
          <Label>Vaccine</Label>
          <Controller
            control={control}
            name="vaccineId"
            render={({ field }) => (
              <Combobox
                options={(vaccineOptions ?? []).map((v) => ({ value: v.id, label: v.name }))}
                value={field.value}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Choose a vaccine…"
                searchPlaceholder="Search vaccines…"
                onCreateNew={(name) => void handleCreateVaccine(name)}
                createNewLabel={(name) => `Add "${name}" as a new vaccine`}
              />
            )}
          />
          {errors.vaccineId ? <p className="text-13 text-status-critical">{errors.vaccineId.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vac-date">Date administered</Label>
            <Input id="vac-date" type="date" max={TODAY()} {...register("dateAdministered")} />
            {errors.dateAdministered ? <p className="text-13 text-status-critical">{errors.dateAdministered.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vac-dose">Dose</Label>
            <Input id="vac-dose" {...register("dose")} placeholder="e.g. 2 ml" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vac-batch">Batch number</Label>
            <Input id="vac-batch" {...register("batchNumber")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vac-route">Route</Label>
            <Input id="vac-route" {...register("route")} placeholder="e.g. Subcutaneous" />
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

        <div className="space-y-1.5">
          <Label htmlFor="vac-next-due">Next due date</Label>
          <Input
            id="vac-next-due"
            type="date"
            {...register("nextDueDate")}
            onChange={(e) => {
              setNextDueTouched(true);
              setValue("nextDueDate", e.target.value, { shouldDirty: true });
            }}
          />
          {nextDueDate && selectedVaccine?.defaultIntervalDays ? (
            <p className="text-13 text-muted-foreground">
              {selectedVaccine.defaultIntervalDays} days after the administered date — due {formatPlainDate(nextDueDate)}.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vac-notes">Notes</Label>
          <Textarea id="vac-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Record vaccination"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
