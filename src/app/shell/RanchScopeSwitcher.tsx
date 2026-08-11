import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { fetchRanchList } from "@/features/ranches/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function ranchesQueryOptions(orgId: string | undefined) {
  return {
    queryKey: queryKeys.ranches.list(orgId ?? ""),
    queryFn: fetchRanchList,
    enabled: !!orgId,
  };
}

// Sets scope for the entire application, encoded in the URL
// (`_authenticated`'s `ranch` search param) so a filtered view is
// shareable and survives a refresh (blueprint.md, App Shell spec).
export function RanchScopeSwitcher() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { ranch: selectedRanchId } = AuthenticatedRoute.useSearch();
  const navigate = AuthenticatedRoute.useNavigate();

  const { data: ranches = [] } = useQuery(ranchesQueryOptions(profile?.orgId));

  const selected = ranches.find((r) => r.id === selectedRanchId);
  const label = selected ? selected.name : "All ranches";

  const select = (ranchId: string | undefined) => {
    void navigate({ search: (prev) => ({ ...prev, ranch: ranchId }) });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="min-w-40 justify-between font-normal"
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        <ScopeOption label="All ranches" active={!selectedRanchId} onSelect={() => select(undefined)} />
        {ranches.map((r) => (
          <ScopeOption key={r.id} label={r.name} active={r.id === selectedRanchId} onSelect={() => select(r.id)} />
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ScopeOption({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      // py-2.5 rather than py-1.5 — a ~30px row is an easy mis-tap
      // target on a phone, especially two adjacent options in a short
      // list ("All ranches" sitting right above the one you meant).
      className="flex w-full items-center gap-2 rounded-sm px-2 py-2.5 text-left text-14 hover:bg-accent hover:text-accent-foreground"
    >
      <Check className={cn("size-3.5", active ? "opacity-100" : "opacity-0")} aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
