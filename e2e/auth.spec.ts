import { expect, test } from "@playwright/test";

// The auth shell and its guards — the one set of critical paths
// verifiable end-to-end without a live Supabase test project (no
// Docker in this environment; see CLAUDE.md's working-notes on that).
// A real login → record → verify flow needs real test credentials
// against a live project; see e2e/README.md for how to extend this
// suite once those exist.
//
// `exact: true` on every getByLabel below is load-bearing, not
// stylistic: this suite runs against `pnpm dev`, and TanStack Router
// Devtools (__root.tsx, DEV-only) renders a "Open match details for
// /forgot-password" button whose accessible name contains "password"
// as a substring — Playwright's getByLabel matches substrings by
// default, so a bare getByLabel("Password") resolves to three
// elements (the real field plus two devtools buttons) and throws a
// strict-mode violation. Found running this suite for real, not
// theoretical.

test.describe("login", () => {
  test("renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("rejects an invalid email before hitting the network", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("whatever-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("links to forgot password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe("route guard", () => {
  test("redirects an unauthenticated visitor from a protected route to login", async ({ page }) => {
    await page.goto("/animals");
    await expect(page).toHaveURL(/\/login/);
  });

  test("carries the original destination through as a redirect param", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });
});

test.describe("accept invitation", () => {
  test("without a token, explains where to find the real link", async ({ page }) => {
    await page.goto("/accept-invitation");
    await expect(page.getByText("Invitation link needed")).toBeVisible();
  });

  test("with a token, shows the account setup form", async ({ page }) => {
    await page.goto("/accept-invitation?token=test-token");
    await expect(page.getByRole("heading", { name: "Set up your account" })).toBeVisible();
  });
});
