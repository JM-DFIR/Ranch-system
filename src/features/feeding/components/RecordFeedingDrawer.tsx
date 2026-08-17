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
import { useFeedItemOptions, useRecordFeeding } from "../hooks";
import { createFeedItem, undoRecordFeeding, type RecordFeedingResult } from "../api";
import { feedingFormSchema, type FeedingFormValues } from "../schema";
import { ScopeField } from "./ScopeField";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordFeedingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Locks the scope to these animals, read-only — from a profile or the register's bulk bar. */
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

// Record Feeding (M5 — session-pack.md Part 5). Most feeding is
// ranch-wide, not per-animal (ScopeField.tsx) — the one record flow so
// far where that's the default rather than an edge case. Online-only,
// same as treatment/illness/vet-visit (docs/patterns/record-drawer.md).
export function RecordFeedingDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordFeedingDrawerProps) {
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
  } = useForm<FeedingFormValues>({
    resolver: zodResolver(feedingFormSchema),
    defaultValues: {
      scope: isReadOnlySelection ? { type: "animal", animalIds: preselectedAnimals.map((a) => a.id) } : { type: "ranch", ranchId: "" },
      feedItemId: "",
      feedDate: TODAY(),
      quantity: "",
      unit: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        scope: isReadOnlySelection ? { type: "animal", animalIds: preselectedAnimals.map((a) => a.id) } : { type: "ranch", ranchId: "" },
        feedItemId: "",
        feedDate: TODAY(),
        quantity: "",
        unit: "",
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
  const { data: feedItemOptions } = useFeedItemOptions(profile?.orgId);
  const mutation = useRecordFeeding();
  const queryClient = useQueryClient();

  const handleCreateFeedItem = async (name: string) => {
    if (!profile) return;
    try {
      const created = await createFeedItem(profile.orgId, name, "kg");
      setValue("feedItemId", created.id, { shouldDirty: true });
      setValue("unit", created.unit, { shouldDirty: true });
      toast.success(`Added "${name}" to the feed catalogue`);
    } catch (error) {
      toast.error("Couldn't add feed item", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleUndo = async (result: RecordFeedingResult) => {
    try {
      const undone = await undoRecordFeeding(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Feeding record undone");
      void queryClient.invalidateQueries({ queryKey: ["feeding"] });
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ result }) => {
        const count = values.scope.type === "animal" ? values.scope.animalIds.length : 1;
        const label = count > 1 ? `Feeding logged for ${count} animals` : "Feeding logged";
        toast.success(label, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't log feeding", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer open={open} onOpenChange={onOpenChange} title="Log feeding" isDirty={isDirty}>
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
          <Label>Feed item</Label>
          <Controller
            control={control}
            name="feedItemId"
            render={({ field }) => (
              <Combobox
                options={(feedItemOptions ?? []).map((f) => ({ value: f.id, label: `${f.name} (${f.unit})` }))}
                value={emptyToUndefined(field.value)}
                onChange={(v) => {
                  field.onChange(v ?? "");
                  const item = feedItemOptions?.find((f) => f.id === v);
                  if (item) setValue("unit", item.unit, { shouldDirty: true });
                }}
                placeholder="Choose a feed item…"
                searchPlaceholder="Search feed items…"
                onCreateNew={(name) => void handleCreateFeedItem(name)}
                createNewLabel={(name) => `Add "${name}" as a new feed item`}
              />
            )}
          />
          {errors.feedItemId ? <p className="text-13 text-status-critical">{errors.feedItemId.message}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="feed-date">Feed date</Label>
            <Input id="feed-date" type="date" max={TODAY()} {...register("feedDate")} />
            {errors.feedDate ? <p className="text-13 text-status-critical">{errors.feedDate.message}</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="feed-quantity">Quantity</Label>
              <Input id="feed-quantity" type="number" step="0.1" min="0" {...register("quantity")} />
              {errors.quantity ? <p className="text-13 text-status-critical">{errors.quantity.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feed-unit">Unit</Label>
              <Input id="feed-unit" {...register("unit")} placeholder="kg" />
              {errors.unit ? <p className="text-13 text-status-critical">{errors.unit.message}</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="feed-notes">Notes</Label>
          <Textarea id="feed-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending || !isOnline}>
            {mutation.isPending ? "Saving…" : "Log feeding"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
