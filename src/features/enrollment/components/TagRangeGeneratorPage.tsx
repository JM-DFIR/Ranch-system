import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hash } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useAnimalFilterOptions } from "@/features/animals/hooks";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bulkReserveTags, type ReservedTag } from "../api";

const UNSET = "__unset__";

interface TagRangeGeneratorPageProps {
  ranch: { id: string; name: string };
}

// For ranches that number physical tags before working the animals —
// reserves a numbered block (e.g. MUX 501-MUX 550) in one call rather
// than one round trip per tag (session-pack.md, Session 5b; blueprint.md
// §2.4). Each reservation is a real placeholder animals row (species_id
// left unset unless chosen here) — the same shape the "incomplete
// enrolment" attention rule already expects, not a new concept.
export function TagRangeGeneratorPage({ ranch }: TagRangeGeneratorPageProps) {
  const { profile } = useAuth();
  const { data: filterOptions } = useAnimalFilterOptions(profile?.orgId);

  const [prefix, setPrefix] = useState("");
  const [count, setCount] = useState(10);
  const [speciesId, setSpeciesId] = useState<string | undefined>(undefined);
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [reserved, setReserved] = useState<ReservedTag[] | null>(null);

  const mutation = useMutation({
    mutationFn: () => bulkReserveTags({ ranchId: ranch.id, prefix: prefix.trim(), count, speciesId, sectionId }),
    onSuccess: (tags) => {
      setReserved(tags);
      const first = tags[0]?.tagNumber;
      const last = tags[tags.length - 1]?.tagNumber;
      toast.success(tags.length > 1 ? `Reserved ${first} – ${last}` : `Reserved ${first}`);
    },
    onError: (error) => {
      toast.error("Couldn't reserve tags", { description: error instanceof Error ? error.message : undefined });
    },
  });

  const handleSpeciesChange = (value: string) => {
    const id = value === UNSET ? undefined : value;
    setSpeciesId(id);
    const species = filterOptions?.species.find((s) => s.id === id);
    if (species?.defaultTagPrefix) setPrefix(species.defaultTagPrefix);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader title="Tag Range Generator" description={`Reserve a numbered block of tags for ${ranch.name}.`} />

      <div className="max-w-md space-y-4 rounded-card border border-line bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="tag-range-species">Species (optional)</Label>
          <Select value={speciesId ?? UNSET} onValueChange={handleSpeciesChange}>
            <SelectTrigger id="tag-range-species" className="w-full">
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>Not set</SelectItem>
              {(filterOptions?.species ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tag-range-section">Section (optional)</Label>
          <Select value={sectionId ?? UNSET} onValueChange={(v) => setSectionId(v === UNSET ? undefined : v)}>
            <SelectTrigger id="tag-range-section" className="w-full">
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>Not set</SelectItem>
              {(filterOptions?.sections ?? [])
                .filter((s) => s.ranchId === ranch.id)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tag-range-prefix">Prefix</Label>
          <Input
            id="tag-range-prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. MUX "
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tag-range-count">How many</Label>
          <Input
            id="tag-range-count"
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
            className="font-mono tabular-nums"
          />
        </div>

        <Button
          className="w-full gap-1.5"
          onClick={() => void mutation.mutate()}
          disabled={mutation.isPending || !prefix.trim()}
        >
          <Hash className="size-3.5" aria-hidden />
          {mutation.isPending ? "Reserving…" : "Reserve tags"}
        </Button>
      </div>

      {reserved ? (
        <div className="max-w-md rounded-card border border-line bg-card p-4">
          <p className="mb-2 text-13 font-medium text-foreground">{reserved.length} tags reserved</p>
          <div className="flex flex-wrap gap-1.5">
            {reserved.map((t) => (
              <span key={t.id} className="rounded-badge border border-line bg-secondary px-2 py-0.5 font-mono text-12 tabular-nums">
                {t.tagNumber}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
