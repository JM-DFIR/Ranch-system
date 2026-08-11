import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // bg-muted, not bg-accent — a loading state shouldn't borrow the
      // ochre accent, which is reserved for scope/CTAs (CLAUDE.md §4).
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
