import type { LucideIcon } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PawPrint,
  ScanLine,
  Images,
  HeartPulse,
  Scale,
  Baby,
  ArrowRightLeft,
  Skull,
  Wheat,
  FileBarChart,
  MapPin,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Undefined = not built yet — renders inert, not a broken link. */
  to?: LinkProps["to"];
  ownerOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// The five groups from blueprint.md's App Shell spec (Session 2).
// Every item is listed now, even ones with no route yet, so the nav's
// structure, spacing and grouping are locked once — later sessions
// wire a real `to` into each item as its module ships, rather than the
// sidebar being redesigned every time.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", icon: LayoutDashboard, to: "/" }],
  },
  {
    label: "Livestock",
    items: [
      { label: "Animals", icon: PawPrint },
      { label: "Enrollment", icon: ScanLine },
      { label: "Batch Enrollment", icon: Images },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Health", icon: HeartPulse },
      { label: "Weights", icon: Scale },
      { label: "Breeding", icon: Baby },
      { label: "Movements", icon: ArrowRightLeft },
      { label: "Mortality", icon: Skull },
      { label: "Feeding & Care", icon: Wheat },
    ],
  },
  {
    label: "Insight",
    items: [{ label: "Reports", icon: FileBarChart }],
  },
  {
    label: "Manage",
    items: [
      { label: "Ranches", icon: MapPin },
      { label: "Admin", icon: Settings, ownerOnly: true },
    ],
  },
];
