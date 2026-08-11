import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Nothing is a pill, per CLAUDE.md §4 — badges use --radius-badge (4px),
  // not the shadcn default rounded-full.
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-badge border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // Status variants — functional only, never decorative. These back
        // StatusBadge/AttentionBadge (Session 2); tinted surface + solid
        // text, not a solid fill, so they read as calm even in a dense list.
        ok: "border-status-ok/20 bg-status-ok/10 text-status-ok",
        warn: "border-status-warn/25 bg-status-warn/10 text-status-warn",
        critical: "border-status-critical/25 bg-status-critical/10 text-status-critical",
        info: "border-status-info/20 bg-status-info/10 text-status-info",
        neutral: "border-status-neutral/20 bg-status-neutral/10 text-status-neutral",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
