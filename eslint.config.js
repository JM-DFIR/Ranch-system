import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      "src/routeTree.gen.ts",
      "src/types/database.generated.ts",
      // Deno runtime (global `Deno`, `jsr:`/`npm:` specifiers) — a
      // different TypeScript project entirely, not part of the Vite
      // app's tsconfig, and not something this ESLint config understands.
      "supabase/functions/**",
      // Local Supabase CLI state (`supabase start`/`supabase link`) —
      // already gitignored, but ESLint doesn't read .gitignore on its
      // own. Includes generated edge-function bootstrap files that
      // aren't part of any tsconfig here either. Found running
      // `supabase start` for the first time in this environment.
      "supabase/.temp/**",
      "supabase/.branches/**",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // CLAUDE.md §2/§10: strict typing is a hard requirement, not a
      // suggestion — no `any`, no silent escape hatches.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    // Every file-based route exports `Route` alongside its component —
    // that's the TanStack Router convention, not a fast-refresh mistake.
    // `throw redirect(...)` in beforeLoad/loader is the same story:
    // Redirect is a Response-based type, not an Error subclass, by the
    // router's own design (mirrors `throw new Response()` in Remix) —
    // a legitimate control-flow pattern this generic rule doesn't know
    // about, used throughout every protected route's auth guard.
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/only-throw-error": "off",
    },
  },
  {
    // requireSession() throws TanStack Router's redirect() on behalf of
    // every route's own beforeLoad (_authenticated.tsx, _enrollment.tsx)
    // — same Response-based, not-an-Error-subclass pattern as the
    // src/routes/** override above, just centralised in one shared
    // helper instead of duplicated per layout.
    files: ["src/lib/auth.ts"],
    rules: { "@typescript-eslint/only-throw-error": "off" },
  },
  {
    // Vendored shadcn primitives export a component alongside its cva
    // variants function (e.g. `Button` + `buttonVariants`) by convention.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // Shared patterns sometimes export a hook/context/provider tightly
    // coupled to the component itself (e.g. FeatureGate + useFeatureFlags)
    // — same rationale as the shadcn override above.
    files: ["src/components/patterns/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // The bootstrap entry point — nothing here is ever meant to be
    // hot-module-replaced as a component, so there's no exportable
    // boundary for react-refresh to attach to.
    files: ["src/main.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // TanStack Table column definitions routinely need a small
    // presentational cell component (e.g. animals/columns.tsx's
    // AnimalThumbnail) colocated with the exported ColumnDef array —
    // same rationale as the shadcn/patterns overrides above, expected
    // to recur in every feature's own columns.tsx.
    files: ["src/features/**/columns.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  eslintConfigPrettier,
);
