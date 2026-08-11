import { createFileRoute, Link } from "@tanstack/react-router";

// Placeholder only — the real dashboard is Session 7. This exists so
// `/` resolves to something during Session 0 rather than a 404.
export const Route = createFileRoute("/")({
  component: HomePlaceholder,
});

function HomePlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
      <h1 className="font-display text-26 font-semibold">LIMS</h1>
      <p className="text-14 text-muted-foreground">
        Livestock Inventory Management System — scaffold in progress.
      </p>
      <Link
        to="/kitchen-sink"
        className="text-14 font-medium text-primary underline underline-offset-4"
      >
        View the design system kitchen sink →
      </Link>
    </main>
  );
}
