import type { CurrentData, LiveReading } from "./api";

/** Ignore eventos inválidos e mensagens de outros protocolos. */
export function parseLiveReading(data: unknown): LiveReading | null {
  if (typeof data !== "string") return null;
  try {
    const r = JSON.parse(data);
    if (!r || r.type !== "reading") return null;
    for (const key of ["reading_id", "station_id", "sensor_id", "sensor_type_id"]) {
      if (!Number.isSafeInteger(r[key]) || r[key] <= 0) return null;
    }
    if (!Number.isFinite(r.value) || !Number.isSafeInteger(r.unix_time) || r.unix_time < 0 || r.unix_time > 8_640_000_000_000) return null;
    for (const key of ["local_identifier", "sensor_type", "unit_of_measure"]) {
      if (typeof r[key] !== "string") return null;
    }
    return r as LiveReading;
  } catch {
    return null;
  }
}

/** Não permite que eventos atrasados substituam uma medição mais recente. */
export function mergeReading(data: CurrentData, event: LiveReading): CurrentData {
  return {
    ...data,
    stations: data.stations.map((station) => {
      if (station.station_id !== event.station_id) return station;
      const previous = station.readings.find((r) => r.sensor_id === event.sensor_id);
      if (previous?.unix_time != null && previous.unix_time >= event.unix_time) return station;
      const { sensor_id, local_identifier, sensor_type_id, sensor_type, unit_of_measure, value, unix_time } = event;
      const reading = { sensor_id, local_identifier, sensor_type_id, sensor_type, unit_of_measure, value, unix_time };
      const last = Math.max(event.unix_time * 1000, station.last_update ? Date.parse(station.last_update) : 0);
      return {
        ...station,
        last_update: new Date(last).toISOString(),
        readings: previous
          ? station.readings.map((r) => r.sensor_id === event.sensor_id ? reading : r)
          : [...station.readings, reading],
      };
    }),
  };
}
