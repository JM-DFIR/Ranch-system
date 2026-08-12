import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { queryKeys } from "@/lib/query-keys";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { CatalogueOrCustomField } from "@/components/patterns/CatalogueOrCustomField";
import { OfflineBlock } from "@/components/patterns/OfflineBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIllnessTypeOptions, useRecordIllness } from "../hooks";
import { createIllnessType, undoRecordIllness, type RecordIllnessResult } from "../api";
import { illnessFormSchema, type IllnessFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordIllnessDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

const STATUS_OPTIONS = [
  { value: "suspected", label: "Suspected" },
  { value: "confirmed", label: "Confirmed" },
  { value: "under_treatment", label: "Under treatment" },
  { value: "recovered", label: "Recovered" },
  { value: "chronic", label: "Chronic" },
];

// Record Illness (session-pack.md, Session 8). Create-only, same as
// every other "record X" drawer — resolving an existing illness later
// (status → recovered with a resolved_date) is an edit action, out of
// scope here same as ProfileHeader's own disabled Edit button. Status
// still accepts "recovered" at record time for the case of logging an
// illness that's already resolved by the time it's entered.
export function RecordIllnessDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordIllnessDrawerProps) {
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
  } = useForm<IllnessFormValues>({
    resolver: zodResolver(illnessFormSchema),
    defaultValues: {
      animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
      illnessName: { type: "catalogue", id: "" },
      onsetDate: TODAY(),
      severity: "mild",
      status: "suspected",
      symptoms: "",
      diagnosis: "",
      diagnosedBy: "",
      resolvedDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
        illnessName: { type: "catalogue", id: "" },
        onsetDate: TODAY(),
        severity: "mild",
        status: "suspected",
        symptoms: "",
        diagnosis: "",
        diagnosedBy: "",
        resolvedDate: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: illnessTypeOptions } = useIllnessTypeOptions(profile?.orgId);
  const mutation = useRecordIllness();
  const queryClient = useQueryClient();
  const status = watch("status");

  const handleCreateIllnessType = async (name: string) => {
    if (!profile) return;
    try {
      const created = await createIllnessType(profile.orgId, name);
      setValue("illnessName", { type: "catalogue", id: created.id }, { shouldDirty: true });
      toast.success(`Added "${name}" to the illness catalogue`);
    } catch (error) {
      toast.error("Couldn't add illness type", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleUndo = async (result: RecordIllnessResult, animalIds: string[]) => {
    try {
      const undone = await undoRecordIllness(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Illness record undone");
      for (const animalId of animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.illnesses(animalId) });
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
        const label = count === 1 ? "Illness recorded" : `Illness recorded for ${count} animals`;
        toast.success(label, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result, values.animalIds) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record illness", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record illness"
      description={isReadOnlySelection ? undefined : "Pick the animals, then fill in what you're seeing."}
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

        <Controller
          control={control}
          name="illnessName"
          render={({ field }) => (
            <CatalogueOrCustomField
              label="Illness"
              value={field.value}
              onChange={field.onChange}
              options={(illnessTypeOptions ?? []).map((i) => ({ value: i.id, label: i.name }))}
              onCreateNew={(name) => void handleCreateIllnessType(name)}
              createNewLabel={(name) => `Add "${name}" as a new illness type`}
              placeholder="Choose an illness…"
              searchPlaceholder="Search illnesses…"
              error={errors.illnessName?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="illness-onset">Onset date</Label>
            <Input id="illness-onset" type="date" max={TODAY()} {...register("onsetDate")} />
            {errors.onsetDate ? <p className="text-13 text-status-critical">{errors.onsetDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="illness-symptoms">Symptoms</Label>
          <Textarea id="illness-symptoms" {...register("symptoms")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="illness-diagnosed-by">Diagnosed by</Label>
            <Input id="illness-diagnosed-by" {...register("diagnosedBy")} />
          </div>
        </div>

        {status === "recovered" ? (
          <div className="space-y-1.5">
            <Label htmlFor="illness-resolved">Resolved date</Label>
            <Input id="illness-resolved" type="date" max={TODAY()} {...register("resolvedDate")} />
            {errors.resolvedDate ? <p className="text-13 text-status-critical">{errors.resolvedDate.message}</p> : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="illness-diagnosis">Diagnosis</Label>
          <Textarea id="illness-diagnosis" {...register("diagnosis")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="illness-notes">Notes</Label>
          <Textarea id="illness-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending || !isOnline}>
            {mutation.isPending ? "Saving…" : "Record illness"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
