import { Combobox } from "@/components/patterns/Combobox";
import { MultiCombobox } from "@/components/patterns/MultiCombobox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { emptyToUndefined } from "@/lib/utils";

export type ScopeValue = { type: "ranch"; ranchId: string; sectionId?: string } | { type: "animal"; animalIds: string[] };

interface ScopeFieldProps {
  value: ScopeValue;
  onChange: (value: ScopeValue) => void;
  ranches: { id: string; name: string }[];
  sections: { id: string; name: string; ranchId: string }[];
  searchableAnimals: { id: string; tagNumber: string }[];
  error?: string;
}

// Shared by Record Feeding and Record Care Activity (M5) — the one
// place in the product where "ranch-wide or a specific animal" is a
// real, everyday choice rather than an edge case (feeding_records/
// care_activities' own "exactly one scope" CHECK, 0011_feeding_care.sql).
// Free-choice only: when a drawer opens with preselected animals (from
// a profile or the register's bulk bar), it locks to the animal scope
// itself and never renders this field at all.
export function ScopeField({ value, onChange, ranches, sections, searchableAnimals, error }: ScopeFieldProps) {
  const sectionOptions = value.type === "ranch" ? sections.filter((s) => s.ranchId === value.ranchId) : [];

  return (
    <div className="space-y-1.5">
      <Label>Where</Label>
      <div className="mb-1.5 flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={value.type === "ranch" ? "secondary" : "outline"}
          onClick={() => onChange({ type: "ranch", ranchId: "" })}
        >
          Ranch-wide
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value.type === "animal" ? "secondary" : "outline"}
          onClick={() => onChange({ type: "animal", animalIds: [] })}
        >
          Specific animals
        </Button>
      </div>
      {value.type === "ranch" ? (
        <div className="flex flex-col gap-2">
          <Combobox
            options={ranches.map((r) => ({ value: r.id, label: r.name }))}
            value={emptyToUndefined(value.ranchId)}
            onChange={(v) => onChange({ type: "ranch", ranchId: v ?? "" })}
            placeholder="Choose a ranch…"
            searchPlaceholder="Search ranches…"
          />
          {value.ranchId && sectionOptions.length > 0 ? (
            <Combobox
              options={sectionOptions.map((s) => ({ value: s.id, label: s.name }))}
              value={emptyToUndefined(value.sectionId)}
              onChange={(v) => onChange({ ...value, sectionId: v ?? "" })}
              placeholder="No specific section"
              searchPlaceholder="Search sections…"
            />
          ) : null}
        </div>
      ) : (
        <MultiCombobox
          options={searchableAnimals.map((a) => ({ value: a.id, label: a.tagNumber }))}
          value={value.animalIds}
          onChange={(animalIds) => onChange({ type: "animal", animalIds })}
          placeholder="Search by tag number…"
          searchPlaceholder="Search animals…"
        />
      )}
      {error ? <p className="text-13 text-status-critical">{error}</p> : null}
    </div>
  );
}
