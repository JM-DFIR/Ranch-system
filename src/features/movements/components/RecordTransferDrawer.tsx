import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { fetchRanchList } from "@/features/ranches/api";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRecordTransfer } from "../hooks";
import { undoRecordTransfer, type RecordTransferResult } from "../api";
import { transferFormSchema, type TransferFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordTransferDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

// Record Transfer (M4 — session-pack.md Part 5). record_movement()
// resolves from_ranch_id itself, server-side, from each animal's
// current row — this form only ever collects a destination
// (CLAUDE.md §7). Undo only offers itself for a single-animal online
// transfer; see undoRecordTransfer in api.ts for why bulk isn't
// reversible the same way.
export function RecordTransferDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordTransferDrawerProps) {
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
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
      toRanchId: "",
      toSectionId: "",
      movementDate: TODAY(),
      reason: "",
      permitNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        animalIds: preselectedAnimals?.map((a) => a.id) ?? [],
        toRanchId: "",
        toSectionId: "",
        movementDate: TODAY(),
        reason: "",
        permitNumber: "",
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
  const toRanchId = watch("toRanchId");
  const sectionOptions = (filterOptions?.sections ?? []).filter((s) => s.ranchId === toRanchId);

  const mutation = useRecordTransfer();
  const queryClient = useQueryClient();

  const handleUndo = async (result: RecordTransferResult, animalIds: string[]) => {
    try {
      const undone = await undoRecordTransfer(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Transfer undone");
      for (const animalId of animalIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.movements.list(animalId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      }
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ result }) => {
        const count = values.animalIds.length;
        const ranchName = ranches?.find((r) => r.id === values.toRanchId)?.name ?? "the destination ranch";
        const label = count === 1 ? `Moved to ${ranchName}` : `${count} animals moved to ${ranchName}`;
        const canUndo = count === 1;
        toast.success(label, {
          duration: 8000,
          action: canUndo ? { label: "Undo", onClick: () => void handleUndo(result, values.animalIds) } : undefined,
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record the transfer", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer"
      description={isReadOnlySelection ? undefined : "Pick the animals, then choose where they're going."}
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
          <Label>Destination ranch</Label>
          <Controller
            control={control}
            name="toRanchId"
            render={({ field }) => (
              <Combobox
                options={(ranches ?? []).map((r) => ({ value: r.id, label: r.name }))}
                value={emptyToUndefined(field.value)}
                onChange={(v) => {
                  field.onChange(v ?? "");
                  setValue("toSectionId", "", { shouldDirty: true });
                }}
                placeholder="Choose a ranch…"
                searchPlaceholder="Search ranches…"
              />
            )}
          />
          {errors.toRanchId ? <p className="text-13 text-status-critical">{errors.toRanchId.message}</p> : null}
        </div>

        {toRanchId && sectionOptions.length > 0 ? (
          <div className="space-y-1.5">
            <Label>Section (optional)</Label>
            <Controller
              control={control}
              name="toSectionId"
              render={({ field }) => (
                <Combobox
                  options={sectionOptions.map((s) => ({ value: s.id, label: s.name }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="No specific section"
                  searchPlaceholder="Search sections…"
                />
              )}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="transfer-date">Movement date</Label>
            <Input id="transfer-date" type="date" max={TODAY()} {...register("movementDate")} />
            {errors.movementDate ? <p className="text-13 text-status-critical">{errors.movementDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer-permit">Permit number</Label>
            <Input id="transfer-permit" {...register("permitNumber")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transfer-reason">Reason</Label>
          <Input id="transfer-reason" {...register("reason")} placeholder="e.g. Grazing rotation" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transfer-notes">Notes</Label>
          <Textarea id="transfer-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Moving…" : "Transfer"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
