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
import { createBreed } from "../../api";
import { useSpeciesList } from "../../hooks";
import { newBreedSchema, type NewBreedFormValues } from "../../schema";

interface AddBreedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBreedDialog({ open, onOpenChange }: AddBreedDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: species } = useSpeciesList(profile?.orgId);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<NewBreedFormValues>({
    resolver: zodResolver(newBreedSchema),
    defaultValues: { speciesId: "", name: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: NewBreedFormValues) => {
      if (!profile) throw new Error("Not signed in");
      return createBreed(profile.orgId, values);
    },
    onSuccess: () => {
      if (profile) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.breeds(profile.orgId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.animals.filterOptions(profile.orgId) });
      }
      toast.success("Breed added");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error("Couldn't add breed", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a breed</DialogTitle>
          <DialogDescription>Breeds belong to a single species.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label>Species</Label>
            <Controller
              control={control}
              name="speciesId"
              render={({ field }) => (
                <Combobox
                  options={(species ?? []).map((s) => ({ value: s.id, label: s.name }))}
                  value={emptyToUndefined(field.value)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Choose a species…"
                  searchPlaceholder="Search species…"
                />
              )}
            />
            {errors.speciesId ? <p className="text-13 text-status-critical">{errors.speciesId.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="breed-name">Name</Label>
            <Input id="breed-name" {...register("name")} />
            {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add breed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
