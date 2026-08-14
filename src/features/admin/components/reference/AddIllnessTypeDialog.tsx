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
import { createIllnessTypeDetailed } from "../../api";
import { useSpeciesList } from "../../hooks";
import { newIllnessTypeSchema, type NewIllnessTypeFormValues } from "../../schema";

interface AddIllnessTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddIllnessTypeDialog({ open, onOpenChange }: AddIllnessTypeDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: species } = useSpeciesList(profile?.orgId);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<NewIllnessTypeFormValues>({
    resolver: zodResolver(newIllnessTypeSchema),
    defaultValues: { name: "", speciesId: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewIllnessTypeFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createIllnessTypeDetailed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.illnessTypes(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.health.illnessTypeOptions(profile.orgId) });
      }
      toast.success("Illness type added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add illness type", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an illness type</DialogTitle>
          <DialogDescription>Leave species blank if it applies to every species you keep.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="illness-name">Name</Label>
            <Input id="illness-name" {...register("name")} />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add illness type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
