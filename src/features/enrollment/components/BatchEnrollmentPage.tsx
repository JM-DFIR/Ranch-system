import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Folder, ImagePlus, Tag as TagIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { compressAnimalPhoto } from "@/lib/media";
import { enqueueAttachPhoto, enqueueCreateAnimal, isTagNumberTaken } from "@/lib/offline/queue";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchActiveStatusId, suggestNextTag } from "../api";
import { orderPhotosByExif, type OrderedPhoto } from "../orderPhotosByExif";

interface BatchPhoto extends OrderedPhoto {
  id: string;
  previewUrl: string;
  savedTag: string | null;
}

interface RanchOption {
  id: string;
  name: string;
}

interface BatchEnrollmentPageProps {
  ranch: RanchOption;
}

// Desktop-sized, keyboard-first — a different capture surface over the
// exact same underlying flow as live Enrollment Mode (session-pack.md,
// Session 5b): same lib/media compression, same create_animal /
// attach_photo queue operations, same duplicate-tag check. Only the
// four identity fields shown (tag, species, sex, save) — no "add more
// detail," keeping tab order to exactly tag → species → sex → save.
export function BatchEnrollmentPage({ ranch }: BatchEnrollmentPageProps) {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const { data: activeStatusId } = useQuery({
    queryKey: ["enrollment", "active-status", orgId] as const,
    queryFn: () => fetchActiveStatusId(orgId ?? ""),
    enabled: !!orgId,
    staleTime: Infinity,
  });
  const { data: filterOptions } = useAnimalFilterOptions(orgId);

  const [photos, setPhotos] = useState<BatchPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tagNumber, setTagNumber] = useState("");
  const [speciesId, setSpeciesId] = useState<string | undefined>(undefined);
  const [sex, setSex] = useState<"male" | "female" | "unknown">("unknown");
  const [saving, setSaving] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const debouncedTag = useDebouncedValue(tagNumber, 400);
  const [rawTagWarning, setTagWarning] = useState<string | null>(null);
  const tagWarning = debouncedTag.trim() ? rawTagWarning : null;

  const selected = photos.find((p) => p.id === selectedId) ?? null;

  const loadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoadingPhotos(true);
    try {
      const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      const ordered = await orderPhotosByExif(imageFiles);
      const next: BatchPhoto[] = ordered.map((o, i) => ({
        ...o,
        id: `${Date.now()}-${i}`,
        previewUrl: URL.createObjectURL(o.file),
        savedTag: null,
      }));
      setPhotos(next);
      setSelectedId(next[0]?.id ?? null);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const selectPhoto = (id: string) => {
    setSelectedId(id);
    setTagNumber("");
    setTagWarning(null);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  };

  const handleSpeciesChange = (id: string) => {
    setSpeciesId(id);
    if (!orgId) return;
    const species = filterOptions?.species.find((s) => s.id === id);
    if (!species?.defaultTagPrefix) return;
    void suggestNextTag(orgId, species.defaultTagPrefix).then(setTagNumber);
  };

  const advanceToNextUnsaved = (afterId: string) => {
    const index = photos.findIndex((p) => p.id === afterId);
    const next = photos.slice(index + 1).find((p) => !p.savedTag) ?? photos.find((p) => !p.savedTag);
    if (next) selectPhoto(next.id);
    else setSelectedId(null);
  };

  const handleSave = async () => {
    if (!profile || !activeStatusId || !selected || !speciesId || !tagNumber.trim() || tagWarning) return;
    setSaving(true);
    try {
      const animalId = await enqueueCreateAnimal({
        tagNumber: tagNumber.trim(),
        orgId: profile.orgId,
        ranchId: ranch.id,
        statusId: activeStatusId,
        createdBy: profile.id,
        speciesId,
        sex,
      });
      const { photo, thumbnail } = await compressAnimalPhoto(selected.file);
      await enqueueAttachPhoto({ animalId, orgId: profile.orgId, photo, thumbnail, createdBy: profile.id });

      const savedTag = tagNumber.trim();
      setPhotos((prev) => prev.map((p) => (p.id === selected.id ? { ...p, savedTag } : p)));
      toast.success(`${savedTag} saved — syncing when back online`);
      advanceToNextUnsaved(selected.id);
    } catch (error) {
      toast.error("Couldn't save this animal locally", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  // Duplicate check, debounced — same first line of defence as live mode
  // (EnrollmentScreen.tsx), against the same local-queue-then-server
  // check (isTagNumberTaken).
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

  const savedCount = photos.filter((p) => p.savedTag).length;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Batch Enrollment"
        description={`${ranch.name} · ${photos.length > 0 ? `${savedCount} of ${photos.length} saved` : "Upload photos taken earlier to work through them here."}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/enroll/tags" className="text-13 text-muted-foreground hover:text-foreground">
              Tag Range Generator
            </Link>
            <input
              ref={filesInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void loadFiles(e.target.files)}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error -- webkitdirectory is a real, widely supported attribute with no React/DOM types
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={(e) => void loadFiles(e.target.files)}
            />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => filesInputRef.current?.click()}>
              <ImagePlus className="size-3.5" aria-hidden />
              Choose photos
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => folderInputRef.current?.click()}>
              <Folder className="size-3.5" aria-hidden />
              Choose folder
            </Button>
          </div>
        }
      />

      {photos.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No photos loaded"
          description="Choose a folder or select the photos you took earlier — they'll line up here by capture time, ready to work through."
          action={{ label: "Choose photos", onClick: () => filesInputRef.current?.click() }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPhoto(p.id)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-card border-2 transition-colors",
                  p.id === selectedId ? "border-primary" : "border-transparent hover:border-line",
                )}
              >
                <img src={p.previewUrl} alt="" className="size-full object-cover" />
                {p.savedTag ? (
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-status-ok/90 px-1.5 py-1 text-11 font-medium text-white">
                    <Check className="size-3" aria-hidden />
                    {p.savedTag}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="h-fit rounded-card border border-line bg-card p-4">
            {selected ? (
              <div className="space-y-4">
                <img src={selected.previewUrl} alt="" className="aspect-square w-full rounded-card object-cover" />

                <div className="space-y-1.5">
                  <Label htmlFor="batch-tag">Tag number</Label>
                  <Input
                    ref={tagInputRef}
                    id="batch-tag"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    className="font-mono tabular-nums"
                    autoComplete="off"
                  />
                  {tagWarning ? <p className="text-13 text-status-warn">{tagWarning}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batch-species">Species</Label>
                  <select
                    id="batch-species"
                    value={speciesId ?? ""}
                    onChange={(e) => handleSpeciesChange(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-14"
                  >
                    <option value="" disabled>
                      Choose species
                    </option>
                    {(filterOptions?.species ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batch-sex">Sex</Label>
                  <select
                    id="batch-sex"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as "male" | "female" | "unknown")}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-14"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <Button
                  className="w-full gap-1.5"
                  onClick={() => void handleSave()}
                  disabled={saving || !tagNumber.trim() || !speciesId || !!tagWarning}
                >
                  <TagIcon className="size-3.5" aria-hidden />
                  {saving ? "Saving…" : "Save & next"}
                </Button>
              </div>
            ) : (
              <p className="text-13 text-muted-foreground">
                {loadingPhotos ? "Reading photos…" : "All photos in this batch are saved."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
