import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { emptyToUndefined } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/patterns/Combobox";
import { createVaccineDetailed } from "../../api";
import { useSpeciesList } from "../../hooks";
import { newVaccineSchema, type NewVaccineFormValues } from "../../schema";

interface AddVaccineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVaccineDialog({ open, onOpenChange }: AddVaccineDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: species } = useSpeciesList(profile?.orgId);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<NewVaccineFormValues>({
    resolver: zodResolver(newVaccineSchema),
    defaultValues: { name: "", speciesId: "", targetDisease: "", defaultIntervalDays: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewVaccineFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createVaccineDetailed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.vaccines(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.vaccineOptions(profile.orgId, undefined) });
      }
      toast.success("Vaccine added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add vaccine", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a vaccine</DialogTitle>
          <DialogDescription>Leave species blank if it applies to every species you keep.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vaccine-name">Name</Label>
            <Input id="vaccine-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Species (optional)</Label>
            <Controller
              control={control}
              name="speciesId"
              render={({ field }) => (
                <Combobox
                  options={(species ?? []).map((s) => ({ value: s.id, label: s.name }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="All species"
                  searchPlaceholder="Search species…"
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vaccine-disease">Target disease</Label>
              <Input id="vaccine-disease" {...register("targetDisease")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vaccine-interval">Interval (days)</Label>
              <Input id="vaccine-interval" type="number" min={1} {...register("defaultIntervalDays")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add vaccine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
