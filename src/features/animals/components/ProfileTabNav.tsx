import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

interface Tab {
  label: string;
  to: string;
}

const TABS: Tab[] = [
  { label: "Overview", to: "/animals/$animalId" },
  { label: "Health", to: "/animals/$animalId/health" },
  { label: "Weights", to: "/animals/$animalId/weights" },
  { label: "Breeding", to: "/animals/$animalId/breeding" },
  { label: "Movements", to: "/animals/$animalId/movements" },
  { label: "Feeding & Care", to: "/animals/$animalId/feeding-care" },
  { label: "Lineage", to: "/animals/$animalId/lineage" },
  { label: "Documents", to: "/animals/$animalId/documents" },
  { label: "Timeline", to: "/animals/$animalId/timeline" },
];

interface ProfileTabNavProps {
  animalId: string;
}

// Nine tabs, each a real route (not local component state) — every tab
// is a shareable link, same URL-as-state philosophy as the register
// (session-pack.md, Session 3/4). `activeOptions={{ exact: true }}` on
// Overview only: without it, "/animals/$animalId" would stay
// highlighted while on every other tab too, since they're all
// descendant paths of it.
export function ProfileTabNav({ animalId }: ProfileTabNavProps) {
  const { ranch } = AuthenticatedRoute.useSearch();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Animal profile sections">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          params={{ animalId }}
          search={{ ranch }}
          activeOptions={{ exact: tab.to === "/animals/$animalId" }}
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-13 font-medium text-muted-foreground transition-colors hover:text-foreground",
          )}
          activeProps={{ className: "!border-primary !text-foreground" }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
