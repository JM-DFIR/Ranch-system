import { useAuth } from "@/lib/auth";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { DateRangeFilter } from "@/components/patterns/DateRangeFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportSearch } from "../schema";

const ALL_SPECIES = "__all__";

interface ReportFiltersProps {
  search: ReportSearch;
  onChange: (patch: Partial<ReportSearch>) => void;
  showSpecies: boolean;
  showDateRange: boolean;
}

// Species and date range, shown only where the report kind actually
// supports them (ReportViewer.tsx decides per report) — ranch is
// already global via `_authenticated`'s switcher, not repeated here.
// Two stacked bars rather than one combined row: DateRangeFilter is
// already a complete bordered bar on its own (shared with every other
// register), and splitting the species control out avoids fighting
// that component's own layout.
export function ReportFilters({ search, onChange, showSpecies, showDateRange }: ReportFiltersProps) {
  const { profile } = useAuth();
  const { data: options } = useAnimalFilterOptions(profile?.orgId);

  if (!showSpecies && !showDateRange) return null;

  return (
    <>
      {showSpecies ? (
        <div className="flex items-center gap-2 border-b border-line bg-card px-4 py-3">
          <Select value={search.species ?? ALL_SPECIES} onValueChange={(v) => onChange({ species: v === ALL_SPECIES ? undefined : v })}>
            <SelectTrigger size="sm" className="min-w-36" aria-label="Species">
              <SelectValue placeholder="All species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SPECIES}>All species</SelectItem>
              {(options?.species ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {showDateRange ? <DateRangeFilter dateFrom={search.dateFrom} dateTo={search.dateTo} onChange={(range) => onChange(range)} /> : null}
    </>
  );
}
