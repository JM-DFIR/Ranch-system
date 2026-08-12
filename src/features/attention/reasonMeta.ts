import {
  Baby,
  CalendarClock,
  HeartPulse,
  ImageOff,
  type LucideIcon,
  Pill,
  ScanLine,
  Stethoscope,
  Syringe,
  ThermometerSun,
  TrendingDown,
  Wheat,
} from "lucide-react";

import type { AttentionReason } from "./api";

// One label + icon per reason from v_animals_requiring_attention
// (0016_views.sql) — twelve rules, not eleven (CLAUDE.md §6). Severity
// comes from the row itself, not repeated here.
export const ATTENTION_REASON_META: Record<AttentionReason, { label: string; icon: LucideIcon }> = {
  overdue_vaccination: { label: "Vaccination overdue", icon: Syringe },
  vaccination_due_soon: { label: "Vaccination due soon", icon: Syringe },
  unresolved_illness: { label: "Unresolved illness", icon: ThermometerSun },
  vet_followup_due: { label: "Vet follow-up due", icon: Stethoscope },
  treatment_followup_due: { label: "Treatment follow-up due", icon: Pill },
  care_activity_overdue: { label: "Care activity overdue", icon: Wheat },
  pregnancy_check_due: { label: "Pregnancy check due", icon: CalendarClock },
  calving_imminent: { label: "Calving/kidding imminent", icon: Baby },
  inside_withdrawal_period: { label: "Inside withdrawal period", icon: HeartPulse },
  losing_condition: { label: "Losing condition", icon: TrendingDown },
  incomplete_enrolment: { label: "Incomplete enrolment", icon: ImageOff },
  no_recent_health_record: { label: "No recent health record", icon: ScanLine },
};
