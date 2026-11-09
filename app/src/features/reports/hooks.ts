import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";
import type { ValidatedReportFilters } from "./reportRules";

export const reportKeys = {
  all: ["reports"] as const,
  generate: (filters: ValidatedReportFilters) => ["reports", "generate", filters] as const,
};

export function useReport(filters: ValidatedReportFilters) {
  return useQuery({
    queryKey: reportKeys.generate(filters),
    queryFn: () => reportsApi.generate(filters),
    enabled: filters.valid,
  });
}
