import {
  ArrowRightLeft,
  Baby,
  Heart,
  HeartPulse,
  type LucideIcon,
  Pill,
  Scale,
  Skull,
  Sparkles,
  Stethoscope,
  Syringe,
  Thermometer,
} from "lucide-react";

import type { TimelineEventType } from "../../api";

// Each event type's own marker shape and semantic colour (session-pack.md,
// Session 4's Timeline spec) — colours are the same five functional
// tokens used everywhere else (StatusBadge/AttentionBadge, badge.tsx),
// never a decorative one-off hex. Mortality is the one genuinely
// "something is wrong" marker and gets --critical; everything else is
// informational, not severity-signalling.
export const EVENT_TYPE_META: Record<TimelineEventType, { icon: LucideIcon; colorToken: string; label: string }> = {
  origin: { icon: Sparkles, colorToken: "neutral", label: "Origin" },
  vaccination: { icon: Syringe, colorToken: "ok", label: "Vaccination" },
  treatment: { icon: Pill, colorToken: "info", label: "Treatment" },
  illness: { icon: Thermometer, colorToken: "warn", label: "Illness" },
  illness_resolved: { icon: HeartPulse, colorToken: "ok", label: "Illness resolved" },
  vet_visit: { icon: Stethoscope, colorToken: "info", label: "Vet visit" },
  weight: { icon: Scale, colorToken: "neutral", label: "Weight" },
  movement: { icon: ArrowRightLeft, colorToken: "info", label: "Movement" },
  breeding: { icon: Heart, colorToken: "ok", label: "Breeding" },
  birth: { icon: Baby, colorToken: "ok", label: "Birth" },
  mortality: { icon: Skull, colorToken: "critical", label: "Death" },
};

// Shared by TimelineEntry and the dashboard's Recent Activity feed
// (Session 7) — one definition of "what a severity token looks like as
// a marker" rather than two copies drifting apart.
export const MARKER_CLASSES: Record<string, string> = {
  ok: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  warn: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  critical: "border-status-critical/30 bg-status-critical/10 text-status-critical",
  info: "border-status-info/30 bg-status-info/10 text-status-info",
  neutral: "border-status-neutral/30 bg-status-neutral/10 text-status-neutral",
};

export const EVENT_TYPE_ORDER: TimelineEventType[] = [
  "origin",
  "vaccination",
  "treatment",
  "illness",
  "illness_resolved",
  "vet_visit",
  "weight",
  "movement",
  "breeding",
  "birth",
  "mortality",
];
