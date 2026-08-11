import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { compressAnimalPhoto } from "@/lib/media";
import { enqueueAttachPhoto, enqueueCreateAnimal, isTagNumberTaken } from "@/lib/offline/queue";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActiveStatusId, suggestNextTag } from "../api";
import { useEnrollmentProgress } from "../useEnrollmentProgress";
import { useRememberedChoice } from "../useRememberedChoice";
import { PhotoStep } from "./PhotoStep";
import { IdentityStep, type MoreDetail } from "./IdentityStep";
import { SessionSummary, type SessionEnrollment } from "./SessionSummary";

interface EnrollmentScreenProps {
  ranchId: string;
}

type Step = "camera" | "identity" | "summary";

const EMPTY_DETAIL: MoreDetail = { dobIsEstimated: false };

// Live Enrollment Mode's full flow (session-pack.md, Session 5b), on
// top of 5a's field-tested infrastructure: photo → identity (tag,
// species, sex, optional detail) → save → straight back to the
// camera. See PhotoStep/IdentityStep/SessionSummary for the three
// screens this orchestrates.
export function EnrollmentScreen({ ranchId }: EnrollmentScreenProps) {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const { data: activeStatusId, isLoading: statusLoading } = useQuery({
    queryKey: ["enrollment", "active-status", orgId] as const,
    queryFn: () => fetchActiveStatusId(orgId ?? ""),
    enabled: !!orgId,
    staleTime: Infinity,
  });
  const { data: filterOptions } = useAnimalFilterOptions(orgId);
  const progress = useEnrollmentProgress();

  const [step, setStep] = useState<Step>("camera");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [tagNumber, setTagNumber] = useState("");
  const [tagTouched, setTagTouched] = useState(false);
  const [speciesId, setSpeciesId] = useRememberedChoice(profile?.id, "species");
  // useRememberedChoice is generically string | undefined — narrowed
  // once here rather than at each use site, since it's only ever
  // written to via onSexChange below, which is typed to the closed set.
  const [rememberedSex, setSex] = useRememberedChoice(profile?.id, "sex");
  const sex = (rememberedSex as "male" | "female" | "unknown" | undefined) ?? "unknown";
  const [moreDetail, setMoreDetail] = useState<MoreDetail>(EMPTY_DETAIL);
  const [saving, setSaving] = useState(false);
  const [queuedAnimalId, setQueuedAnimalId] = useState<string | null>(null);
  const [sessionEnrollments, setSessionEnrollments] = useState<SessionEnrollment[]>([]);

  const debouncedTag = useDebouncedValue(tagNumber, 400);
  const [rawTagWarning, setTagWarning] = useState<string | null>(null);
  // Only meaningful for the tag it was actually checked against — once
  // the field is cleared there's nothing to warn about, derived here
  // rather than cleared via a synchronous setState in the effect below.
  const tagWarning = debouncedTag.trim() ? rawTagWarning : null;

  // Re-suggests whenever species changes, as long as the field hasn't
  // been hand-edited — never overwrites something the user actually typed.
  useEffect(() => {
    if (tagTouched || !orgId || !speciesId) return;
    const species = filterOptions?.species.find((s) => s.id === speciesId);
    const prefix = species?.defaultTagPrefix;
    if (!prefix) return;
    void suggestNextTag(orgId, prefix).then((suggested) => {
      if (!tagTouched) setTagNumber(suggested);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesId, orgId]);

  useEffect(() => {
    if (!orgId || !debouncedTag.trim()) return;
    let cancelled = false;
    void isTagNumberTaken(orgId, debouncedTag).then((taken) => {
      if (!cancelled) setTagWarning(taken ? `Tag ${debouncedTag.trim()} is already in use.` : null);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, debouncedTag]);

  const handlePhotoCaptured = (file: File) => {
    setCapturedFile(file);
    setCapturedPreviewUrl(URL.createObjectURL(file));
    setStep("identity");
  };

  const handleSkipPhoto = () => {
    setCapturedFile(null);
    setCapturedPreviewUrl(null);
    setStep("identity");
  };

  const resetForNextAnimal = () => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedFile(null);
    setCapturedPreviewUrl(null);
    setTagNumber("");
    setTagTouched(false);
    setMoreDetail(EMPTY_DETAIL);
    setQueuedAnimalId(null);
    setSaving(false);
    setStep("camera");
  };

  const handleSave = async () => {
    if (!profile || !activeStatusId || !speciesId || !tagNumber.trim() || tagWarning) return;
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
          speciesId,
          sex,
          breedId: moreDetail.breedId,
          color: moreDetail.color,
          dateOfBirth: moreDetail.dateOfBirth,
          dobIsEstimated: moreDetail.dobIsEstimated,
          sectionId: moreDetail.sectionId,
          notes: moreDetail.notes,
        }));
      if (!queuedAnimalId) setQueuedAnimalId(animalId);

      let thumbnailPreview = capturedPreviewUrl;
      if (capturedFile) {
        const { photo, thumbnail } = await compressAnimalPhoto(capturedFile);
        await enqueueAttachPhoto({ animalId, orgId: profile.orgId, photo, thumbnail, createdBy: profile.id });
        thumbnailPreview = URL.createObjectURL(thumbnail);
      }

      setSessionEnrollments((prev) => [...prev, { tagNumber: tagNumber.trim(), previewUrl: thumbnailPreview }]);
      toast.success(`${tagNumber.trim()} saved — syncing when back online`);

      // 600ms confirmation, then straight back to the camera — never a
      // full page reload (session-pack.md, Session 5b). `saving` stays
      // true for that whole window (resetForNextAnimal is what clears
      // it), so a double-tap on Save during the confirmation can't
      // queue a second, duplicate attach_photo for the same animal.
      setTimeout(resetForNextAnimal, 600);
    } catch (error) {
      toast.error("Couldn't save this animal locally", {
        description: error instanceof Error ? error.message : undefined,
      });
      setSaving(false);
    }
  };

  if (step === "summary") {
    return <SessionSummary enrollments={sessionEnrollments} onContinue={() => setStep("camera")} />;
  }

  if (statusLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Skeleton className="h-64 w-full max-w-sm" />
      </div>
    );
  }

  if (!activeStatusId) {
    return (
      <div className="mx-auto max-w-sm p-4 text-center text-14 text-status-critical">
        No "Active" status is configured for this organisation — enrollment needs a connection to load this once.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <Button variant="ghost" size="icon-sm" aria-label="Exit enrollment" onClick={() => setStep("summary")}>
          <X className="size-4" aria-hidden />
        </Button>
        <p className="text-12 text-muted-foreground">
          {progress.recordedToday} {progress.recordedToday === 1 ? "animal" : "animals"} recorded today
          {progress.waitingToSync > 0 ? ` · ${progress.waitingToSync} waiting to sync` : ""}
        </p>
      </div>

      {step === "camera" ? (
        <PhotoStep onCaptured={handlePhotoCaptured} onSkip={handleSkipPhoto} />
      ) : (
        <IdentityStep
          previewUrl={capturedPreviewUrl}
          onRetakePhoto={() => setStep("camera")}
          filterOptions={filterOptions}
          tagNumber={tagNumber}
          onTagNumberChange={(v) => {
            setTagNumber(v);
            setTagTouched(true);
          }}
          tagWarning={tagWarning}
          speciesId={speciesId}
          onSpeciesChange={setSpeciesId}
          sex={sex}
          onSexChange={setSex}
          moreDetail={moreDetail}
          onMoreDetailChange={setMoreDetail}
          onSave={() => void handleSave()}
          saving={saving}
        />
      )}
    </div>
  );
}
