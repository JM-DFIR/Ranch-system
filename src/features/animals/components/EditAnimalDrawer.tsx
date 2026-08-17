import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { useDamOptions, useSireOptions } from "@/features/breeding/hooks";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Combobox } from "@/components/patterns/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnimalFilterOptions } from "../hooks";
import { updateAnimal } from "../api";
import { animalEditSchema, type AnimalEditValues } from "../schema";
import type { AnimalProfile } from "../api";

interface EditAnimalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: AnimalProfile;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const SEX_OPTIONS: { value: "male" | "female" | "unknown"; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "unknown", label: "Unknown" },
];

const ACQUISITION_OPTIONS: { value: "born_on_ranch" | "purchased" | "gift" | "unknown"; label: string }[] = [
  { value: "born_on_ranch", label: "Born on the ranch" },
  { value: "purchased", label: "Purchased" },
  { value: "gift", label: "Gift" },
  { value: "unknown", label: "Unknown" },
];

function toFormValues(animal: AnimalProfile): AnimalEditValues {
  return {
    tagNumber: animal.tagNumber,
    name: animal.name ?? "",
    speciesId: animal.speciesId ?? "",
    breedId: animal.breedId ?? "",
    sex: (animal.sex as AnimalEditValues["sex"]) ?? "unknown",
    color: animal.color ?? "",
    dateOfBirth: animal.dateOfBirth ?? "",
    dobIsEstimated: animal.dobIsEstimated,
    acquisitionType: animal.acquisitionType as AnimalEditValues["acquisitionType"],
    acquisitionDate: animal.acquisitionDate ?? "",
    damId: animal.damId ?? "",
    sireId: animal.sireId ?? "",
    sectionId: animal.sectionId ?? "",
    anitracAin: animal.anitracAin ?? "",
    notes: animal.notes ?? "",
  };
}

// Every identity field enrollment collects, minus ranch and status —
// see animalEditSchema's own comment for why those two stay out. This
// is a plain online update (like Change status/Transfer), not one of
// the five offline-queued operations: editing an existing record from
// a profile you're already looking at needs a live connection to that
// record anyway, unlike first capturing a brand-new animal in the field.
export function EditAnimalDrawer({ open, onOpenChange, animal }: EditAnimalDrawerProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AnimalEditValues>({
    resolver: zodResolver(animalEditSchema),
    defaultValues: toFormValues(animal),
  });

  useEffect(() => {
    if (open) reset(toFormValues(animal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, animal.id]);

  const { data: filterOptions } = useAnimalFilterOptions(profile?.orgId);
  const { data: sireOptions } = useSireOptions(profile?.orgId);
  const { data: damOptions } = useDamOptions(profile?.orgId);

  const speciesId = watch("speciesId");
  const breedOptions = (filterOptions?.breeds ?? []).filter((b) => !speciesId || b.speciesId === speciesId);
  const sectionOptions = (filterOptions?.sections ?? []).filter((s) => s.ranchId === animal.ranchId);
  const damChoices = (damOptions ?? []).filter((d) => d.id !== animal.id);
  const sireChoices = (sireOptions ?? []).filter((s) => s.id !== animal.id);

  const mutation = useMutation({
    mutationFn: (values: AnimalEditValues) =>
      updateAnimal(animal.id, {
        tagNumber: values.tagNumber.trim(),
        name: emptyToUndefined(values.name),
        speciesId: values.speciesId,
        breedId: emptyToUndefined(values.breedId),
        sex: values.sex,
        color: emptyToUndefined(values.color),
        dateOfBirth: emptyToUndefined(values.dateOfBirth),
        dobIsEstimated: values.dobIsEstimated,
        acquisitionType: values.acquisitionType,
        acquisitionDate: emptyToUndefined(values.acquisitionDate),
        damId: emptyToUndefined(values.damId),
        sireId: emptyToUndefined(values.sireId),
        sectionId: emptyToUndefined(values.sectionId),
        anitracAin: emptyToUndefined(values.anitracAin),
        notes: emptyToUndefined(values.notes),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animal.id) });
      if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
      toast.success("Animal details updated");
      onOpenChange(false);
    },
    onError: (error) => {
      // Postgres unique_violation on (org_id, tag_number) — the same
      // conflict the offline sync worker catches (CLAUDE.md §8), just
      // surfacing synchronously here since this write isn't queued.
      const code = (error as { code?: string }).code;
      if (code === "23505") {
        setError("tagNumber", { message: "This tag number is already in use." });
        return;
      }
      toast.error("Couldn't save changes", { description: error instanceof Error ? error.message : undefined });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <RecordDrawer open={open} onOpenChange={onOpenChange} title={`Edit ${animal.tagNumber}`} isDirty={isDirty}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-tag">Tag number</Label>
            <Input id="edit-tag" className="font-mono tabular-nums" {...register("tagNumber")} />
            {errors.tagNumber ? <p className="text-13 text-status-critical">{errors.tagNumber.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" {...register("name")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Species</Label>
            <Controller
              control={control}
              name="speciesId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a species…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterOptions?.species ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.speciesId ? <p className="text-13 text-status-critical">{errors.speciesId.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Breed</Label>
            <Controller
              control={control}
              name="breedId"
              render={({ field }) => (
                <Combobox
                  options={breedOptions.map((b) => ({ value: b.id, label: b.name }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Not set"
                  searchPlaceholder="Search breeds…"
                  disabled={!speciesId}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Sex</Label>
          <Controller
            control={control}
            name="sex"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-color">Colour</Label>
            <Input id="edit-color" {...register("color")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-anitrac">ANITRAC AIN</Label>
            <Input id="edit-anitrac" inputMode="numeric" placeholder="15 digits" className="font-mono tabular-nums" {...register("anitracAin")} />
            {errors.anitracAin ? <p className="text-13 text-status-critical">{errors.anitracAin.message}</p> : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-dob">Date of birth</Label>
          <Input id="edit-dob" type="date" max={TODAY()} {...register("dateOfBirth")} />
          {errors.dateOfBirth ? <p className="text-13 text-status-critical">{errors.dateOfBirth.message}</p> : null}
          <label className="flex items-center gap-2 pt-1 text-13 text-muted-foreground">
            <Controller
              control={control}
              name="dobIsEstimated"
              render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} />}
            />
            Estimated
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Acquisition</Label>
            <Controller
              control={control}
              name="acquisitionType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACQUISITION_OPTIONS.map((opt) => (
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
            <Label htmlFor="edit-acquisition-date">Acquired</Label>
            <Input id="edit-acquisition-date" type="date" max={TODAY()} {...register("acquisitionDate")} />
            {errors.acquisitionDate ? <p className="text-13 text-status-critical">{errors.acquisitionDate.message}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Dam</Label>
            <Controller
              control={control}
              name="damId"
              render={({ field }) => (
                <Combobox
                  options={damChoices.map((d) => ({ value: d.id, label: d.tagNumber }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Not set"
                  searchPlaceholder="Search dams…"
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sire</Label>
            <Controller
              control={control}
              name="sireId"
              render={({ field }) => (
                <Combobox
                  options={sireChoices.map((s) => ({ value: s.id, label: s.tagNumber }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Not set"
                  searchPlaceholder="Search sires…"
                />
              )}
            />
            {errors.sireId ? <p className="text-13 text-status-critical">{errors.sireId.message}</p> : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Section</Label>
          <Controller
            control={control}
            name="sectionId"
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

        <div className="space-y-1.5">
          <Label htmlFor="edit-notes">Notes</Label>
          <Textarea id="edit-notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </RecordDrawer>
  );
}
