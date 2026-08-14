import { defineConfig, devices } from "@playwright/test";

// M7 — Playwright E2E on critical paths (blueprint.md Part 7). Scoped to
// what's verifiable without a live Supabase test project: auth-page
// rendering/validation and the protected-route redirect. Anything that
// needs a real signed-in session (add animal, record death, …) needs
// real test credentials against a live project this environment doesn't
// have — see e2e/README.md for how to extend this once they exist.
export default defineConfig({
  testDir: "./e2e",
  // Not parallel, and one worker: this suite hits an on-demand Vite dev
  // server (no production build in the loop), and several workers
  // stampeding it cold at once caused real timeouts here (each route's
  // first request pays Vite's transform cost) — one worker means each
  // request either warms the cache for the next or the server is already
  // warm, not four cold compiles fighting for the same CPU.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
