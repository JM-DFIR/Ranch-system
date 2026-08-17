import { createFileRoute } from "@tanstack/react-router";

import { animalsSearchSchema } from "@/features/animals/schema";
import { AnimalRegisterPage } from "@/features/animals/components/AnimalRegisterPage";

// The animal register, moved here from animals.tsx (now a bare Outlet
// layout, mirroring reports.tsx/reports.index.tsx) — see that file's
// comment for why this split matters: without an .index sibling,
// animals.tsx's own file name makes it the implicit parent of every
// animals.$animalId* route by TanStack Router's file-based convention,
// regardless of whether its component renders an <Outlet>. It didn't,
// so /animals/$animalId could never render — the register just stayed
// on screen, URL changed or not, reload or not. `ranch` is still not
// part of this route's own search schema; it's inherited from the
// parent `_authenticated` route (Session 2's global ranch scope), read
// via AuthenticatedRoute in the components below rather than
// duplicated here.
export const Route = createFileRoute("/_authenticated/animals/")({
  validateSearch: animalsSearchSchema,
  component: AnimalRegisterPage,
});
