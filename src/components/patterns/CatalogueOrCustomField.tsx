import { Combobox, type ComboboxOption } from "@/components/patterns/Combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CatalogueOrCustomValue = { type: "catalogue"; id: string } | { type: "custom"; name: string };

interface CatalogueOrCustomFieldProps {
  label: string;
  value: CatalogueOrCustomValue;
  onChange: (value: CatalogueOrCustomValue) => void;
  options: ComboboxOption[];
  onCreateNew: (name: string) => void;
  createNewLabel?: (name: string) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
}

// Backs any field shaped like treatments.medication_id/custom_medication
// or illnesses.illness_type_id/custom_name — a catalogue entry (with
// the vaccine field's own inline "add new" affordance) OR true free
// text that's never saved to the org-wide catalogue, because the
// schema deliberately kept both columns rather than forcing every
// medication/illness name into the reusable list (session-pack.md
// Session 8). One shared field for both rather than two near-identical
// forks.
export function CatalogueOrCustomField({
  label,
  value,
  onChange,
  options,
  onCreateNew,
  createNewLabel,
  placeholder,
  searchPlaceholder,
  error,
}: CatalogueOrCustomFieldProps) {
  const isCustom = value.type === "custom";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <button
          type="button"
          className="text-12 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => onChange(isCustom ? { type: "catalogue", id: "" } : { type: "custom", name: "" })}
        >
          {isCustom ? "Choose from the list instead" : "Enter without saving to the list"}
        </button>
      </div>
      {isCustom ? (
        <Input
          value={value.name}
          onChange={(e) => onChange({ type: "custom", name: e.target.value })}
          placeholder={placeholder}
        />
      ) : (
        <Combobox
          options={options}
          value={value.id || undefined}
          onChange={(v) => onChange({ type: "catalogue", id: v ?? "" })}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          onCreateNew={onCreateNew}
          createNewLabel={createNewLabel}
        />
      )}
      {error ? <p className="text-13 text-status-critical">{error}</p> : null}
    </div>
  );
}
