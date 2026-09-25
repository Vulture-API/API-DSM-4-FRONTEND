"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { stationKeys } from "@/features/stations/hooks";

import { alertsApi, type AlertRuleInput } from "./api";

export const alertKeys = {
  all: ["alerts"] as const,
  rules: ["alerts", "rules"] as const,
  triggered: (acknowledged: boolean, page: number, limit: number) =>
    ["alerts", "triggered", acknowledged, page, limit] as const,
  pending: ["alerts", "pending-count"] as const,
};

export const useAlertRules = () => useQuery({ queryKey: alertKeys.rules, queryFn: alertsApi.rules });

/** `poll: false` para consultas auxiliares (contadores) que não precisam de polling próprio. */
export const useTriggeredAlerts = (acknowledged: boolean, page: number, limit = 15, { poll = true } = {}) =>
  useQuery({
    queryKey: alertKeys.triggered(acknowledged, page, limit),
    queryFn: () => alertsApi.triggered(acknowledged, page, limit),
    placeholderData: keepPreviousData,
    refetchInterval: poll ? 30_000 : false,
  });

/** Contador do sino no header. */
export function usePendingAlertCount(): number {
  const { data } = useQuery({
    queryKey: alertKeys.pending,
    queryFn: alertsApi.pendingCount,
    refetchInterval: 30_000,
  });
  return data ?? 0;
}

function invalidateAlerts(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: alertKeys.all });
  void client.invalidateQueries({ queryKey: stationKeys.all });
}

export function useSaveRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AlertRuleInput }) =>
      id ? alertsApi.updateRule(id, input) : alertsApi.createRule(input),
    onSuccess: () => invalidateAlerts(client),
  });
}

export function useDeleteRule() {
  const client = useQueryClient();
  return useMutation({ mutationFn: alertsApi.removeRule, onSuccess: () => invalidateAlerts(client) });
}

export function useAcknowledge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) => alertsApi.acknowledge(id, userId),
    onSuccess: () => invalidateAlerts(client),
  });
}
