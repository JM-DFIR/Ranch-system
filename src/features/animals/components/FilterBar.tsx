import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert, X } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { fetchRanchList } from "@/features/ranches/api";
import { Route as AnimalsRoute } from "@/routes/_authenticated/animals";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnimalFacetCounts, useAnimalFilterOptions } from "../hooks";
import type { AnimalRegisterParams } from "../api";
import { hasActiveAnimalFilters, type AnimalsSearch } from "../schema";

const ALL = "__all__";

const SEX_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "unknown", label: "Unknown" },
];

interface FacetSelectProps {
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { id: string; label: string }[];
  counts: Record<string, number>;
}

// One dropdown shape reused for every id-keyed facet (ranch, species,
// breed, status, section) — a "__all__" sentinel item stands in for
// "no filter" since Radix Select can't carry an empty-string value.
function FacetSelect({ label, placeholder, value, onChange, options, counts }: FacetSelectProps) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger size="sm" aria-label={label} className="min-w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
            {counts[opt.id] !== undefined ? ` (${counts[opt.id]})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Faceted filter row for the register: ranch, species, breed (scoped
// to the chosen species), sex, status, section (scoped to the chosen
// ranch), a date range, and debounced tag/name search — every value
// lives in the URL (this route's search schema, plus `ranch` on the
// parent `_authenticated` route) so a filtered view is a shareable
// link (session-pack.md, Session 3).
export function FilterBar() {
  const { profile } = useAuth();
  const search = AnimalsRoute.useSearch();
  const navigate = AnimalsRoute.useNavigate();
  const { ranch } = AuthenticatedRoute.useSearch();
  const authNavigate = AuthenticatedRoute.useNavigate();

  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  useEffect(() => {
    if (debouncedSearch === (search.search ?? "")) return;
    void navigate({ search: (prev) => ({ ...prev, search: debouncedSearch || undefined, page: 0 }) });
    // Only the debounced value should re-trigger this — re-running on
    // every `search`/`navigate` identity change would fight the URL
    // updates it itself makes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the box in sync if the URL changes from elsewhere (e.g. the
  // "Clear filters" button below, or back/forward navigation) —
  // adjusted during render (React's documented pattern for "reset
  // state when a prop changes") rather than in an effect. Harmless
  // when it's this component's own debounce push echoing back: the
  // value it re-sets to is already what searchInput holds.
  const [prevUrlSearch, setPrevUrlSearch] = useState(search.search);
  if (search.search !== prevUrlSearch) {
    setPrevUrlSearch(search.search);
    setSearchInput(search.search ?? "");
  }

  const orgId = profile?.orgId;
  const params: AnimalRegisterParams = { ...search, ranchId: ranch };

  const { data: ranches = [] } = useQuery({
    queryKey: queryKeys.ranches.list(orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!orgId,
  });
  const { data: options } = useAnimalFilterOptions(orgId);
  const { data: counts } = useAnimalFacetCounts(orgId, params);

  const setFilter = <K extends keyof AnimalsSearch>(key: K, value: AnimalsSearch[K]) => {
    void navigate({ search: (prev) => ({ ...prev, [key]: value, page: 0 }) });
  };

  const speciesOptions = (options?.species ?? []).map((s) => ({ id: s.id, label: s.name }));
  const breedOptions = (options?.breeds ?? [])
    .filter((b) => !search.species || b.speciesId === search.species)
    .map((b) => ({ id: b.id, label: b.name }));
  const statusOptions = (options?.statuses ?? []).map((s) => ({ id: s.id, label: s.name }));
  const sectionOptions = (options?.sections ?? [])
    .filter((s) => !ranch || s.ranchId === ranch)
    .map((s) => ({ id: s.id, label: s.name }));

  const hasActiveFilters = hasActiveAnimalFilters(search, ranch);

  const clearAll = () => {
    setSearchInput("");
    void navigate({ search: {} });
    void authNavigate({ search: (prev) => ({ ...prev, ranch: undefined }) });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-card px-4 py-3">
      <Input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search tag or name…"
        className="h-8 w-48"
        aria-label="Search animals by tag or name"
      />
      <FacetSelect
        label="Ranch"
        placeholder="All ranches"
        value={ranch}
        onChange={(v) => void authNavigate({ search: (prev) => ({ ...prev, ranch: v }) })}
        options={ranches.map((r) => ({ id: r.id, label: r.name }))}
        counts={counts?.ranch ?? {}}
      />
      <FacetSelect
        label="Species"
        placeholder="All species"
        value={search.species}
        onChange={(v) => void navigate({ search: (prev) => ({ ...prev, species: v, breed: undefined, page: 0 }) })}
        options={speciesOptions}
        counts={counts?.species ?? {}}
      />
      <FacetSelect
        label="Breed"
        placeholder="All breeds"
        value={search.breed}
        onChange={(v) => setFilter("breed", v)}
        options={breedOptions}
        counts={{}}
      />
      <FacetSelect
        label="Sex"
        placeholder="Any sex"
        value={search.sex}
        onChange={(v) => setFilter("sex", v as AnimalsSearch["sex"])}
        options={SEX_OPTIONS}
        counts={counts?.sex ?? {}}
      />
      <FacetSelect
        label="Status"
        placeholder="All statuses"
        value={search.status}
        onChange={(v) => setFilter("status", v)}
        options={statusOptions}
        counts={counts?.status ?? {}}
      />
      <FacetSelect
        label="Section"
        placeholder="All sections"
        value={search.section}
        onChange={(v) => setFilter("section", v)}
        options={sectionOptions}
        counts={counts?.section ?? {}}
      />
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={search.dateFrom ?? ""}
          onChange={(e) => setFilter("dateFrom", e.target.value || undefined)}
          className="h-8 w-36"
          aria-label="From date"
        />
        <span className="text-12 text-muted-foreground">to</span>
        <Input
          type="date"
          value={search.dateTo ?? ""}
          onChange={(e) => setFilter("dateTo", e.target.value || undefined)}
          className="h-8 w-36"
          aria-label="To date"
        />
      </div>
      <Button
        variant={search.attention ? "default" : "outline"}
        size="sm"
        className="gap-1.5"
        aria-pressed={!!search.attention}
        onClick={() => setFilter("attention", search.attention ? undefined : "1")}
      >
        <TriangleAlert className="size-3.5" aria-hidden />
        Needs attention
      </Button>
      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
          <X className="size-3.5" aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
