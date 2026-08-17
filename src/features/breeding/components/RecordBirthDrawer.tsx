import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreedingEvents, useRecordBirth } from "../hooks";
import { undoRecordBirth } from "../api";
import { birthFormSchema, type BirthFormValues } from "../schema";

interface DamOption {
  id: string;
  tagNumber: string;
}

interface RecordBirthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Births are always single-dam, unlike the other bulk-capable record flows — read-only when set from a profile. */
  dam?: DamOption;
  searchableAnimals?: DamOption[];
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const EASE_OPTIONS = [
  { value: "unassisted", label: "Unassisted" },
  { value: "assisted", label: "Assisted" },
  { value: "veterinary", label: "Veterinary" },
];

const SEX_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const OUTCOME_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "stillborn", label: "Stillborn" },
  { value: "died_shortly_after", label: "Died shortly after" },
];

const EMPTY_OFFSPRING = { tagNumber: "", sex: "unknown" as const, birthWeight: "", outcome: "live" as const };

// Record Birth (M4). One dam, one action, several offspring —
// record_birth() (0017_rpc.sql) already handles the four-table
// transaction (births, animals, birth_offspring, the breeding event's
// status flip); this shapes the offspring repeater into its jsonb
// array param.
export function RecordBirthDrawer({ open, onOpenChange, dam, searchableAnimals = [] }: RecordBirthDrawerProps) {
  const isReadOnlySelection = !!dam;

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BirthFormValues>({
    resolver: zodResolver(birthFormSchema),
    defaultValues: {
      damId: dam?.id ?? "",
      breedingEventId: "",
      birthDate: TODAY(),
      ease: "unassisted",
      complications: "",
      offspring: [EMPTY_OFFSPRING],
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        damId: dam?.id ?? "",
        breedingEventId: "",
        birthDate: TODAY(),
        ease: "unassisted",
        complications: "",
        offspring: [EMPTY_OFFSPRING],
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { fields, append, remove } = useFieldArray({ control, name: "offspring" });
  const damId = watch("damId");
  const { data: damEvents } = useBreedingEvents(dam?.id ?? damId);
  const openEvents = (damEvents ?? []).filter((e) => e.status === "served" || e.status === "confirmed_pregnant");

  const mutation = useRecordBirth();
  const queryClient = useQueryClient();

  const handleUndo = async (birthId: string, forDamId: string) => {
    try {
      const undone = await undoRecordBirth(birthId);
      if (!undone) {
        toast.info("Too late to undo.");
        return;
      }
      toast.success("Birth undone");
      void queryClient.invalidateQueries({ queryKey: queryKeys.breeding.births(forDamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(forDamId) });
    } catch (error) {
      toast.error("Couldn't undo", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: ({ birthId }) => {
        const count = values.offspring.length;
        toast.success(count === 1 ? "Birth recorded" : `Birth recorded — litter of ${count}`, {
          duration: 8000,
          action: { label: "Undo", onClick: () => void handleUndo(birthId, values.damId) },
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Couldn't record the birth", { description: error instanceof Error ? error.message : undefined });
      },
    });
  });

  return (
    <RecordDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record birth"
      description={isReadOnlySelection ? undefined : "Choose the dam, then add each offspring."}
      isDirty={isDirty}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label>Dam</Label>
          {isReadOnlySelection ? (
            <p className="text-14 font-mono tabular-nums text-foreground">{dam.tagNumber}</p>
          ) : (
            <Controller
              control={control}
              name="damId"
              render={({ field }) => (
                <Combobox
                  options={searchableAnimals.map((a) => ({ value: a.id, label: a.tagNumber }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Choose the dam…"
                  searchPlaceholder="Search animals…"
                />
              )}
            />
          )}
          {errors.damId ? <p className="text-13 text-status-critical">{errors.damId.message}</p> : null}
        </div>

        {openEvents.length > 0 ? (
          <div className="space-y-1.5">
            <Label>Linked breeding event (optional)</Label>
            <Controller
              control={control}
              name="breedingEventId"
              render={({ field }) => (
                <Combobox
                  options={openEvents.map((e) => ({
                    value: e.id,
                    label: `${e.serviceDate ?? e.joiningStart ?? "Unknown date"} — ${e.sireTagNumber ?? e.externalSireNote ?? "Unknown sire"}`,
                  }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Not linked"
                  searchPlaceholder="Search breeding events…"
                />
              )}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="birth-date">Birth date</Label>
            <Input id="birth-date" type="date" max={TODAY()} {...register("birthDate")} />
            {errors.birthDate ? <p className="text-13 text-status-critical">{errors.birthDate.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Ease</Label>
            <Controller
              control={control}
              name="ease"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EASE_OPTIONS.map((opt) => (
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
          <Label htmlFor="birth-complications">Complications</Label>
          <Textarea id="birth-complications" {...register("complications")} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Offspring</Label>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => append(EMPTY_OFFSPRING)}>
              <Plus className="size-3.5" aria-hidden />
              Add another
            </Button>
          </div>
          {errors.offspring?.message ? <p className="text-13 text-status-critical">{errors.offspring.message}</p> : null}
          <div className="flex flex-col gap-3">
            {fields.map((item, index) => (
              <div key={item.id} className="rounded-card border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-13 font-medium text-foreground">Offspring {index + 1}</p>
                  {fields.length > 1 ? (
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove offspring" onClick={() => remove(index)}>
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`offspring-${index}-tag`} className="text-12">
                      Tag number
                    </Label>
                    <Input id={`offspring-${index}-tag`} {...register(`offspring.${index}.tagNumber`)} placeholder="Optional for now" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-12">Sex</Label>
                    <Controller
                      control={control}
                      name={`offspring.${index}.sex`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEX_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`offspring-${index}-weight`} className="text-12">
                      Birth weight (kg)
                    </Label>
                    <Input id={`offspring-${index}-weight`} type="number" step="0.1" min="0" {...register(`offspring.${index}.birthWeight`)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-12">Outcome</Label>
                    <Controller
                      control={control}
                      name={`offspring.${index}.outcome`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OUTCOME_OPTIONS.map((opt) => (
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
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birth-notes">Notes</Label>
          <Textarea id="birth-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Record birth"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
