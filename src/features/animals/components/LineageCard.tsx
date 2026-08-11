import { Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

import type { AnimalSummary } from "../api";

const SEX_GLYPH: Record<string, string> = { male: "♂", female: "♀", unknown: "—" };

interface LineageCardProps {
  animal: AnimalSummary;
  highlighted?: boolean;
}

// photo_path resolution deferred the same way as everywhere else in
// this session (Session 5's camera pipeline) — glyph fallback here too.
export function LineageCard({ animal, highlighted = false }: LineageCardProps) {
  return (
    <Link
      to="/animals/$animalId"
      params={{ animalId: animal.id }}
      className={`flex w-36 shrink-0 flex-col items-center gap-1.5 rounded-card border p-3 text-center transition-colors hover:border-primary ${
        highlighted ? "border-primary bg-accent" : "border-line bg-card"
      }`}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PawPrint className="size-5" aria-hidden />
      </div>
      <span className="font-mono text-13 font-medium tabular-nums text-foreground">{animal.tagNumber}</span>
      {animal.name ? <span className="truncate text-12 text-muted-foreground">{animal.name}</span> : null}
      <span className="text-12 text-muted-foreground">
        {SEX_GLYPH[animal.sex] ?? "—"} {animal.speciesName ?? ""}
      </span>
    </Link>
  );
}
