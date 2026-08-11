import { X } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Route as DashboardRoute } from "@/routes/_authenticated/index";
import { hasActiveDashboardFilters } from "../schema";

const ALL_SPECIES = "__all__";

// The dashboard's own global filters (session-pack.md, Session 7) —
// species and date range, URL-encoded on this route, driving every
// widget below via useDashboardStats/useUpcoming/useRecentActivity's
// shared params. `ranch` is not repeated here: it's the app-wide scope
// from `_authenticated`, already applying everywhere via the existing
// switcher (blueprint.md §5.3's "global scope, global filters").
export function GlobalFilters() {
  const { profile } = useAuth();
  const search = DashboardRoute.useSearch();
  const navigate = DashboardRoute.useNavigate();
  const { data: options } = useAnimalFilterOptions(profile?.orgId);

  const speciesOptions = options?.species ?? [];
  const hasActive = hasActiveDashboardFilters(search);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={search.species ?? ALL_SPECIES}
        onValueChange={(v) => void navigate({ search: (prev) => ({ ...prev, species: v === ALL_SPECIES ? undefined : v }) })}
      >
        <SelectTrigger size="sm" aria-label="Species" className="min-w-36">
          <SelectValue placeholder="All species" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SPECIES}>All species</SelectItem>
          {speciesOptions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={search.dateFrom ?? ""}
          onChange={(e) => void navigate({ search: (prev) => ({ ...prev, dateFrom: e.target.value || undefined }) })}
          className="h-8 w-36"
          aria-label="From date"
        />
        <span className="text-12 text-muted-foreground">to</span>
        <Input
          type="date"
          value={search.dateTo ?? ""}
          onChange={(e) => void navigate({ search: (prev) => ({ ...prev, dateTo: e.target.value || undefined }) })}
          className="h-8 w-36"
          aria-label="To date"
        />
      </div>
      {hasActive ? (
        <Button variant="ghost" size="sm" onClick={() => void navigate({ search: {} })} className="gap-1 text-muted-foreground">
          <X className="size-3.5" aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
