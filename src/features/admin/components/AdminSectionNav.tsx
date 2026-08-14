import { Link } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";

interface Tab {
  label: string;
  to: string;
  ownerOnly?: boolean;
}

const TABS: Tab[] = [
  { label: "Overview", to: "/admin" },
  { label: "Users & roles", to: "/admin/users", ownerOnly: true },
  { label: "Reference data", to: "/admin/reference-data" },
  { label: "Settings", to: "/admin/settings", ownerOnly: true },
  { label: "Audit log", to: "/admin/audit-log", ownerOnly: true },
];

// Admin's own tab strip (mirrors HealthSectionNav.tsx's shape). Three of
// its five destinations are owner-only — hidden here, and also guarded
// at the route level (each owner-only admin.*.tsx's beforeLoad), since
// a manager could still reach the URL directly. Reference data stays
// visible to everyone: it's the one Admin screen any org member can use
// (0021_reference_catalogue_manager_write.sql).
export function AdminSectionNav() {
  const { isOwner } = useAuth();
  const tabs = TABS.filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Admin sections">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          activeOptions={{ exact: tab.to === "/admin" }}
          className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-13 font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "!border-primary !text-foreground" }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
