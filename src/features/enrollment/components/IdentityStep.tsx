import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnimalFilterOptions } from "@/features/animals/api";

export interface MoreDetail {
  breedId?: string;
  color?: string;
  dateOfBirth?: string;
  dobIsEstimated: boolean;
  sectionId?: string;
  notes?: string;
}

interface IdentityStepProps {
  previewUrl: string | null;
  onRetakePhoto: () => void;
  filterOptions: AnimalFilterOptions | undefined;
  tagNumber: string;
  onTagNumberChange: (value: string) => void;
  tagWarning: string | null;
  speciesId: string | undefined;
  onSpeciesChange: (id: string) => void;
  sex: "male" | "female" | "unknown";
  onSexChange: (sex: "male" | "female" | "unknown") => void;
  moreDetail: MoreDetail;
  onMoreDetailChange: (detail: MoreDetail) => void;
  onSave: () => void;
  saving: boolean;
}

// Radix Select.Item rejects an empty-string value, so "nothing chosen"
// needs its own sentinel — same pattern as FilterBar.tsx's facet selects.
const UNSET = "__unset__";

const SEX_OPTIONS: { value: "male" | "female" | "unknown"; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "unknown", label: "Unknown" },
];

// Step 2 of live Enrollment Mode (session-pack.md, Session 5b): tag,
// species, sex are the only required fields, all three large enough to
// use one-handed, standing up. Everything else collapses behind "Add
// more detail" — breed, colour, DOB, section, notes. Dam/sire are
// deliberately not here: linking to an *existing* animal needs a real
// search-and-select against possibly-uncached data, which doesn't work
// offline — building a text field that silently didn't wire up would
// be worse than not having it yet.
export function IdentityStep({
  previewUrl,
  onRetakePhoto,
  filterOptions,
  tagNumber,
  onTagNumberChange,
  tagWarning,
  speciesId,
  onSpeciesChange,
  sex,
  onSexChange,
  moreDetail,
  onMoreDetailChange,
  onSave,
  saving,
}: IdentityStepProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const breedOptions = (filterOptions?.breeds ?? []).filter((b) => !speciesId || b.speciesId === speciesId);

  const canSave = tagNumber.trim().length > 0 && !!speciesId;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 p-4 pb-8">
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Captured animal" className="aspect-square w-full rounded-card border border-line object-cover" />
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-2 bottom-2 gap-1.5 shadow-md"
            onClick={onRetakePhoto}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Retake
          </Button>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="enroll-tag-number">Tag number</Label>
        <Input
          id="enroll-tag-number"
          value={tagNumber}
          onChange={(e) => onTagNumberChange(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. MUX 118"
          className="font-mono text-20 tabular-nums"
          autoComplete="off"
        />
        {tagWarning ? <p className="text-13 text-status-warn">{tagWarning}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label>Species</Label>
        <div className="grid grid-cols-2 gap-2">
          {(filterOptions?.species ?? []).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSpeciesChange(s.id)}
              className={cn(
                "rounded-card border px-3 py-4 text-15 font-medium transition-colors",
                speciesId === s.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-line bg-card text-foreground hover:border-primary/50",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Sex</Label>
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSexChange(opt.value)}
              className={cn(
                "rounded-card border px-2 py-4 text-14 font-medium transition-colors",
                sex === opt.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-line bg-card text-foreground hover:border-primary/50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDetailOpen((o) => !o)}
        className="flex items-center justify-between rounded-card border border-line bg-card px-3 py-2.5 text-14 font-medium text-foreground"
        aria-expanded={detailOpen}
      >
        Add more detail
        {detailOpen ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
      </button>

      {detailOpen ? (
        <div className="space-y-4 rounded-card border border-line bg-secondary/40 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="enroll-breed">Breed</Label>
            <Select
              value={moreDetail.breedId ?? UNSET}
              onValueChange={(v) => onMoreDetailChange({ ...moreDetail, breedId: v === UNSET ? undefined : v })}
            >
              <SelectTrigger id="enroll-breed" className="w-full">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Not set</SelectItem>
                {breedOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-color">Colour</Label>
            <Input
              id="enroll-color"
              value={moreDetail.color ?? ""}
              onChange={(e) => onMoreDetailChange({ ...moreDetail, color: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-dob">Date of birth</Label>
            <Input
              id="enroll-dob"
              type="date"
              value={moreDetail.dateOfBirth ?? ""}
              onChange={(e) => onMoreDetailChange({ ...moreDetail, dateOfBirth: e.target.value || undefined })}
              max={new Date().toISOString().slice(0, 10)}
            />
            <label className="flex items-center gap-2 pt-1 text-13 text-muted-foreground">
              <Checkbox
                checked={moreDetail.dobIsEstimated}
                onCheckedChange={(checked) => onMoreDetailChange({ ...moreDetail, dobIsEstimated: !!checked })}
              />
              Estimated
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-section">Section</Label>
            <Select
              value={moreDetail.sectionId ?? UNSET}
              onValueChange={(v) => onMoreDetailChange({ ...moreDetail, sectionId: v === UNSET ? undefined : v })}
            >
              <SelectTrigger id="enroll-section" className="w-full">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Not set</SelectItem>
                {(filterOptions?.sections ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-notes">Notes</Label>
            <Textarea
              id="enroll-notes"
              value={moreDetail.notes ?? ""}
              onChange={(e) => onMoreDetailChange({ ...moreDetail, notes: e.target.value || undefined })}
            />
          </div>
        </div>
      ) : null}

      <Button size="lg" className="w-full" onClick={onSave} disabled={!canSave || saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
