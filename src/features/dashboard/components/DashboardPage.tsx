import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Route as DashboardRoute } from "@/routes/_authenticated/index";
import { useDashboardStats, useFirstRunState, useRanchStats, useRecentActivity, useUpcoming } from "../hooks";
import { DominantMetric } from "./DominantMetric";
import { GlobalFilters } from "./GlobalFilters";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { QuickActionsBar } from "./QuickActionsBar";
import { RanchComparisonStrip } from "./RanchComparisonStrip";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { SexSplitBar } from "./SexSplitBar";
import { SpeciesBar } from "./SpeciesBar";
import { UpcomingList } from "./UpcomingList";

// The Owner/Manager Dashboard at `/` (session-pack.md, Session 7).
// blueprint.md §5: one dominant metric, five to nine elements on the
// default view, everything else behind a drill-down. Counted here:
// quick actions, dominant metric + counterpoint (one paired element),
// ranch comparison, species bar, sex split, upcoming, recent activity
// — seven, within the window. Both roles render the exact same
// component tree; every widget's own query already scopes itself to
// what the signed-in user can see via RLS (get_dashboard_stats,
// v_ranch_stats, v_upcoming_*, v_recent_activity all run
// security-invoker), so there is no separate "Manager variant"
// component — only copy and the ranch-strip visibility rule differ.
export function DashboardPage() {
  const { profile, assignedRanchIds, isOwner, isLoading: authLoading } = useAuth();
  const { ranch } = AuthenticatedRoute.useSearch();
  const dashboardSearch = DashboardRoute.useSearch();

  const statsParams = { ranchId: ranch, speciesId: dashboardSearch.species, dateFrom: dashboardSearch.dateFrom, dateTo: dashboardSearch.dateTo };
  const upcomingParams = { ranchId: ranch, speciesId: dashboardSearch.species };
  const activityParams = statsParams;

  const { data: firstRun, isLoading: firstRunLoading } = useFirstRunState(profile?.orgId);
  const { data: stats, isLoading: statsLoading } = useDashboardStats(profile?.orgId, statsParams);
  const { data: ranchStats, isLoading: ranchStatsLoading } = useRanchStats(profile?.orgId);
  const { data: upcoming, isLoading: upcomingLoading } = useUpcoming(profile?.orgId, upcomingParams);
  const { data: activity, isLoading: activityLoading } = useRecentActivity(profile?.orgId, activityParams);

  if (authLoading || firstRunLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (firstRun?.isFirstRun) {
    return (
      <div className="p-4 md:p-6">
        <OnboardingChecklist state={firstRun} />
      </div>
    );
  }

  // Manager variant omits the ranch strip entirely when only one ranch
  // is assigned (session-pack.md) — comparing a ranch to itself has no
  // information in it. The Owner always sees it: comparing ranches is
  // the point of the widget for someone who oversees more than one.
  const showRanchStrip = isOwner || assignedRanchIds.length > 1;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description={isOwner ? "Every ranch, at a glance." : "Your assigned ranches, at a glance."}
        actions={<GlobalFilters />}
      />

      <QuickActionsBar ranch={ranch} />

      <DominantMetric stats={stats} isLoading={statsLoading} ranch={ranch} species={dashboardSearch.species} />

      {showRanchStrip ? <RanchComparisonStrip ranches={ranchStats} isLoading={ranchStatsLoading} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpeciesBar speciesBreakdown={stats?.speciesBreakdown} isLoading={statsLoading} />
        <SexSplitBar maleCount={stats?.maleCount} femaleCount={stats?.femaleCount} isLoading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingList upcoming={upcoming} isLoading={upcomingLoading} ranch={ranch} />
        <RecentActivityFeed activity={activity} isLoading={activityLoading} ranch={ranch} />
      </div>
    </div>
  );
}
