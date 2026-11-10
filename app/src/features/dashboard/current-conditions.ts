import type { CurrentStation } from "@/features/stations/api";

/** Tipos mostrados em "Condições agora", na ordem. */
const CONDITIONS = ["Temperatura", "Umidade", "Velocidade do Vento", "Pressão", "Umidade do Solo"];
/** Leitura mais velha que isso não entra na média "agora". */
const FRESH_SECONDS = 30 * 60;

export function currentConditions(stations: CurrentStation[], nowSeconds = Date.now() / 1000) {
  const groups = new Map<string, { unit: string; values: number[]; stations: Set<number> }>();
  for (const station of stations) {
    const localGroups = new Map<string, { unit: string; values: number[] }>();
    for (const reading of station.readings) {
      if (reading.value === null || !Number.isFinite(reading.value) || reading.unix_time === null || !Number.isFinite(reading.unix_time) ||
          reading.unix_time > nowSeconds || nowSeconds - reading.unix_time > FRESH_SECONDS) continue;
      const group = localGroups.get(reading.sensor_type) ?? { unit: reading.unit_of_measure, values: [] };
      group.values.push(reading.value);
      localGroups.set(reading.sensor_type, group);
    }
    for (const [type, local] of localGroups) {
      const group = groups.get(type) ?? { unit: local.unit, values: [], stations: new Set<number>() };
      group.values.push(local.values.reduce((a, b) => a + b, 0) / local.values.length);
      group.stations.add(station.station_id);
      groups.set(type, group);
    }
  }
  return CONDITIONS.flatMap((type) => {
    const group = groups.get(type);
    if (!group?.values.length) return [];
    return [{
      type, unit: group.unit,
      avg: group.values.reduce((a, b) => a + b, 0) / group.values.length,
      min: Math.min(...group.values), max: Math.max(...group.values),
      stations: group.stations.size,
    }];
  });
}
