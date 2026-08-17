import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { updateOrgSettings } from "../api";
import { useOrgSettings } from "../hooks";
import { orgSettingsFormSchema, type OrgSettingsFormValues } from "../schema";

// Admin > Organisation Settings (blueprint.md §4.1). Edits two tables —
// `organizations` (name, timezone) and `organization_settings`
// (weight_unit, stale_health_days, feature_flags) — as one form; see
// admin/api.ts's updateOrgSettings. This is also where the `finance`
// flag (CLAUDE.md §9) becomes a real, owner-controlled switch instead
// of permanently false.
export function OrgSettingsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings, isLoading, isError, error, refetch } = useOrgSettings(profile?.orgId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsFormSchema),
    values: settings
      ? {
          name: settings.name,
          timezone: settings.timezone,
          weightUnit: settings.weightUnit,
          staleHealthDays: String(settings.staleHealthDays),
          financeEnabled: settings.featureFlags.finance === true,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: OrgSettingsFormValues) => {
      if (!profile || !settings) throw new Error("Not signed in");
      return updateOrgSettings(profile.orgId, settings, values);
    },
    onSuccess: () => {
      if (profile) void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orgSettings(profile.orgId) });
      toast.success("Settings saved");
    },
    onError: (err) => toast.error("Couldn't save settings", { description: err instanceof Error ? err.message : undefined }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Organisation settings" />
        <Skeleton className="h-64 w-full max-w-xl" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Organisation settings" />
        <ErrorState
          title="Couldn't load organisation settings"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Organisation settings" description="Applies across every ranch in your organisation." />

      <form onSubmit={(e) => void onSubmit(e)} className="flex max-w-xl flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Organisation name</Label>
          <Input id="org-name" {...register("name")} />
          {errors.name ? <p className="text-13 text-status-critical">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-timezone">Timezone</Label>
          <Input id="org-timezone" {...register("timezone")} />
          {errors.timezone ? <p className="text-13 text-status-critical">{errors.timezone.message}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Weight unit</Label>
            <Controller
              control={control}
              name="weightUnit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-stale-health">Flag health as overdue after (days)</Label>
            <Input id="org-stale-health" type="number" min={1} {...register("staleHealthDays")} />
            {errors.staleHealthDays ? <p className="text-13 text-status-critical">{errors.staleHealthDays.message}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-card border border-line p-3">
          <Controller
            control={control}
            name="financeEnabled"
            render={({ field }) => (
              <Checkbox id="org-finance" checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
            )}
          />
          <div>
            <Label htmlFor="org-finance" className="font-normal">
              Show cost fields and the Financial report
            </Label>
            <p className="text-13 text-muted-foreground">Off by default. Turning this on doesn't change any past record.</p>
          </div>
        </div>

        <div>
          <Button type="submit" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
