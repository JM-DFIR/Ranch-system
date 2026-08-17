import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { queryKeys } from "@/lib/query-keys";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { NAV_GROUPS } from "@/app/shell/nav-items";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

interface AnimalSearchResult {
  id: string;
  tagNumber: string;
  name: string | null;
  ranchName: string;
}

async function searchAnimals(orgId: string, query: string): Promise<AnimalSearchResult[]> {
  if (query.trim().length < 1) return [];
  const term = query.replace(/[,()]/g, "").trim();
  const { data, error } = await supabase
    .from("v_animal_current")
    .select("id, tag_number, name, ranch_name")
    .eq("org_id", orgId)
    .or(`tag_number.ilike.%${term}%,name.ilike.%${term}%`)
    .order("tag_number")
    .limit(8);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id ?? "",
    tagNumber: row.tag_number ?? "—",
    name: row.name,
    ranchName: row.ranch_name ?? "—",
  }));
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The Command Palette (⌘K) — M6's answer to both "Command palette" and
// "Global search" in blueprint.md Part 4's coverage matrix (a live
// animal search inline in the same overlay, rather than a second,
// separate Search Results page duplicating the same query). Mounted
// once in AppShell, opened by the keyboard shortcut and the sidebar
// (future entry points can trigger the same `open` state).
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { profile } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);

  // Reset the query once the dialog closes — adjusted during render
  // (React's documented pattern for "reset state when a prop changes")
  // rather than in a useEffect, the same convention FilterBar.tsx and
  // AnimalRegisterPage.tsx already use for this exact shape.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setQuery("");
  }

  const { data: animals } = useQuery({
    queryKey: queryKeys.commandPalette.animalSearch(profile?.orgId ?? "", debouncedQuery),
    queryFn: () => searchAnimals(profile?.orgId ?? "", debouncedQuery),
    enabled: !!profile?.orgId && debouncedQuery.trim().length > 0,
  });

  const navItems = NAV_GROUPS.flatMap((group) => group.items.filter((item) => !!item.to).map((item) => ({ ...item, group: group.label })));

  const goToAnimal = (animalId: string) => {
    onOpenChange(false);
    void navigate({ to: "/animals/$animalId", params: { animalId }, search: { ranch } });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search animals or jump to a screen…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {animals && animals.length > 0 ? (
          <>
            <CommandGroup heading="Animals">
              {animals.map((a) => (
                <CommandItem key={a.id} value={`animal-${a.id}`} onSelect={() => goToAnimal(a.id)}>
                  <PawPrint aria-hidden />
                  <span className="font-mono tabular-nums">{a.tagNumber}</span>
                  {a.name ? <span className="text-muted-foreground">{a.name}</span> : null}
                  <span className="ml-auto text-12 text-muted-foreground">{a.ranchName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}
        {NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group.label);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={group.label} heading={group.label}>
              {items.map((item) => (
                <CommandItem
                  key={item.label}
                  value={item.label}
                  onSelect={() => {
                    if (!item.to) return;
                    onOpenChange(false);
                    void navigate({ to: item.to, search: { ranch } });
                  }}
                >
                  <item.icon aria-hidden />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
