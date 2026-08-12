import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecordBreedingEvent, useSireOptions } from "../hooks";
import { undoRecordBreedingEvent, type RecordBreedingEventResult } from "../api";
import { breedingEventFormSchema, type BreedingEventFormValues } from "../schema";

export interface PreselectedAnimal {
  id: string;
  tagNumber: string;
}

interface RecordBreedingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dam(s) — pre-filled and read-only from a profile or the register's bulk bar. */
  preselectedAnimals?: PreselectedAnimal[];
  searchableAnimals?: PreselectedAnimal[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const METHOD_OPTIONS = [
  { value: "natural", label: "Natural" },
  { value: "artificial_insemination", label: "Artificial insemination" },
];

// Record Breeding (M4). One action, several dams — a buck/ram-run
// breeds several does/ewes over one joining window (blueprint.md
// §0.6's real convention), same "one action, N records" shape as the
// bulk_*_event RPCs, just via a plain multi-row insert (see
// recordBreedingEvent in api.ts).
export function RecordBreedingDrawer({ open, onOpenChange, preselectedAnimals, searchableAnimals = [] }: RecordBreedingDrawerProps) {
  const { profile } = useAuth();
  const isReadOnlySelection = !!preselectedAnimals && preselectedAnimals.length > 0;

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BreedingEventFormValues>({
    resolver: zodResolver(breedingEventFormSchema),
    defaultValues: {
      damIds: preselectedAnimals?.map((a) => a.id) ?? [],
      method: "natural",
      sire: { type: "unknown" },
      breedingDate: { type: "service", serviceDate: TODAY() },
      technician: "",
      strawCode: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        damIds: preselectedAnimals?.map((a) => a.id) ?? [],
        method: "natural",
        sire: { type: "unknown" },
        breedingDate: { type: "service", serviceDate: TODAY() },
        technician: "",
        strawCode: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: sireOptions } = useSireOptions(profile?.orgId);
  const mutation = useRecordBreedingEvent();
  const queryClient = useQueryClient();

  const handleUndo = async (result: RecordBreedingEventResult, damIds: string[]) => {
    try {
      const undone = await undoRecordBreedingEvent(result);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Breeding event undone");
      for (const damId of damIds) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.breeding.events(damId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(damId) });
      }
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ result }) => {
        const count = values.damIds.length;
        const label = count === 1 ? "Breeding event recorded" : `Breeding event recorded for ${count} dams`;
        toast.success(label, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(result, values.damIds) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record the breeding event", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record breeding"
      description={isReadOnlySelection ? undefined : "Pick the dams, then fill in the breeding details."}
      isDirty={isDirty}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label>Dams</Label>
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
              name="damIds"
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
          {errors.damIds ? <p className="text-13 text-status-critical">{errors.damIds.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label>Method</Label>
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
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

        <div className="space-y-1.5">
          <Label>Sire</Label>
          <Controller
            control={control}
            name="sire"
            render={({ field }) => (
              <>
                <div className="mb-1.5 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value.type === "animal" ? "secondary" : "outline"}
                    onClick={() => field.onChange({ type: "animal", id: "" })}
                  >
                    Known animal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value.type === "external" ? "secondary" : "outline"}
                    onClick={() => field.onChange({ type: "external", note: "" })}
                  >
                    External
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value.type === "unknown" ? "secondary" : "outline"}
                    onClick={() => field.onChange({ type: "unknown" })}
                  >
                    Unknown
                  </Button>
                </div>
                {field.value.type === "animal" ? (
                  <Combobox
                    options={(sireOptions ?? []).map((s) => ({ value: s.id, label: s.tagNumber }))}
                    value={emptyToUndefined(field.value.id)}
                    onChange={(v) => field.onChange({ type: "animal", id: v ?? "" })}
                    placeholder="Choose a sire…"
                    searchPlaceholder="Search sires…"
                  />
                ) : field.value.type === "external" ? (
                  <Input
                    value={field.value.note}
                    onChange={(e) => field.onChange({ type: "external", note: e.target.value })}
                    placeholder="e.g. Neighbour's buck"
                  />
                ) : null}
              </>
            )}
          />
          {errors.sire ? <p className="text-13 text-status-critical">{errors.sire.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label>When</Label>
          </div>
          <Controller
            control={control}
            name="breedingDate"
            render={({ field }) => (
              <>
                <div className="mb-1.5 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value.type === "service" ? "secondary" : "outline"}
                    onClick={() => field.onChange({ type: "service", serviceDate: TODAY() })}
                  >
                    Known service date
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value.type === "joining" ? "secondary" : "outline"}
                    onClick={() => field.onChange({ type: "joining", joiningStart: TODAY(), joiningEnd: "" })}
                  >
                    Joining window
                  </Button>
                </div>
                {field.value.type === "service" ? (
                  <Input
                    type="date"
                    max={TODAY()}
                    value={field.value.serviceDate}
                    onChange={(e) => field.onChange({ type: "service", serviceDate: e.target.value })}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      max={TODAY()}
                      value={field.value.joiningStart}
                      onChange={(e) => field.onChange({ ...field.value, joiningStart: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={field.value.joiningEnd ?? ""}
                      onChange={(e) => field.onChange({ ...field.value, joiningEnd: e.target.value })}
                      placeholder="End (optional)"
                    />
                  </div>
                )}
              </>
            )}
          />
        </div>

        {watch("method") === "artificial_insemination" ? (
          <div className="space-y-1.5">
            <Label htmlFor="breeding-straw">Straw code</Label>
            <Input id="breeding-straw" {...register("strawCode")} />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="breeding-technician">Technician</Label>
          <Input id="breeding-technician" {...register("technician")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="breeding-notes">Notes</Label>
          <Textarea id="breeding-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Record breeding"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
