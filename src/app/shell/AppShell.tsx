import { useEffect, useState, type ReactNode } from "react";

import { DesktopSidebar, MobileNav } from "./Sidebar";
import { TopBar } from "./TopBar";

const COLLAPSE_STORAGE_KEY = "lims:sidebar-collapsed";

// UI preference, not domain data — localStorage is the right tool here,
// unlike domain writes, which go through the Dexie queue only
// (CLAUDE.md §10/§11).
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return [collapsed, setCollapsed] as const;
}

// The anchor screen every other route inherits from (blueprint.md,
// Session 2). Owns both the desktop collapse state and the mobile
// sheet's open state, so TopBar's hamburger trigger and Sidebar's
// content stay in sync without a third state manager.
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
