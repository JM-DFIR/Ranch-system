import { Link, type LinkProps } from "@tanstack/react-router";
import { ScrollText, Settings2, Tags, Users, type LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";

interface HubCard {
  label: string;
  description: string;
  icon: LucideIcon;
  to: LinkProps["to"];
  ownerOnly?: boolean;
}

const CARDS: HubCard[] = [
  { label: "Users & roles", description: "Invite people, set roles, and assign managers to ranches.", icon: Users, to: "/admin/users", ownerOnly: true },
  { label: "Reference data", description: "Species, breeds, statuses, vaccines and the other shared lists.", icon: Tags, to: "/admin/reference-data" },
  { label: "Settings", description: "Organisation name, weight unit, and feature switches.", icon: Settings2, to: "/admin/settings", ownerOnly: true },
  { label: "Audit log", description: "Who changed what, across every ranch.", icon: ScrollText, to: "/admin/audit-log", ownerOnly: true },
];

// Admin's landing view — pure navigation, same convention as
// HealthHubPage.tsx. Reference data is the one card every org member
// sees; the rest are owner-only (filtered here, and enforced again at
// each destination's own route guard).
export function AdminHubPage() {
  const { isOwner } = useAuth();
  const cards = CARDS.filter((card) => !card.ownerOnly || isOwner);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Admin" description="Users, reference data, organisation settings and the audit log." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
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
