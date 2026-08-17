import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { fetchRanchList } from "@/features/ranches/api";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { OfflineBlock } from "@/components/patterns/OfflineBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCareActivityTypeOptions, useOrgMembers, useRecordCareActivity } from "../hooks";
import { createCareActivityType, undoRecordCareActivity, type RecordCareActivityResult } from "../api";
import { careActivityFormSchema, type CareActivityFormValues } from "../schema";
import { ScopeField } from "./ScopeField";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordCareActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

// Record Care Activity (M5). Same ranch-wide-or-animal shape as Record
// Feeding (ScopeField.tsx) — dipping, deworming, hoof trimming and the
// rest are just as often a whole-ranch activity as an individual one.
// Online-only, same as treatment/illness/vet-visit.
export function RecordCareActivityDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordCareActivityDrawerProps) {
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
  } = useForm<CareActivityFormValues>({
    resolver: zodResolver(careActivityFormSchema),
    defaultValues: {
      scope: isReadOnlySelection ? { type: "animal", animalIds: preselectedAnimals.map((a) => a.id) } : { type: "ranch", ranchId: "" },
      activityTypeId: "",
      activityDate: TODAY(),
      product: "",
      nextDueDate: "",
      performedBy: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        scope: isReadOnlySelection ? { type: "animal", animalIds: preselectedAnimals.map((a) => a.id) } : { type: "ranch", ranchId: "" },
        activityTypeId: "",
        activityDate: TODAY(),
        product: "",
        nextDueDate: "",
        performedBy: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: ranches } = useQuery({
    queryKey: queryKeys.ranches.list(profile?.orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!profile?.orgId,
  });
  const { data: filterOptions } = useAnimalFilterOptions(profile?.orgId);
  const { data: activityTypeOptions } = useCareActivityTypeOptions(profile?.orgId);
  const { data: orgMembers } = useOrgMembers(profile?.orgId);
  const mutation = useRecordCareActivity();
  const queryClient = useQueryClient();

  const handleCreateActivityType = async (name: string) => {
    if (!profile) return;
    try {
      const created = await createCareActivityType(profile.orgId, name);
      setValue("activityTypeId", created.id, { shouldDirty: true });
      toast.success(`Added "${name}" to the care activity catalogue`);
    } catch (error) {
      toast.error("Couldn't add activity type", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleUndo = async (result: RecordCareActivityResult) => {
    try {
      const undone = await undoRecordCareActivity(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Care activity undone");
      void queryClient.invalidateQueries({ queryKey: ["feeding"] });
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ result }) => {
        const count = values.scope.type === "animal" ? values.scope.animalIds.length : 1;
        const label = count > 1 ? `Care activity logged for ${count} animals` : "Care activity logged";
        toast.success(label, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't log the care activity", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer open={open} onOpenChange={onOpenChange} title="Log care activity" isDirty={isDirty}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        {!isOnline ? <OfflineBlock /> : null}

        {isReadOnlySelection ? (
          <div className="space-y-1.5">
            <Label>Animals</Label>
            <div className="flex flex-wrap gap-1">
              {preselectedAnimals.map((a) => (
                <Badge key={a.id} variant="neutral">
                  {a.tagNumber}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <Controller
            control={control}
            name="scope"
            render={({ field }) => (
              <ScopeField
                value={field.value}
                onChange={field.onChange}
                ranches={ranches ?? []}
                sections={filterOptions?.sections ?? []}
                searchableAnimals={searchableAnimals}
                error={errors.scope?.message}
              />
            )}
          />
        )}

        <div className="space-y-1.5">
          <Label>Activity type</Label>
          <Controller
            control={control}
            name="activityTypeId"
            render={({ field }) => (
              <Combobox
                options={(activityTypeOptions ?? []).map((a) => ({ value: a.id, label: a.name }))}
                value={emptyToUndefined(field.value)}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Choose an activity type…"
                searchPlaceholder="Search activity types…"
                onCreateNew={(name) => void handleCreateActivityType(name)}
                createNewLabel={(name) => `Add "${name}" as a new activity type`}
              />
            )}
          />
          {errors.activityTypeId ? <p className="text-13 text-status-critical">{errors.activityTypeId.message}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="care-date">Activity date</Label>
            <Input id="care-date" type="date" max={TODAY()} {...register("activityDate")} />
            {errors.activityDate ? <p className="text-13 text-status-critical">{errors.activityDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="care-next-due">Next due (optional)</Label>
            <Input id="care-next-due" type="date" {...register("nextDueDate")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="care-product">Product</Label>
          <Input id="care-product" {...register("product")} />
        </div>

        <div className="space-y-1.5">
          <Label>Performed by</Label>
          <Controller
            control={control}
            name="performedBy"
            render={({ field }) => (
              <Combobox
                options={(orgMembers ?? []).map((m) => ({ value: m.id, label: m.name }))}
                value={emptyToUndefined(field.value)}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Defaults to you"
                searchPlaceholder="Search staff…"
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="care-notes">Notes</Label>
          <Textarea id="care-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending || !isOnline}>
            {mutation.isPending ? "Saving…" : "Log care activity"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
