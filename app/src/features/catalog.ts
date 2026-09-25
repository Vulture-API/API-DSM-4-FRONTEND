"use client";

import { useMemo } from "react";

import type { Sensor, SensorType } from "@/features/parameters/api";
import { useSensors, useSensorTypes } from "@/features/parameters/hooks";
import type { Property, Station } from "@/features/stations/api";
import { useProperties, useStations } from "@/features/stations/hooks";

export type CatalogEntry = {
  sensor: Sensor;
  type: SensorType | undefined;
  station: Station | undefined;
  property: Property | undefined;
};

/**
 * Junta sensores, tipos, estações e propriedades num mapa por sensor_id.
 * As telas de alertas e regras só guardam sensor_id; é daqui que saem os
 * nomes. Cada lista vem do cache do TanStack Query, então é barato.
 */
export function useSensorCatalog() {
  const sensors = useSensors();
  const types = useSensorTypes();
  const stations = useStations();
  const properties = useProperties();

  const bySensorId = useMemo(() => {
    const typeById = new Map(types.data?.map((t) => [t.id, t]));
    const stationById = new Map(stations.data?.map((s) => [s.id, s]));
    const propertyById = new Map(properties.data?.map((p) => [p.id, p]));
    return new Map<number, CatalogEntry>(
      (sensors.data ?? []).map((sensor) => {
        const station = stationById.get(sensor.station_id);
        return [
          sensor.id,
          {
            sensor,
            type: typeById.get(sensor.sensor_type_id),
            station,
            property: station ? propertyById.get(station.property_id) : undefined,
          },
        ];
      }),
    );
  }, [sensors.data, types.data, stations.data, properties.data]);

  const queries = [sensors, types, stations, properties];
  return {
    bySensorId,
    stations: stations.data ?? [],
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.forEach((q) => void q.refetch()),
  };
}

export function sensorLabel(entry: CatalogEntry | undefined): string {
  if (!entry) return "Sensor removido";
  return `${entry.type?.name ?? "Sensor"} · ${entry.sensor.local_identifier}`;
}
