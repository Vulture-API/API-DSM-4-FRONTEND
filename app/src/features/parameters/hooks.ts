"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { stationKeys } from "@/features/stations/hooks";

import { parametersApi, type SensorInput, type SensorTypeInput } from "./api";

export const parameterKeys = {
  sensorTypes: ["sensor-types"] as const,
  sensors: (stationId?: number) => ["sensors", stationId ?? "all"] as const,
};

export const useSensorTypes = () =>
  useQuery({ queryKey: parameterKeys.sensorTypes, queryFn: parametersApi.sensorTypes, staleTime: 5 * 60_000 });

export const useSensors = (stationId?: number) =>
  useQuery({ queryKey: parameterKeys.sensors(stationId), queryFn: () => parametersApi.sensors(stationId) });

export function useSaveSensorType() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: SensorTypeInput }) =>
      id ? parametersApi.updateSensorType(id, input) : parametersApi.createSensorType(input),
    onSuccess: () => client.invalidateQueries({ queryKey: parameterKeys.sensorTypes }),
  });
}

export function useDeleteSensorType() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: parametersApi.removeSensorType,
    onSuccess: () => client.invalidateQueries({ queryKey: parameterKeys.sensorTypes }),
  });
}

function invalidateSensors(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["sensors"] });
  void client.invalidateQueries({ queryKey: stationKeys.all });
}

export function useSaveSensor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: SensorInput }) =>
      id ? parametersApi.updateSensor(id, input) : parametersApi.createSensor(input),
    onSuccess: () => invalidateSensors(client),
  });
}

export function useDeleteSensor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: parametersApi.removeSensor,
    onSuccess: () => invalidateSensors(client),
  });
}
