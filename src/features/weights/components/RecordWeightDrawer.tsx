import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/lib/query-keys";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecordWeight } from "../hooks";
import { undoRecordWeight, type RecordWeightResult } from "../api";
import { weightFormSchema, type WeightFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

export interface AnimalSearchOption {
  id: string;
  tagNumber: string;
}

interface RecordWeightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set from a profile or the register's bulk selection — read-only when present. */
  preselectedAnimals?: PreselectedAnimal[];
  /** Only needed for the free-pick case (no preselection) — Bulk Weigh Day / the dashboard quick-action entry point. */
  searchableAnimals?: AnimalSearchOption[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const METHOD_OPTIONS = [
  { value: "scale", label: "Scale" },
  { value: "girth_tape", label: "Girth tape" },
  { value: "visual_estimate", label: "Visual estimate" },
];

// Record Weight / Bulk Weigh Day (blueprint.md §2.3, session-pack.md
// Session 8) — copies the Record Vaccination drawer's shape exactly
// (docs/patterns/record-drawer.md), including the offline queue path,
// since weight is one of the five offline-queued operations.
export function RecordWeightDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordWeightDrawerProps) {
  const isReadOnlySelection = !!preselectedAnimals && preselectedAnimals.length > 0;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
      weightDate: TODAY(),
      method: "scale",
      weightKg: "",
      bodyConditionScore: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
        weightDate: TODAY(),
        method: "scale",
        weightKg: "",
        bodyConditionScore: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useRecordWeight();
  const queryClient = useQueryClient();

  const handleUndo = async (result: RecordWeightResult, animalIds: string[]) => {
    try {
      const undone = await undoRecordWeight(result);
      if (!undone) {
        toast.info("Too late to undo — this already finished syncing.");
        return;
      }
      toast.success("Weight record undone");
      for (const animalId of animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.weights.series(animalId) });
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
        const label = count === 1 ? "Weight recorded" : `Weight recorded for ${count} animals`;
        toast.success(label, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result, values.animalIds) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record weight", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record weight"
      description={isReadOnlySelection ? undefined : "Pick the animals, then fill in the weigh-in details."}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="weight-date">Weight date</Label>
            <Input id="weight-date" type="date" max={TODAY()} {...register("weightDate")} />
            {errors.weightDate ? <p className="text-13 text-status-critical">{errors.weightDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a method…" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((opt) => (
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="weight-kg">Weight (kg)</Label>
            <Input id="weight-kg" type="number" step="0.1" min="0" {...register("weightKg")} placeholder="e.g. 42.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight-bcs">Body condition score (1–5)</Label>
            <Input id="weight-bcs" type="number" step="1" min="1" max="5" {...register("bodyConditionScore")} />
          </div>
        </div>
        {errors.weightKg ? <p className="-mt-2 text-13 text-status-critical">{errors.weightKg.message}</p> : null}

        <div className="space-y-1.5">
          <Label htmlFor="weight-notes">Notes</Label>
          <Textarea id="weight-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Record weight"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
