import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  /** Undefined = the destination doesn't exist yet (later session) — renders disabled, not omitted. */
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

// Every empty register explains what belongs there and offers the
// action that fills it — never "No data" (CLAUDE.md §5).
export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-secondary/40 px-8 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-14 font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-13 text-muted-foreground">{description}</p>
      {action || secondaryAction ? (
        <div className="mt-2 flex items-center gap-2">
          {action ? (
            <Button
              size="sm"
              disabled={!action.onClick}
              title={action.onClick ? undefined : "Coming in a later session"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              size="sm"
              variant="outline"
              disabled={!secondaryAction.onClick}
              title={secondaryAction.onClick ? undefined : "Coming in a later session"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
