import { useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { signOut } from "@/features/auth/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SyncIndicator } from "@/components/patterns/SyncIndicator";
import { RanchScopeSwitcher } from "./RanchScopeSwitcher";

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-background px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-4" aria-hidden />
      </Button>

      <RanchScopeSwitcher />

      {/* Command palette is M6 (blueprint.md Part 7, session-pack.md) —
          this establishes the trigger's place in the top bar now, at
          full width, so the layout doesn't shift once search actually
          works, rather than pretending it already does. */}
      <Button variant="outline" size="sm" className="ml-2 hidden gap-2 text-muted-foreground sm:flex">
        <Search className="size-3.5" aria-hidden />
        Search
        <kbd className="ml-2 rounded-badge border border-line bg-muted px-1.5 py-0.5 text-12 text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <SyncIndicator />

        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell className="size-4" aria-hidden />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Profile menu">
              <Avatar className="size-8">
                <AvatarFallback>{initials(profile?.fullName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-14 font-medium text-foreground">{profile?.fullName ?? "…"}</p>
              <p className="truncate text-12 text-muted-foreground">{profile?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleSignOut()}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return chars.join("") || "?";
}
