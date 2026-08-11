import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_GROUPS, type NavItem } from "./nav-items";

// Shared between the desktop rail and the mobile bottom sheet — one
// nav structure, two chrome wrappers, per blueprint.md's App Shell spec.
function NavContent({ collapsed }: { collapsed: boolean }) {
  const { isOwner } = useAuth();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  // Enrollment Mode (Session 5b) lives under its own full-screen,
  // sidebar-free layout (_enrollment.tsx) rather than _authenticated's
  // AppShell — carrying `ranch` through on every nav link is what lets
  // it (and every other destination) open already scoped to whatever
  // ranch was active, instead of only working for links that happen to
  // stay within _authenticated's own route tree.
  const { ranch } = AuthenticatedRoute.useSearch();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => !item.ownerOnly || isOwner);
        if (items.length === 0) return null;

        return (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-1.5 px-2.5 text-12 font-medium tracking-wide text-bone-400 uppercase">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.label}>
                  <NavLink item={item} collapsed={collapsed} active={item.to === currentPath} ranch={ranch} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function NavLink({
  item,
  collapsed,
  active,
  ranch,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  ranch: string | undefined;
}) {
  const Icon = item.icon;

  const content = (
    <span
      className={cn(
        "flex items-center gap-3 rounded-input px-2.5 py-2 text-14 transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        !item.to && "cursor-default opacity-40 hover:bg-transparent hover:text-sidebar-foreground/70",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {!collapsed && !item.to ? <span className="ml-auto text-12 text-sidebar-foreground/40">Soon</span> : null}
    </span>
  );

  const inner = item.to ? (
    <Link to={item.to} search={{ ranch }} className="block">
      {content}
    </Link>
  ) : (
    <div aria-disabled="true">{content}</div>
  );

  if (!collapsed) return inner;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function Wordmark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-0")}>
      <span className="font-display text-16 font-semibold text-sidebar-foreground">
        {collapsed ? "L" : "LIMS"}
      </span>
    </div>
  );
}

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

// 260px, collapses to a 64px icon rail with tooltips; state persists
// (see the localStorage hook in AppShell.tsx).
export function DesktopSidebar({ collapsed, onToggleCollapsed }: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-state md:flex",
        collapsed ? "w-16" : "w-[260px]",
      )}
    >
      <Wordmark collapsed={collapsed} />
      <NavContent collapsed={collapsed} />
      <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex justify-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex items-center gap-2 rounded-input px-2.5 py-2 text-13 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
              {!collapsed ? "Collapse" : null}
            </button>
          </TooltipTrigger>
          {collapsed ? <TooltipContent side="right">Expand sidebar</TooltipContent> : null}
        </Tooltip>
      </div>
    </aside>
  );
}

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] gap-0 bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Wordmark collapsed={false} />
        <NavContent collapsed={false} />
      </SheetContent>
    </Sheet>
  );
}
