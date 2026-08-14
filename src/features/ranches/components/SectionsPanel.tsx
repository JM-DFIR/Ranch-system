import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createRanchSection, softDeleteRanchSection, updateRanchSection, type RanchSectionRecord } from "../api";
import { useRanchSections } from "../hooks";
import { ranchSectionFormSchema, type RanchSectionFormValues } from "../schema";

interface SectionsPanelProps {
  ranchId: string;
}

// Manage Sections (blueprint.md §4.1) — paddocks, sheds, the PRD's
// "internal locations." Manager-writable, not owner-only
// (ranch_sections_insert/update, 0014_rls.sql: "organising sections
// within a ranch you already manage is operational, not structural") —
// unlike Create/Edit Ranch, this has no isOwner gate.
export function SectionsPanel({ ranchId }: SectionsPanelProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: sections, isLoading } = useRanchSections(ranchId);
  const [editing, setEditing] = useState<RanchSectionRecord | "new" | null>(null);
  const [toRemove, setToRemove] = useState<RanchSectionRecord | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RanchSectionFormValues>({
    resolver: zodResolver(ranchSectionFormSchema),
    values: editing && editing !== "new" ? { name: editing.name, description: editing.description ?? "" } : { name: "", description: "" },
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.ranches.sections(ranchId) });

  const saveMutation = useMutation({
    mutationFn: async (values: RanchSectionFormValues) => {
      if (!profile) throw new Error("Not signed in");
      if (editing && editing !== "new") {
        await updateRanchSection(editing.id, values);
      } else {
        await createRanchSection(profile.orgId, ranchId, values);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing !== "new" ? "Section updated" : "Section added");
      setEditing(null);
      reset();
    },
    onError: (error) => toast.error("Couldn't save section", { description: error instanceof Error ? error.message : undefined }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => softDeleteRanchSection(id),
    onSuccess: () => {
      invalidate();
      toast.success("Section removed");
      setToRemove(null);
    },
    onError: (error) => toast.error("Couldn't remove section", { description: error instanceof Error ? error.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => saveMutation.mutate(values));

  const closeEditor = (open: boolean) => {
    if (!open) {
      setEditing(null);
      reset();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-14 font-medium text-foreground">Sections</h2>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="size-3.5" aria-hidden />
          Add section
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : !sections || sections.length === 0 ? (
        <p className="text-13 text-muted-foreground">
          No sections yet — paddocks, sheds or other locations within this ranch.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line">
          {sections.map((section) => (
            <li key={section.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-14 text-foreground">{section.name}</p>
                {section.description ? <p className="truncate text-13 text-muted-foreground">{section.description}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${section.name}`} onClick={() => setEditing(section)}>
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${section.name}`} onClick={() => setToRemove(section)}>
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={closeEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing !== "new" ? "Edit section" : "Add a section"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="section-name">Name</Label>
              <Input id="section-name" {...register("name")} />
              {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section-description">Description</Label>
              <Textarea id="section-description" rows={2} {...register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saveMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editing !== "new" ? "Save changes" : "Add section"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(null)}
        title={`Remove ${toRemove?.name}?`}
        description="Animals in this section keep their record. It just won't be offered for new assignments."
        confirmLabel="Remove"
        destructive
        isConfirming={removeMutation.isPending}
        onConfirm={() => toRemove && removeMutation.mutate(toRemove.id)}
      />
    </div>
  );
}
