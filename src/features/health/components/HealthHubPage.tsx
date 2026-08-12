import { Link, type LinkProps } from "@tanstack/react-router";
import { Pill, Stethoscope, ThermometerSun, TriangleAlert, Syringe, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/patterns/PageHeader";

interface HubCard {
  label: string;
  description: string;
  icon: LucideIcon;
  to: LinkProps["to"];
}

const CARDS: HubCard[] = [
  { label: "Vaccinations", description: "Every vaccination recorded across the herd.", icon: Syringe, to: "/health/vaccinations" },
  { label: "Treatments", description: "Every treatment recorded across the herd.", icon: Pill, to: "/health/treatments" },
  { label: "Illnesses", description: "Every illness reported across the herd.", icon: ThermometerSun, to: "/health/illnesses" },
  { label: "Vet visits", description: "Every veterinarian visit, one row per visit.", icon: Stethoscope, to: "/health/vet-visits" },
  { label: "Veterinarians", description: "The shared directory every ranch can use.", icon: Stethoscope, to: "/veterinarians" },
  { label: "Attention queue", description: "Overdue vaccinations, unresolved illnesses, and more.", icon: TriangleAlert, to: "/attention" },
];

// The Health Hub's landing view (session-pack.md Part 5 — "M3
// remainder"). Pure navigation, no live counts — each destination
// already shows its own real numbers once you're there; duplicating
// that here would just be another query to keep in sync for a screen
// whose actual job is getting you to the right place.
export function HealthHubPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Health" description="Vaccinations, treatments, illnesses and vet visits across every ranch." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="flex flex-col gap-2 rounded-card border border-line bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div className="flex size-8 items-center justify-center rounded-card bg-muted text-muted-foreground">
              <card.icon className="size-4" aria-hidden />
            </div>
            <p className="text-14 font-medium text-foreground">{card.label}</p>
            <p className="text-13 text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
