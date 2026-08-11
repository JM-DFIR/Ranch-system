import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { compressAnimalPhoto } from "@/lib/media";
import { enqueueAttachPhoto, enqueueCreateAnimal } from "@/lib/offline/queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActiveStatusId } from "../api";

interface EnrollmentScreenProps {
  ranchId: string;
}

type Step = "camera" | "identity";

// The deliberately smallest possible slice (session-pack.md, Session
// 5a) — photo, tag number, save, back to camera. No auto-increment, no
// species/sex, no "add more detail," no progress strip, no session
// summary; all of that is Session 5b, built on top of this only after
// this thin slice is field-tested for real against dropped signal.
export function EnrollmentScreen({ ranchId }: EnrollmentScreenProps) {
  const { profile } = useAuth();
  const { data: activeStatusId, isLoading: statusLoading } = useQuery({
    queryKey: ["enrollment", "active-status", profile?.orgId] as const,
    queryFn: () => fetchActiveStatusId(profile?.orgId ?? ""),
    enabled: !!profile?.orgId,
    staleTime: Infinity,
  });

  const [step, setStep] = useState<Step>("camera");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [tagNumber, setTagNumber] = useState("");
  const [saving, setSaving] = useState(false);
  // Set once enqueueCreateAnimal actually succeeds, so a retry after a
  // failed photo step doesn't re-run it and queue a second, duplicate
  // create_animal entry for the same physical animal (which would
  // surface as a false tag-number conflict once both synced).
  const [queuedAnimalId, setQueuedAnimalId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelected = (file: File) => {
    setCapturedFile(file);
    setCapturedPreviewUrl(URL.createObjectURL(file));
    setStep("identity");
    // Focus happens next tick, once the tag input has actually mounted.
    setTimeout(() => tagInputRef.current?.focus(), 0);
  };

  const resetToCamera = () => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedFile(null);
    setCapturedPreviewUrl(null);
    setTagNumber("");
    setQueuedAnimalId(null);
    setStep("camera");
  };

  const handleSave = async () => {
    if (!profile || !activeStatusId || !capturedFile || !tagNumber.trim()) return;
    setSaving(true);
    try {
      const animalId =
        queuedAnimalId ??
        (await enqueueCreateAnimal({
          tagNumber: tagNumber.trim(),
          orgId: profile.orgId,
          ranchId,
          statusId: activeStatusId,
          createdBy: profile.id,
        }));
      if (!queuedAnimalId) setQueuedAnimalId(animalId);

      // Compression happens after the record is queued, not before —
      // the tag number save should never wait on it, and a slow/failed
      // compression must not lose the identity data already captured.
      const { photo, thumbnail } = await compressAnimalPhoto(capturedFile);
      await enqueueAttachPhoto({ animalId, orgId: profile.orgId, photo, thumbnail, createdBy: profile.id });

      toast.success(`${tagNumber.trim()} saved — syncing when back online`);
      resetToCamera();
    } catch (error) {
      toast.error("Couldn't save this animal locally", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-64 w-full max-w-sm" />
      </div>
    );
  }

  if (!activeStatusId) {
    return (
      <div className="mx-auto max-w-sm rounded-card border border-status-critical/25 bg-status-critical/10 p-4 text-center text-14 text-status-critical">
        No "Active" status is configured for this organisation — enrollment needs one to exist before it can save
        animals. This needs a connection to load once; it isn't fetched again after that.
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col items-center justify-center gap-6 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoSelected(file);
          e.target.value = "";
        }}
      />

      {step === "camera" ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-40 items-center justify-center rounded-full border-4 border-primary bg-primary/10 text-primary transition-colors hover:bg-primary/20 active:scale-95"
          aria-label="Take photo"
        >
          <Camera className="size-14" aria-hidden />
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          {capturedPreviewUrl ? (
            <img
              src={capturedPreviewUrl}
              alt="Captured animal"
              className="aspect-square w-full max-w-56 rounded-card border border-line object-cover"
            />
          ) : null}

          <div className="w-full space-y-1.5">
            <label htmlFor="enroll-tag-number" className="text-13 font-medium text-foreground">
              Tag number
            </label>
            <Input
              ref={tagInputRef}
              id="enroll-tag-number"
              value={tagNumber}
              onChange={(e) => setTagNumber(e.target.value)}
              placeholder="e.g. MUX 118"
              className="font-mono text-20 tabular-nums"
              autoComplete="off"
              inputMode="text"
            />
          </div>

          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={resetToCamera} disabled={saving}>
              <RotateCcw className="size-4" aria-hidden />
              Retake
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={() => void handleSave()}
              disabled={saving || !tagNumber.trim()}
            >
              <Check className="size-4" aria-hidden />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
