import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchAttentionSummaryReport,
  fetchBreedingPerformanceReport,
  fetchInventoryReport,
  fetchMonthlyCountReport,
  fetchVaccinationComplianceReport,
  fetchWeightGrowthReport,
  type MonthlyCountViewName,
  type ReportParams,
} from "./api";

export function useInventoryReport(orgId: string | undefined, params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.data(orgId ?? "", "inventory", params),
    queryFn: () => fetchInventoryReport(params),
    enabled: !!orgId,
  });
}

export function useVaccinationComplianceReport(orgId: string | undefined, params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.data(orgId ?? "", "vaccination-compliance", params),
    queryFn: () => fetchVaccinationComplianceReport(params),
    enabled: !!orgId,
  });
}

export function useAttentionSummaryReport(orgId: string | undefined, params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.data(orgId ?? "", "attention-summary", params),
    queryFn: () => fetchAttentionSummaryReport(params),
    enabled: !!orgId,
  });
}

export function useBreedingPerformanceReport(orgId: string | undefined, params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.data(orgId ?? "", "breeding-performance", params),
    queryFn: () => fetchBreedingPerformanceReport(params),
    enabled: !!orgId,
  });
}

export function useWeightGrowthReport(orgId: string | undefined, params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.data(orgId ?? "", "weight-growth", params),
    queryFn: () => fetchWeightGrowthReport(params),
    enabled: !!orgId,
  });
}

export function useMonthlyCountReport(orgId: string | undefined, view: MonthlyCountViewName, params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.data(orgId ?? "", view, params),
    queryFn: () => fetchMonthlyCountReport(view, params),
    enabled: !!orgId,
  });
}
