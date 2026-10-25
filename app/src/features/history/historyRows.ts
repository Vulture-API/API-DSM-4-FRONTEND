import type { ReadingSeries, SeriesPoint } from "@/features/stations/api";
import { formatDateTime } from "@/lib/format";

import type { TelemetryRow } from "./HistoryPage";

/** Limite de pontos por série aceito pelo backend (MAX_SERIES_POINTS). */
const MAX_POINTS = 500;
const MAX_HOURS = 720;

const GROUPING_MINUTES: Record<string, number> = { "10m": 10, "30m": 30, "1h": 60, "1d": 1440 };

/**
 * Janela da série agregada que cobre o período pedido. A série é contada a
 * partir de agora; o intervalo é aumentado quando o período não cabe em 500
 * pontos (ex.: 30 dias a cada 10 min vira 30 dias a cada 90 min).
 */
export function seriesWindow(startUnix: number, nowUnix: number, grouping: string) {
  const hours = Math.min(MAX_HOURS, Math.max(1, Math.ceil((nowUnix - startUnix) / 3600)));
  const wanted = GROUPING_MINUTES[grouping] ?? 60;
  const minimum = Math.ceil((hours * 60) / MAX_POINTS);
  return { hours, bucketMinutes: Math.max(5, wanted, minimum) };
}

type Field = "temp" | "humidity" | "wind" | "rain" | "soilTemp" | "soilHum";

const FIELD_BY_TYPE: Record<string, Field> = {
  Temperatura: "temp",
  "Temperatura do Ar": "temp",
  Umidade: "humidity",
  "Velocidade do Vento": "wind",
  "Índice Pluviométrico": "rain",
  "Temperatura do Solo": "soilTemp",
  "Umidade do Solo": "soilHum",
};

type StationInfo = { id: number; name: string; property_name: string };

export type HistoryRowsOptions = {
  start: number;
  end: number;
  aggregation: string;
  sensorFilter: string;
};

function pick(point: SeriesPoint, aggregation: string): number {
  if (aggregation === "min") return point.min;
  if (aggregation === "max") return point.max;
  return point.avg;
}

/**
 * Monta as linhas da tabela só com dados reais da série agregada de cada
 * estação: uma linha por estação e intervalo; medição ausente fica nula.
 */
export function buildHistoryRows(
  data: Array<{ station: StationInfo; series: ReadingSeries | undefined }>,
  { start, end, aggregation, sensorFilter }: HistoryRowsOptions,
): TelemetryRow[] {
  const rows: TelemetryRow[] = [];
  for (const { station, series } of data) {
    const byTime = new Map<number, Partial<Record<Field, number>>>();
    for (const typeSeries of series?.series ?? []) {
      const field = FIELD_BY_TYPE[typeSeries.sensor_type];
      if (!field) continue;
      if (sensorFilter !== "all" && typeSeries.sensor_type !== sensorFilter) continue;
      for (const point of typeSeries.points) {
        if (point.t < start || point.t > end) continue;
        const values = byTime.get(point.t) ?? {};
        values[field] = pick(point, aggregation);
        byTime.set(point.t, values);
      }
    }
    for (const [t, v] of byTime) {
      const temp = v.temp ?? null;
      const humidity = v.humidity ?? null;
      const wind = v.wind ?? null;
      const soilHum = v.soilHum ?? null;
      const isHot = temp !== null && temp >= 35;
      const isDry = humidity !== null && humidity <= 30;
      const isSoilDry = soilHum !== null && soilHum < 38;
      rows.push({
        id: `st-${station.id}-${t}`,
        stationId: station.id,
        stationName: station.name,
        propertyName: station.property_name,
        unixTime: t,
        dateTime: formatDateTime(new Date(t * 1000)),
        temp,
        tempAlert: isHot,
        humidity,
        humidityAlert: isDry,
        wind,
        windDir: "",
        windAlert: wind !== null && wind > 25,
        rain: v.rain ?? null,
        soilTemp: v.soilTemp ?? null,
        soilHum,
        soilAlert: isSoilDry,
        alertMessage: isHot ? "Temp. acima de 35 °C" : isSoilDry ? "Solo seco (< 38%)" : null,
        warnMessage: isDry ? "Umidade relativa baixa" : null,
      });
    }
  }
  return rows.sort((a, b) => b.unixTime - a.unixTime || a.stationName.localeCompare(b.stationName));
}
