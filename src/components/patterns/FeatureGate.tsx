import { createContext, useContext, type ReactNode } from "react";

// organization_settings.feature_flags (supabase/migrations/0003_identity.sql),
// e.g. { "finance": false, "weights": true }. Populated by whatever reads
// org settings (lib/auth.ts, once real generated types replace the
// placeholder stub — see src/types/database.generated.ts). FeatureGate
// itself has no Supabase dependency at all, deliberately: it only ever
// reads from this context.
export type FeatureFlags = Record<string, boolean>;

const FeatureFlagsContext = createContext<FeatureFlags>({});

export const FeatureFlagsProvider = FeatureFlagsContext.Provider;

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext);
}

interface FeatureGateProps {
  flag: string;
  children: ReactNode;
}

// Wraps every money-bearing field, column and report (CLAUDE.md §9).
// Renders null while the flag is off — the components exist, they
// simply don't render. Do not remove the wrapped content; the point is
// that turning the flag on later is a config change, not a rebuild.
export function FeatureGate({ flag, children }: FeatureGateProps) {
  const flags = useFeatureFlags();
  if (!flags[flag]) return null;
  return <>{children}</>;
}
