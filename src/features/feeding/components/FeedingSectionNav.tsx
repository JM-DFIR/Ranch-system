import { Link } from "@tanstack/react-router";

import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

interface Tab {
  label: string;
  to: string;
}

const TABS: Tab[] = [
  { label: "Feeding log", to: "/feeding" },
  { label: "Care activities", to: "/feeding/care" },
];

// Feeding & Care's own small tab strip (M5 — session-pack.md Part 5),
// same shape as HealthSectionNav.tsx / BreedingSectionNav.tsx.
export function FeedingSectionNav() {
  const { ranch } = AuthenticatedRoute.useSearch();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Feeding and care sections">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          search={{ ranch }}
          activeOptions={{ exact: tab.to === "/feeding" }}
          className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-13 font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "!border-primary !text-foreground" }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
