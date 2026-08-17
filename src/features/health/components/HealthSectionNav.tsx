import { Link } from "@tanstack/react-router";

import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

interface Tab {
  label: string;
  to: string;
}

const TABS: Tab[] = [
  { label: "Overview", to: "/health" },
  { label: "Vaccinations", to: "/health/vaccinations" },
  { label: "Treatments", to: "/health/treatments" },
  { label: "Illnesses", to: "/health/illnesses" },
  { label: "Vet visits", to: "/health/vet-visits" },
];

// The Health Hub's own tab strip, shared by every route nested under
// `/health` (mirrors ProfileTabNav.tsx's shape). Veterinarians and the
// Attention Queue are NOT here — they shipped as their own top-level
// routes in Session 8, before this hub existed, and moving them under
// `/health/*` now would just be churn; they're one click away from the
// hub's own card grid instead (HealthHubPage.tsx).
export function HealthSectionNav() {
  const { ranch } = AuthenticatedRoute.useSearch();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Health sections">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          search={{ ranch }}
          activeOptions={{ exact: tab.to === "/health" }}
          className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-13 font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "!border-primary !text-foreground" }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
