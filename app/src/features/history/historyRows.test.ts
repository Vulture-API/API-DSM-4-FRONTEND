import { describe, expect, it } from "vitest";

import { buildHistoryRows, seriesWindow } from "./historyRows";

const station = { id: 7, name: "Estação Sede", property_name: "Fazenda Santa Rita" };
const series = (types: Array<[string, Array<[number, number]>]>) => ({
  from: "", to: "", bucket_minutes: 60,
  series: types.map(([sensor_type, points], i) => ({
    sensor_type_id: i + 1, sensor_type, unit_of_measure: "",
    points: points.map(([t, avg]) => ({ t, avg, min: avg - 1, max: avg + 1 })),
  })),
});

describe("histórico a partir da série agregada", () => {
  it("cobre o período e respeita o limite de pontos do backend", () => {
    expect(seriesWindow(1000 - 7 * 86400, 1000, "1h")).toEqual({ hours: 168, bucketMinutes: 60 });
    expect(seriesWindow(1000 - 30 * 86400, 1000, "10m")).toEqual({ hours: 720, bucketMinutes: 87 });
    expect(seriesWindow(1000 - 3600, 1000, "1d")).toEqual({ hours: 1, bucketMinutes: 1440 });
  });

  it("monta uma linha por estação e intervalo, sem inventar medições ausentes", () => {
    const rows = buildHistoryRows(
      [{ station, series: series([["Temperatura", [[100, 36], [200, 20]]], ["Umidade", [[200, 25]]]]) as never }],
      { start: 0, end: 1000, aggregation: "avg", sensorFilter: "all" },
    );
    expect(rows.map((r) => [r.unixTime, r.temp, r.humidity, r.wind, r.rain])).toEqual([
      [200, 20, 25, null, null],
      [100, 36, null, null, null],
    ]);
    expect(rows[1]!.alertMessage).toBe("Temp. acima de 35 °C");
    expect(rows[0]!.warnMessage).toBe("Umidade relativa baixa");
    expect(rows[0]!.windDir).toBe("");
  });

  it("aplica agregação, tipo de sensor e recorte do período", () => {
    const data = [{ station, series: series([["Temperatura", [[100, 30], [900, 31]]], ["Umidade", [[100, 50]]]]) as never }];
    const rows = buildHistoryRows(data, { start: 0, end: 500, aggregation: "max", sensorFilter: "Temperatura" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ unixTime: 100, temp: 31, humidity: null });
    expect(buildHistoryRows([{ station, series: undefined }], { start: 0, end: 1, aggregation: "avg", sensorFilter: "all" })).toEqual([]);
  });
});
