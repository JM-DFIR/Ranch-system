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
import { OfflineBlock } from "@/components/patterns/OfflineBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRecordVetVisit, useVeterinarianOptions } from "../hooks";
import { createVeterinarian, undoRecordVetVisit, type RecordVetVisitResult } from "../api";
import { vetVisitFormSchema, type VetVisitFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordVetVisitDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

// Record Vet Visit (session-pack.md, Session 8). One visit, many
// animals — record_vet_visit (0028_health_bulk_rpcs.sql) requires
// every selected animal to share a ranch (a visit happens at one
// physical place), and raises otherwise; the drawer doesn't
// pre-validate that client-side, it surfaces the RPC's own error.
export function RecordVetVisitDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordVetVisitDrawerProps) {
  const { profile } = useAuth();
  const isOnline = useOnlineStatus();
  const isReadOnlySelection = !!preselectedAnimals && preselectedAnimals.length > 0;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<VetVisitFormValues>({
    resolver: zodResolver(vetVisitFormSchema),
    defaultValues: {
      animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
      veterinarianId: "",
      visitDate: TODAY(),
      purpose: "",
      findings: "",
      recommendations: "",
      nextVisitDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
        veterinarianId: "",
        visitDate: TODAY(),
        purpose: "",
        findings: "",
        recommendations: "",
        nextVisitDate: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: veterinarianOptions } = useVeterinarianOptions(profile?.orgId);
  const mutation = useRecordVetVisit();
  const queryClient = useQueryClient();

  const handleCreateVeterinarian = async (name: string) => {
    if (!profile) return;
    try {
      const created = await createVeterinarian(profile.orgId, name);
      setValue("veterinarianId", created.id, { shouldDirty: true });
      toast.success(`Added "${name}" to the veterinarian directory`);
    } catch (error) {
      toast.error("Couldn't add veterinarian", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleUndo = async (result: RecordVetVisitResult, animalIds: string[]) => {
    try {
      const undone = await undoRecordVetVisit(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Vet visit undone");
      for (const animalId of animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.vetVisits(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ result }) => {
        toast.success("Vet visit recorded", {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result, values.animalIds) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record vet visit", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record vet visit"
      description={isReadOnlySelection ? undefined : "Pick the animals seen on this visit, then fill in the details."}
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

        <div className="space-y-1.5">
          <Label>Veterinarian</Label>
          <Controller
            control={control}
            name="veterinarianId"
            render={({ field }) => (
              <Combobox
                options={(veterinarianOptions ?? []).map((v) => ({ value: v.id, label: v.name }))}
                value={emptyToUndefined(field.value)}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Choose a veterinarian…"
                searchPlaceholder="Search veterinarians…"
                onCreateNew={(name) => void handleCreateVeterinarian(name)}
                createNewLabel={(name) => `Add "${name}" as a new veterinarian`}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="visit-date">Visit date</Label>
            <Input id="visit-date" type="date" max={TODAY()} {...register("visitDate")} />
            {errors.visitDate ? <p className="text-13 text-status-critical">{errors.visitDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visit-next">Next visit date</Label>
            <Input id="visit-next" type="date" {...register("nextVisitDate")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visit-purpose">Purpose</Label>
          <Input id="visit-purpose" {...register("purpose")} placeholder="e.g. Routine check, herd health" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visit-findings">Findings</Label>
          <Textarea id="visit-findings" {...register("findings")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visit-recommendations">Recommendations</Label>
          <Textarea id="visit-recommendations" {...register("recommendations")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visit-notes">Notes</Label>
          <Textarea id="visit-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending || !isOnline}>
            {mutation.isPending ? "Saving…" : "Record vet visit"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
