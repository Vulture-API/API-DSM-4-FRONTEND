"use client";

import { useCan } from "@/features/auth/AuthProvider";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type SeriesOptions,
  type StationInput,
  type StatisticsQuery,
  stationsApi,
} from "./api";

export const stationKeys = {
  all: ["stations"] as const,
  list: () => [...stationKeys.all, "list"] as const,
  detail: (id: number) => [...stationKeys.all, "detail", id] as const,
  properties: () => [...stationKeys.all, "properties"] as const,
  overview: (propertyId?: number) => [...stationKeys.all, "overview", propertyId ?? "all"] as const,
  networkSeries: (options: SeriesOptions) => [...stationKeys.all, "series", options] as const,
  stationSeries: (id: number, options: SeriesOptions) => [...stationKeys.all, "series", id, options] as const,
  statistics: (options: StatisticsQuery) => [...stationKeys.all, "statistics", options] as const,
  stationStatistics: (id: number, options: { from?: string; to?: string }) =>
    [...stationKeys.all, "statistics", id, options] as const,
  forecast: (id: number, days: number) => [...stationKeys.all, "forecast", id, days] as const,
  current: (options: { station_id?: number; property_id?: number }) =>
    [...stationKeys.all, "current", options] as const,
  status: (id: number) => [...stationKeys.all, "status", id] as const,
};

/** Status muda na escala de minutos: polling a cada 30 s (ADR-003). */
const LIVE = 30_000;

export const useStations = () => useQuery({ enabled: useCan("stations.read"), queryKey: stationKeys.list(), queryFn: stationsApi.list });

export const useStation = (id: number) =>
  useQuery({ enabled: useCan("stations.read"), queryKey: stationKeys.detail(id), queryFn: () => stationsApi.get(id) });

export const useProperties = () =>
  useQuery({ enabled: useCan("properties.read"), queryKey: stationKeys.properties(), queryFn: stationsApi.properties, staleTime: 5 * 60_000 });

export const useOverview = (propertyId?: number) =>
  useQuery({
    enabled: useCan("monitoring.read"), queryKey: stationKeys.overview(propertyId),
    queryFn: () => stationsApi.overview(propertyId),
    refetchInterval: LIVE,
  });

/** Série agregada de uma estação (stationId) ou da rede toda / propriedade. */
export const useSeries = (options: SeriesOptions & { stationId?: number | undefined }) => {
  const { stationId, ...rest } = options;
  return useQuery({
    enabled: useCan("monitoring.read"), queryKey: stationId ? stationKeys.stationSeries(stationId, rest) : stationKeys.networkSeries(rest),
    queryFn: () => (stationId ? stationsApi.stationSeries(stationId, rest) : stationsApi.networkSeries(rest)),
    refetchInterval: LIVE * 2,
    placeholderData: (previous) => previous,
  });
};

export function useSaveStation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: StationInput }) =>
      id ? stationsApi.update(id, input) : stationsApi.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: stationKeys.all }),
  });
}

export function useDeleteStation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: stationsApi.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: stationKeys.all }),
  });
}

export function useStatistics(options: StatisticsQuery = {}) {
  return useQuery({
    enabled: useCan("monitoring.read"), queryKey: stationKeys.statistics(options),
    queryFn: () => stationsApi.statistics(options),
  });
}

export function useStationStatistics(id: number, options: { from?: string; to?: string } = {}) {
  return useQuery({
    enabled: useCan("monitoring.read"), queryKey: stationKeys.stationStatistics(id, options),
    queryFn: () => stationsApi.stationStatistics(id, options),
  });
}

export function useForecast(id: number | undefined, days = 7) {
  const canRead = useCan("monitoring.read");
  return useQuery({
    enabled: canRead && id !== undefined, queryKey: stationKeys.forecast(id ?? 0, days),
    queryFn: () => stationsApi.forecast(id!, days),
  });
}

export function useCurrentData(options: { station_id?: number; property_id?: number } = {}) {
  return useQuery({
    enabled: useCan("monitoring.read"), queryKey: stationKeys.current(options),
    queryFn: () => stationsApi.current(options),
    refetchInterval: LIVE,
  });
}

export function useStationStatus(id: number) {
  return useQuery({
    enabled: useCan("monitoring.read"), queryKey: stationKeys.status(id),
    queryFn: () => stationsApi.status(id),
    refetchInterval: LIVE,
  });
}
