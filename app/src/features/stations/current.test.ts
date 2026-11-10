import { describe, expect, it } from "vitest";

import type { CurrentData, CurrentStation, LiveReading } from "./api";
import { mergeReading } from "./current";

const unix = Date.parse("2026-11-10T12:00:00Z") / 1000;
const event: LiveReading = {
  type: "reading", reading_id: 101, station_id: 1, sensor_id: 10,
  local_identifier: "temp", sensor_type_id: 1, sensor_type: "Temperatura",
  unit_of_measure: "°C", value: 25, unix_time: unix,
};
function data(lastUpdate: string | null): CurrentData {
  const station: CurrentStation = {
    station_id: 1, name: "Estação A", property_id: 1, property_name: "Fazenda",
    status: "Online", last_update: lastUpdate,
    readings: [{ sensor_id: 10, local_identifier: "temp", sensor_type_id: 1,
      sensor_type: "Temperatura", unit_of_measure: "°C", value: 20, unix_time: unix - 60 }],
  };
  return { generated_at: "2026-11-10T12:30:00Z", offline_threshold_minutes: 10,
    stations: [station, { ...station, station_id: 2, name: "Estação B" }] };
}

describe("última atualização em mergeReading", () => {
  it.each([null, "", "inválido", "2026-99-99T00:00:00Z"])("recupera timestamp ausente ou inválido %s com uma medição válida", (previous) => {
    expect(mergeReading(data(previous), event).stations[0]!.last_update).toBe("2026-11-10T12:00:00.000Z");
  });

  it("atualiza somente a estação do evento e preserva o snapshot original", () => {
    const snapshot = data("2026-11-10T11:59:00Z");
    const original = structuredClone(snapshot);
    const result = mergeReading(snapshot, event);
    expect(result.stations[0]!.last_update).toBe("2026-11-10T12:00:00.000Z");
    expect(result.stations[0]!.readings[0]!.value).toBe(25);
    expect(result.stations[1]).toBe(snapshot.stations[1]);
    expect(result.generated_at).toBe(snapshot.generated_at);
    expect(snapshot).toEqual(original);
  });

  it("preserva a última atualização mais recente de outro sensor da estação", () => {
    const result = mergeReading(data("2026-11-10T12:05:00Z"), event);
    expect(result.stations[0]!.last_update).toBe("2026-11-10T12:05:00.000Z");
    expect(result.stations[0]!.readings[0]!.value).toBe(25);
  });

  it.each([unix - 61, unix - 60])("ignora evento antigo ou repetido do mesmo sensor: %s", (unix_time) => {
    const snapshot = data("2026-11-10T12:05:00Z");
    expect(mergeReading(snapshot, { ...event, unix_time }).stations[0]).toBe(snapshot.stations[0]);
  });

  it("adiciona um sensor novo sem regredir a data e ignora estações ausentes", () => {
    const snapshot = data("2026-11-10T12:05:00Z");
    const result = mergeReading(snapshot, { ...event, sensor_id: 11 });
    expect(result.stations[0]!.readings).toHaveLength(2);
    expect(result.stations[0]!.last_update).toBe("2026-11-10T12:05:00.000Z");
    expect(mergeReading(snapshot, { ...event, station_id: 99 })).toEqual(snapshot);
  });

  it("trata a primeira medição de um sensor sem timestamp", () => {
    const snapshot = data(null);
    snapshot.stations[0]!.readings[0]!.unix_time = null;
    expect(mergeReading(snapshot, event).stations[0]!.last_update).toBe("2026-11-10T12:00:00.000Z");
  });
});
