"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type SeriesOptions, type StationInput, stationsApi } from "./api";

export const stationKeys = {
  all: ["stations"] as const,
  list: () => [...stationKeys.all, "list"] as const,
  detail: (id: number) => [...stationKeys.all, "detail", id] as const,
  properties: () => [...stationKeys.all, "properties"] as const,
  overview: (propertyId?: number) => [...stationKeys.all, "overview", propertyId ?? "all"] as const,
  networkSeries: (options: SeriesOptions) => [...stationKeys.all, "series", options] as const,
  stationSeries: (id: number, options: SeriesOptions) => [...stationKeys.all, "series", id, options] as const,
};

/** Status muda na escala de minutos: polling a cada 30 s (ADR-003). */
const LIVE = 30_000;

export const useStations = () => useQuery({ queryKey: stationKeys.list(), queryFn: stationsApi.list });

export const useStation = (id: number) =>
  useQuery({ queryKey: stationKeys.detail(id), queryFn: () => stationsApi.get(id) });

export const useProperties = () =>
  useQuery({ queryKey: stationKeys.properties(), queryFn: stationsApi.properties, staleTime: 5 * 60_000 });

export const useOverview = (propertyId?: number) =>
  useQuery({
    queryKey: stationKeys.overview(propertyId),
    queryFn: () => stationsApi.overview(propertyId),
    refetchInterval: LIVE,
  });

/** Série agregada de uma estação (stationId) ou da rede toda / propriedade. */
export const useSeries = (options: SeriesOptions & { stationId?: number | undefined }) => {
  const { stationId, ...rest } = options;
  return useQuery({
    queryKey: stationId ? stationKeys.stationSeries(stationId, rest) : stationKeys.networkSeries(rest),
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
