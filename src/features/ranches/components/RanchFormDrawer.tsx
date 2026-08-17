import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { RecordDrawer } from "@/components/patterns/RecordDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createRanch, updateRanch, uploadRanchCover, type RanchDetail } from "../api";
import { useRanchCoverUrl } from "../hooks";
import { ranchFormSchema, type RanchFormValues } from "../schema";

interface RanchFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit; absent = create. */
  ranch?: RanchDetail;
}

function toFormValues(ranch: RanchDetail | undefined): RanchFormValues {
  return {
    name: ranch?.name ?? "",
    location: ranch?.location ?? "",
    description: ranch?.description ?? "",
    sizeAcres: ranch?.sizeAcres ? String(ranch.sizeAcres) : "",
    contactName: ranch?.contactName ?? "",
    contactPhone: ranch?.contactPhone ?? "",
    contactEmail: ranch?.contactEmail ?? "",
    status: ranch?.status ?? "active",
    notes: ranch?.notes ?? "",
  };
}

// Create/Edit Ranch (blueprint.md §4.1) — one drawer, both modes, same
// as every other create/edit pair in this app. Owner-only end to end:
// the nav only offers this to an owner (RanchListPage/RanchDetailPage),
// and ranches_owner_insert/update (0014_rls.sql) is the real gate.
export function RanchFormDrawer({ open, onOpenChange, ranch }: RanchFormDrawerProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A derived value, not state — computing it during render (rather
  // than in an effect that calls setState) avoids the extra render
  // pass react-hooks/set-state-in-effect flags. The effect below only
  // handles the one thing an effect is actually for here: revoking the
  // previous object URL once it's no longer displayed.
  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile]);

  const { data: existingCoverUrl } = useRanchCoverUrl(ranch?.coverImagePath);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<RanchFormValues>({
    resolver: zodResolver(ranchFormSchema),
    values: toFormValues(ranch),
  });

  // Object URLs are created outside React's render cycle and must be
  // revoked manually — leaving this out would leak one blob URL per
  // cover image picked across the drawer's lifetime.
  useEffect(() => {
    if (!coverPreview) return;
    return () => URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const mutation = useMutation({
    mutationFn: async (values: RanchFormValues) => {
      if (!profile) throw new Error("Not signed in");
      const ranchId = ranch ? ranch.id : await createRanch(profile.orgId, values);
      if (ranch) await updateRanch(ranch.id, values);
      if (coverFile) await uploadRanchCover(profile.orgId, ranchId, coverFile);
      return ranchId;
    },
    onSuccess: () => {
      if (profile) void queryClient.invalidateQueries({ queryKey: queryKeys.ranches.statsList(profile.orgId) });
      void queryClient.invalidateQueries({ queryKey: ["ranches"] });
      if (ranch) void queryClient.invalidateQueries({ queryKey: queryKeys.ranches.detail(ranch.id) });
      toast.success(ranch ? "Ranch updated" : "Ranch created");
      handleClose(false);
    },
    onError: (error) => {
      toast.error(ranch ? "Couldn't update ranch" : "Couldn't create ranch", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) {
      reset();
      setCoverFile(null);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => mutation.mutate(values));
  const displayedCover = coverPreview ?? existingCoverUrl;

  return (
    <RecordDrawer
      open={open}
      onOpenChange={handleClose}
      title={ranch ? `Edit ${ranch.name}` : "Create a ranch"}
      description={ranch ? undefined : "Every animal belongs to a ranch — add its name and location to get started."}
      isDirty={isDirty || !!coverFile}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
          {displayedCover ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="block aspect-video w-full overflow-hidden rounded-card border border-line"
            >
              <img src={displayedCover} alt="" className="size-full object-cover" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-line bg-secondary/40 text-muted-foreground hover:border-primary/40"
            >
              <ImagePlus className="size-5" aria-hidden />
              <span className="text-13">Add a cover image</span>
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranch-name">Ranch name</Label>
          <Input id="ranch-name" {...register("name")} />
          {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranch-location">Location</Label>
          <Input id="ranch-location" {...register("location")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranch-description">Description</Label>
          <Textarea id="ranch-description" rows={2} {...register("description")} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ranch-size">Size (acres)</Label>
            <Input id="ranch-size" type="number" min={0} step="0.1" {...register("sizeAcres")} />
            {errors.sizeAcres ? <p className="text-13 text-status-critical">{errors.sizeAcres.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranch-contact-name">Contact name</Label>
          <Input id="ranch-contact-name" {...register("contactName")} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ranch-contact-phone">Contact phone</Label>
            <Input id="ranch-contact-phone" {...register("contactPhone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ranch-contact-email">Contact email</Label>
            <Input id="ranch-contact-email" type="email" {...register("contactEmail")} />
            {errors.contactEmail ? <p className="text-13 text-status-critical">{errors.contactEmail.message}</p> : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ranch-notes">Notes</Label>
          <Textarea id="ranch-notes" rows={2} {...register("notes")} />
        </div>

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? "Saving…" : ranch ? "Save changes" : "Create ranch"}
        </Button>
      </form>
    </RecordDrawer>
  );
}
