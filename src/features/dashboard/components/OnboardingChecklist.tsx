import { Link } from "@tanstack/react-router";
import { Check, PawPrint, ScanLine } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import type { FirstRunState } from "../api";

interface OnboardingChecklistProps {
  state: FirstRunState;
}

interface Step {
  title: string;
  description: string;
  done: boolean;
  action?: { label: string; to: "/enroll" | "/ranches" | "/admin/reference-data" };
}

// "When the org has zero animals... replace the whole dashboard with
// an onboarding checklist... make it welcoming, not empty"
// (session-pack.md, Session 7). All three steps now link somewhere
// real — Ranches (List · Create/Edit Ranch) and Admin's Reference Data
// Manager both shipped after this checklist was first written, when
// they were still "coming in a later session" placeholders.
export function OnboardingChecklist({ state }: OnboardingChecklistProps) {
  const { ranch } = AuthenticatedRoute.useSearch();
  const steps: Step[] = [
    {
      title: "Create your first ranch",
      description: "Every animal belongs to a ranch. Add one with its name and location to get started.",
      done: state.hasRanches,
      action: state.hasRanches ? undefined : { label: "Create a ranch", to: "/ranches" },
    },
    {
      title: "Add your species",
      description:
        "Set up the species you keep — goats, cattle, or anything else — with a tag prefix if you want the next-tag suggestion to work from day one.",
      done: state.hasSpecies,
      action: state.hasSpecies ? undefined : { label: "Add a species", to: "/admin/reference-data" },
    },
    {
      title: "Start enrolling",
      description: "Capture your herd live in the field, or from a batch of photos at a desk.",
      done: false,
      action: state.hasRanches ? { label: "Start Enrollment Mode", to: "/enroll" } : undefined,
    },
  ];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-12 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-card bg-acacia-100 text-acacia-700">
        <PawPrint className="size-7" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-display text-26 font-semibold text-foreground">Welcome to LIMS</h1>
        <p className="text-14 text-muted-foreground">
          Your ranch's digital record book starts here. Three things get you going.
        </p>
      </div>
      <ol className="flex flex-col gap-3 text-left">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              "flex items-start gap-3 rounded-card border p-4",
              step.done ? "border-status-ok/30 bg-status-ok/5" : "border-line bg-card",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-12",
                step.done ? "border-status-ok bg-status-ok text-white" : "border-line text-muted-foreground",
              )}
            >
              {step.done ? <Check className="size-3.5" aria-hidden /> : index + 1}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-14 font-medium text-foreground">{step.title}</p>
              <p className="text-13 text-muted-foreground">{step.description}</p>
              {step.action ? (
                <Button asChild size="sm" className="mt-1">
                  <Link to={step.action.to} search={{ ranch }}>
                    <ScanLine aria-hidden />
                    {step.action.label}
                  </Link>
                </Button>
              ) : !step.done ? (
                <p className="pt-1 text-12 text-muted-foreground/70">Coming in a later session</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
