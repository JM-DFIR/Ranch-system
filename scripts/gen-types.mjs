#!/usr/bin/env node
// Regenerates src/types/database.generated.ts.
//
// This exists specifically so the output is always UTF-8 regardless of
// which shell runs `pnpm db:types`. Plain `supabase gen types ... >
// file` corrupts the output under Windows PowerShell, whose `>`
// operator has historically defaulted to UTF-16LE (Windows PowerShell
// 5.1) — every character comes out separated by a null byte, which
// LOOKS like a readable file (the IDE will happily open it) right up
// until something actually tries to compile it. Piping through Node's
// own UTF-8 file write sidesteps the shell's redirection encoding
// entirely, so it's correct no matter which terminal invoked the script.
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT_ID = "pnrdlgqzuwnjvoaszdkk";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const outPath = path.join(repoRoot, "src/types/database.generated.ts");
const supabaseBin = path.join(
  repoRoot,
  "node_modules/.bin",
  process.platform === "win32" ? "supabase.exe" : "supabase",
);

const child = spawn(supabaseBin, ["gen", "types", "typescript", "--project-id", PROJECT_ID], {
  stdio: ["ignore", "pipe", "inherit"],
});

const out = createWriteStream(outPath, { encoding: "utf8" });
child.stdout.pipe(out);

child.on("error", (err) => {
  console.error(`Failed to run supabase CLI: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  out.end();
  if (code !== 0) {
    console.error(`supabase gen types exited with code ${code}`);
    process.exit(code ?? 1);
  }
  console.log(`Wrote ${outPath}`);
});
