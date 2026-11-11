import { describe, expect, it } from "vitest";

import type { CurrentReading, CurrentStation } from "@/features/stations/api";

import { currentConditions } from "./current-conditions";

const now = Date.parse("2026-11-10T12:00:00Z") / 1000;
const reading: CurrentReading = {
  sensor_id: 10, local_identifier: "temp", sensor_type_id: 1,
  sensor_type: "Temperatura", unit_of_measure: "°C", value: 24, unix_time: now,
};
function station(id: number, readings: CurrentReading[]): CurrentStation {
  return { station_id: id, name: `Estação ${id}`, property_id: 1, property_name: "Fazenda", status: "Online", last_update: null, readings };
}

describe("currentConditions", () => {
  it("calcula média por estação sem dar peso extra a sensores do mesmo tipo", () => {
    const stations = [station(1, [reading, { ...reading, sensor_id: 11, value: 28 }]), station(2, [{ ...reading, sensor_id: 20, value: 30 }])];
    const original = structuredClone(stations);
    expect(currentConditions(stations, now)).toEqual([{ type: "Temperatura", unit: "°C", avg: 28, min: 26, max: 30, stations: 2 }]);
    expect(stations).toEqual(original);
  });

  it("preserva a ordem dos parâmetros e admite zero e valores negativos", () => {
    expect(currentConditions([station(1, [{ ...reading, sensor_type: "Umidade", value: 0, unit_of_measure: "%" }, { ...reading, value: -5 }])], now)).toEqual([
      { type: "Temperatura", unit: "°C", avg: -5, min: -5, max: -5, stations: 1 },
      { type: "Umidade", unit: "%", avg: 0, min: 0, max: 0, stations: 1 },
    ]);
  });

  it.each([null, NaN, Infinity, -Infinity])("ignora valor ausente ou inválido %s", (value) => {
    expect(currentConditions([station(1, [{ ...reading, value }])], now)).toEqual([]);
  });

  it.each([null, NaN, Infinity, now + 1, now - 1801])("ignora timestamp ausente, inválido, futuro ou antigo: %s", (unix_time) => {
    expect(currentConditions([station(1, [{ ...reading, unix_time }])], now)).toEqual([]);
  });

  it("inclui os limites de agora e de 30 minutos", () => {
    expect(currentConditions([station(1, [reading]), station(2, [{ ...reading, unix_time: now - 1800, value: 30 }])], now)[0]).toMatchObject({ avg: 27, min: 24, max: 30, stations: 2 });
  });

  it("retorna lista vazia sem estações, sem sensores ou com tipos não exibidos", () => {
    expect(currentConditions([], now)).toEqual([]);
    expect(currentConditions([station(1, [])], now)).toEqual([]);
    expect(currentConditions([station(1, [{ ...reading, sensor_type: "Outro" }])], now)).toEqual([]);
  });
});
