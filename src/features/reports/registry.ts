import {
  Baby,
  Heart,
  HeartHandshake,
  PawPrint,
  Pill,
  Scale,
  Skull,
  ThermometerSun,
  TriangleAlert,
  Wallet,
  Wheat,
  ArrowRightLeft,
  Syringe,
  type LucideIcon,
} from "lucide-react";

export type ReportKind = "inventory" | "vaccination-compliance" | "attention-summary" | "breeding-performance" | "weight-growth" | "monthly-count" | "financial";

export interface ReportConfig {
  id: string;
  label: string;
  description: string;
  module: string;
  icon: LucideIcon;
  kind: ReportKind;
  /** Only set when kind === "monthly-count" — the view + copy MonthlyCountReport needs. */
  monthlyCount?: {
    view: "v_treatment_report" | "v_illness_report" | "v_movement_report" | "v_mortality_report" | "v_feeding_report" | "v_care_activity_report" | "v_birth_report";
    groupColumnLabel: string;
    quantityUnit?: string;
  };
}

// The thirteen §17 reports (blueprint.md/session-pack.md Part 5, "M6")
// — reconstructed and confirmed with the client 2026-08-14, since the
// original PRD's actual §17 list isn't reproduced anywhere in this
// repo (same gap as Session 7's Quick Actions list). One per module
// already in the product, grouped here for the Report Gallery.
export const REPORTS: ReportConfig[] = [
  {
    id: "inventory",
    label: "Livestock Inventory",
    description: "Current headcount by ranch, species, sex and status.",
    module: "Livestock",
    icon: PawPrint,
    kind: "inventory",
  },
  {
    id: "vaccination-compliance",
    label: "Vaccination Compliance",
    description: "Animals up to date vs. overdue, by ranch and species.",
    module: "Health",
    icon: Syringe,
    kind: "vaccination-compliance",
  },
  {
    id: "v_treatment_report",
    label: "Treatment History",
    description: "Treatments recorded per month, by medication.",
    module: "Health",
    icon: Pill,
    kind: "monthly-count",
    monthlyCount: { view: "v_treatment_report", groupColumnLabel: "Medication" },
  },
  {
    id: "v_illness_report",
    label: "Illness / Morbidity",
    description: "Illnesses reported per month, by illness type.",
    module: "Health",
    icon: ThermometerSun,
    kind: "monthly-count",
    monthlyCount: { view: "v_illness_report", groupColumnLabel: "Illness" },
  },
  {
    id: "weight-growth",
    label: "Weight & Growth",
    description: "Average daily gain per month, by ranch and species.",
    module: "Weights",
    icon: Scale,
    kind: "weight-growth",
  },
  {
    id: "breeding-performance",
    label: "Breeding Performance",
    description: "Conception, delivery and loss rates, by ranch and species.",
    module: "Breeding",
    icon: Heart,
    kind: "breeding-performance",
  },
  {
    id: "v_birth_report",
    label: "Birth / Offspring",
    description: "Births recorded per month, by outcome.",
    module: "Breeding",
    icon: Baby,
    kind: "monthly-count",
    monthlyCount: { view: "v_birth_report", groupColumnLabel: "Outcome" },
  },
  {
    id: "v_movement_report",
    label: "Movement / Transfer",
    description: "Transfers per month, by destination ranch.",
    module: "Movements",
    icon: ArrowRightLeft,
    kind: "monthly-count",
    monthlyCount: { view: "v_movement_report", groupColumnLabel: "Destination" },
  },
  {
    id: "v_mortality_report",
    label: "Mortality",
    description: "Deaths per month, by cause.",
    module: "Mortality",
    icon: Skull,
    kind: "monthly-count",
    monthlyCount: { view: "v_mortality_report", groupColumnLabel: "Cause" },
  },
  {
    id: "v_feeding_report",
    label: "Feeding Consumption",
    description: "Feed quantity per month, by feed item.",
    module: "Feeding & Care",
    icon: Wheat,
    kind: "monthly-count",
    // No fixed unit here — the feed item column itself carries the
    // unit per row (e.g. "Hay (kg)"), since a feed item can honestly
    // be logged in more than one unit over time
    // (0029_reports.sql's v_feeding_report groups by unit too, so a
    // summed quantity is never a silently-wrong kg+bales total).
    monthlyCount: { view: "v_feeding_report", groupColumnLabel: "Feed item", quantityUnit: "as logged" },
  },
  {
    id: "v_care_activity_report",
    label: "Care Activity",
    description: "Care activities per month, by activity type.",
    module: "Feeding & Care",
    icon: HeartHandshake,
    kind: "monthly-count",
    monthlyCount: { view: "v_care_activity_report", groupColumnLabel: "Activity type" },
  },
  {
    id: "attention-summary",
    label: "Attention Summary",
    description: "Open attention reasons, by severity.",
    module: "Health",
    icon: TriangleAlert,
    kind: "attention-summary",
  },
  {
    id: "financial",
    label: "Financial",
    description: "Costs across treatments, vet visits, feeding and care.",
    module: "Admin",
    icon: Wallet,
    kind: "financial",
  },
];

export function getReportConfig(id: string): ReportConfig | undefined {
  return REPORTS.find((r) => r.id === id);
}
