import { Link } from "@tanstack/react-router";

import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

interface Tab {
  label: string;
  to: string;
}

const TABS: Tab[] = [
  { label: "Register", to: "/breeding" },
  { label: "Calendar", to: "/breeding/calendar" },
];

// Breeding's own small tab strip (M4 — session-pack.md Part 5), same
// shape as HealthSectionNav.tsx — two screens sharing one layout
// rather than two disconnected routes.
export function BreedingSectionNav() {
  const { ranch } = AuthenticatedRoute.useSearch();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Breeding sections">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          search={{ ranch }}
          activeOptions={{ exact: tab.to === "/breeding" }}
          className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-13 font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "!border-primary !text-foreground" }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
