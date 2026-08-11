import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

// Placeholder only — the real animal profile and timeline is Session 4
// (session-pack.md's "signature screen"). Exists now so the register's
// row click (Session 3) has a real destination instead of a dead
// click, same reasoning as `_authenticated/index.tsx`'s dashboard stub.
export const Route = createFileRoute("/_authenticated/animals/$animalId")({
  component: AnimalProfilePlaceholder,
});

function AnimalProfilePlaceholder() {
  const { animalId } = Route.useParams();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Link
        to="/animals"
        className="flex w-fit items-center gap-1 text-13 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to register
      </Link>
      <div className="rounded-card border border-dashed border-line bg-secondary/40 px-8 py-12 text-center">
        <p className="text-14 font-medium text-foreground">Animal profile — coming in Session 4</p>
        <p className="mt-1 text-13 text-muted-foreground">Animal ID: {animalId}</p>
      </div>
    </div>
  );
}
