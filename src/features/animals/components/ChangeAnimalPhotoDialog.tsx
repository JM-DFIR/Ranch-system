import { useRef, useState } from "react";
import { Camera, PawPrint, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { compressAnimalPhoto } from "@/lib/media";
import { enqueueAttachPhoto } from "@/lib/offline/queue";
import { drainQueue } from "@/lib/offline/sync";
import { offlineDb } from "@/lib/offline/db";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAnimalPhotoUrl } from "../hooks";
import { removeAnimalPhoto } from "../api";
import type { AnimalProfile } from "../api";

interface ChangeAnimalPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: AnimalProfile;
}

// attach_photo is one of the five offline-queued operations (CLAUDE.md
// §8) regardless of caller — "one pipeline, two callers" (Enrollment
// Mode, Batch Enrollment) becomes three here, reusing the exact same
// compress → enqueue → sync path rather than a bespoke direct upload.
// The difference from those two callers: this one is opened from a
// profile the user is already looking at, live, so it drains the queue
// immediately after enqueueing and waits to report real success —
// Enrollment Mode's own UI is fire-and-forget by design (you're moving
// on to the next animal), this one isn't. Removal isn't a queued
// operation (there's no "detach_photo" op) — it's a plain field clear,
// same shape as every other Edit field.
export function ChangeAnimalPhotoDialog({ open, onOpenChange, animal }: ChangeAnimalPhotoDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: photoUrl } = useAnimalPhotoUrl(animal.photoPath);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animal.id) });
    if (profile?.orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all(profile.orgId) });
  };

  const handleFile = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    try {
      const { photo, thumbnail } = await compressAnimalPhoto(file);
      const entryId = await enqueueAttachPhoto({ animalId: animal.id, orgId: profile.orgId, photo, thumbnail, createdBy: profile.id });
      await drainQueue();
      const entry = await offlineDb.writeQueue.get(entryId);
      if (entry?.status === "synced") {
        invalidate();
        toast.success("Photo updated");
        onOpenChange(false);
      } else if (entry?.status === "failed" || entry?.status === "conflict") {
        toast.error("Couldn't upload the photo", { description: entry.lastError });
      } else {
        // Genuinely offline — the entry is still queued and the sync
        // worker (useSyncWorker.ts) will pick it up once connectivity
        // returns, same as any other queued write.
        toast.info("Photo saved — uploading once you're back online");
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Couldn't process that photo", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setUploading(false);
    }
  };

  const removeMutation = useMutation({
    mutationFn: () => removeAnimalPhoto(animal.id),
    onSuccess: () => {
      invalidate();
      toast.success("Photo removed");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Couldn't remove the photo", { description: error instanceof Error ? error.message : undefined });
    },
  });

  const busy = uploading || removeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{animal.photoPath ? "Change photo" : "Add a photo"}</DialogTitle>
          <DialogDescription>For {animal.tagNumber}. Opens your camera on a phone, or pick a file on desktop.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div className="flex size-32 items-center justify-center overflow-hidden rounded-card border border-line bg-muted text-muted-foreground">
            {photoUrl ? <img src={photoUrl} alt="" className="size-full object-cover" /> : <PawPrint className="size-10" aria-hidden />}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {animal.photoPath ? (
            <Button
              variant="outline"
              className="gap-1.5 text-status-critical hover:text-status-critical"
              onClick={() => removeMutation.mutate()}
              disabled={busy}
            >
              <Trash2 className="size-3.5" aria-hidden />
              {removeMutation.isPending ? "Removing…" : "Remove photo"}
            </Button>
          ) : null}
          <Button className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            <Camera className="size-3.5" aria-hidden />
            {uploading ? "Saving…" : animal.photoPath ? "Choose new photo" : "Choose photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
