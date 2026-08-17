#!/usr/bin/env node
// Regenerates src/routeTree.gen.ts standalone, without starting Vite.
//
// vite.config.ts's tanstackRouter() plugin normally generates this file
// as a side effect of `vite dev`/`vite build` running — but this
// project's own build script is `tsc -b && vite build`, and `tsc -b`
// runs BEFORE Vite ever starts. On a fresh checkout (no prior `pnpm
// dev` session to have already produced the file — CI, Netlify, a
// clone on a new machine) `tsc -b` fails immediately: router.tsx's
// `import { routeTree } from "../routeTree.gen"` has nothing to
// resolve. It only ever worked locally because the file was already
// sitting on disk from an earlier dev-server run.
//
// This calls the exact same @tanstack/router-generator engine the Vite
// plugin itself wraps, with the same config (routesDirectory, target,
// autoCodeSplitting) — so the output here is identical to what the
// plugin would produce, not a second, divergent code path. `build` and
// `typecheck` both run this first now.
import { fileURLToPath } from "node:url";
import { Generator, getConfig } from "@tanstack/router-generator";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const config = getConfig(
  {
    target: "react",
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
    autoCodeSplitting: true,
  },
  repoRoot,
);

const generator = new Generator({ config, root: repoRoot });

try {
  await generator.run();
  console.log("Wrote src/routeTree.gen.ts");
} catch (err) {
  console.error(`Route tree generation failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
