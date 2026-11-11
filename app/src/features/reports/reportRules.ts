import type { AlertRule, TriggeredAlert } from "@/features/alerts/api";
import type { Sensor, SensorType } from "@/features/parameters/api";
import type { Reading } from "@/features/readings/api";
import type { ForecastDay, Property, Station, StationForecast } from "@/features/stations/api";

export type CanonicalReportType = "history" | "forecast" | "alerts";

export type ReportTypeOption = {
  type: CanonicalReportType;
  label: string;
  shortLabel: string;
  description: string;
  badgeText: string;
};

export type ReportFilterInput = {
  reportType: string;
  stationId?: number | string | null;
  propertyId?: number | string | null;
  startDate?: string;
  endDate?: string;
  days?: number | string | null;
};

export type ValidatedReportFilters = {
  valid: boolean;
  errors: string[];
  reportType: CanonicalReportType;
  stationId: number | null;
  propertyId: number | null;
  fromIso: string | null;
  toIso: string | null;
  days: number;
};

export type HistorySensorSummary = {
  sensor_type_id: number;
  sensor_type: string;
  unit_of_measure: string;
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  stddev: number | null;
  accumulated: number | null;
};

export type HistoryReadingItem = {
  id: number;
  sensor_id: number;
  sensor_type_id: number;
  sensor_type: string;
  unit_of_measure: string;
  value: number;
  unix_time: number;
  date_time: string;
  data_consistent: boolean;
};

export type HistoryReport = {
  report_type: "history";
  generated_at: string;
  period: {
    from: string;
    to: string;
  };
  station: { id: number; name: string } | null;
  property: { id: number; name: string } | null;
  total_readings: number;
  summary: HistorySensorSummary[];
  readings: HistoryReadingItem[];
};

export type ForecastDayItem = {
  date: string;
  temperature_max: number | null;
  temperature_min: number | null;
  precipitation_mm: number | null;
  precipitation_probability: number | null;
  wind_speed_max_kmh: number | null;
  weather_code: number | null;
  weather_description: string;
};

export type ForecastReport = {
  report_type: "forecast";
  generated_at: string;
  period: {
    from: string;
    to: string;
  };
  station: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
  property: { id: number; name: string } | null;
  source: string;
  total_days: number;
  days: ForecastDayItem[];
};

export type AlertReportItem = {
  id: number;
  station_id: number;
  station_name: string;
  sensor_id: number;
  sensor_type: string;
  rule_name: string;
  condition: string;
  threshold_value: number;
  reading_value: number | null;
  unit_of_measure: string;
  triggered_at: string;
  status: "pending" | "acknowledged";
};

export type AlertsReport = {
  report_type: "alerts";
  generated_at: string;
  period: {
    from: string;
    to: string;
  };
  station: { id: number; name: string } | null;
  property: { id: number; name: string } | null;
  total_alerts: number;
  alerts: AlertReportItem[];
};

export type GeneratedReport = HistoryReport | ForecastReport | AlertsReport;

export type ReportSummaryMetrics = {
  totalItems: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  tertiaryMetricLabel: string;
  tertiaryMetricValue: string;
};

export const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    type: "history",
    label: "Relatório de Histórico de Leituras",
    shortLabel: "Histórico",
    description: "Consolida leituras brutas, médias, extremos, desvios e acumulados por tipo de sensor.",
    badgeText: "Telemetria e Consistência",
  },
  {
    type: "forecast",
    label: "Relatório de Previsão Meteorológica",
    shortLabel: "Previsão",
    description: "Apresenta a tendência climática diária com extremos térmicos, chuva esperada e rajadas de vento.",
    badgeText: "Planejamento Agrícola",
  },
  {
    type: "alerts",
    label: "Relatório de Alertas e Ocorrências",
    shortLabel: "Alertas",
    description: "Reúne alertas críticos disparados por sensor, limites violados e status de reconhecimento.",
    badgeText: "Risco e Auditoria",
  },
];

const REPORT_TYPE_ALIASES: Record<string, CanonicalReportType> = {
  history: "history",
  historico: "history",
  "histórico": "history",
  forecast: "forecast",
  previsao: "forecast",
  "previsão": "forecast",
  alerts: "alerts",
  alerta: "alerts",
  alertas: "alerts",
};

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: "Céu limpo",
  1: "Predominantemente limpo",
  2: "Parcialmente nublado",
  3: "Encoberto",
  45: "Nevoeiro",
  48: "Nevoeiro com geada",
  51: "Garoa leve",
  53: "Garoa moderada",
  55: "Garoa intensa",
  61: "Chuva fraca",
  63: "Chuva moderada",
  65: "Chuva forte",
  71: "Neve fraca",
  80: "Pancadas de chuva leves",
  81: "Pancadas de chuva moderadas",
  82: "Pancadas de chuva fortes",
  95: "Tempestade",
  96: "Tempestade com granizo leve",
  99: "Tempestade severa com granizo",
};

export function normalizeReportType(value: string | null | undefined): CanonicalReportType | null {
  if (!value || typeof value !== "string") return null;
  const cleaned = value.trim().toLowerCase();
  return REPORT_TYPE_ALIASES[cleaned] ?? null;
}

export function getReportTypeOption(type: CanonicalReportType): ReportTypeOption {
  return REPORT_TYPE_OPTIONS.find((opt) => opt.type === type) ?? REPORT_TYPE_OPTIONS[0]!;
}

export function describeWeatherCode(code: number | null | undefined): string {
  if (code === null || code === undefined || !Number.isFinite(code)) {
    return "Condição não informada";
  }
  return WEATHER_CODE_DESCRIPTIONS[code] ?? `Código meteorológico ${code}`;
}

export function parseFlexibleDate(value: string | undefined, isEndOfDay = false): Date | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);
    const hours = isEndOfDay ? 23 : 0;
    const minutes = isEndOfDay ? 59 : 0;
    const seconds = isEndOfDay ? 59 : 0;
    const ms = isEndOfDay ? 999 : 0;
    const candidate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, ms));
    if (
      candidate.getUTCFullYear() !== year ||
      candidate.getUTCMonth() !== month - 1 ||
      candidate.getUTCDate() !== day
    ) {
      return null;
    }
    return candidate;
  }

  const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]);
    const day = Number(isoDateMatch[3]);
    const hours = isEndOfDay ? 23 : 0;
    const minutes = isEndOfDay ? 59 : 0;
    const seconds = isEndOfDay ? 59 : 0;
    const ms = isEndOfDay ? 999 : 0;
    const candidate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, ms));
    if (
      candidate.getUTCFullYear() !== year ||
      candidate.getUTCMonth() !== month - 1 ||
      candidate.getUTCDate() !== day
    ) {
      return null;
    }
    return candidate;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parsePositiveId(raw: number | string | null | undefined): { value: number | null; invalid: boolean } {
  if (raw === null || raw === undefined || raw === "" || raw === "all") {
    return { value: null, invalid: false };
  }
  const num = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isInteger(num) || num <= 0) {
    return { value: null, invalid: true };
  }
  return { value: num, invalid: false };
}

export function validateReportFilters(input: ReportFilterInput): ValidatedReportFilters {
  const errors: string[] = [];
  const normalizedType = normalizeReportType(input.reportType);
  if (!normalizedType) {
    errors.push("Selecione um tipo de relatório válido (Histórico, Previsão ou Alertas).");
  }
  const reportType: CanonicalReportType = normalizedType ?? "history";

  const stationParsed = parsePositiveId(input.stationId);
  if (stationParsed.invalid) {
    errors.push("O identificador da estação informada é inválido.");
  }

  const propertyParsed = parsePositiveId(input.propertyId);
  if (propertyParsed.invalid) {
    errors.push("O identificador da propriedade informada é inválido.");
  }

  if (reportType === "forecast" && stationParsed.value === null && !stationParsed.invalid) {
    errors.push("Selecione uma estação meteorológica para gerar o relatório de previsão.");
  }

  let days = 7;
  if (input.days !== undefined && input.days !== null && input.days !== "") {
    const parsedDays = Number(input.days);
    if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 16) {
      errors.push("O horizonte de previsão deve estar entre 1 e 16 dias.");
    } else {
      days = parsedDays;
    }
  }

  let fromIso: string | null = null;
  let toIso: string | null = null;

  if (reportType !== "forecast") {
    const hasStart = Boolean(input.startDate && input.startDate.trim());
    const hasEnd = Boolean(input.endDate && input.endDate.trim());

    const startDate = hasStart ? parseFlexibleDate(input.startDate, false) : null;
    const endDate = hasEnd ? parseFlexibleDate(input.endDate, true) : null;

    if (hasStart && !startDate) {
      errors.push("A data inicial informada é inválida. Use o formato DD/MM/AAAA.");
    }
    if (hasEnd && !endDate) {
      errors.push("A data final informada é inválida. Use o formato DD/MM/AAAA.");
    }

    if (startDate && endDate) {
      if (startDate.getTime() > endDate.getTime()) {
        errors.push("A data inicial não pode ser posterior à data final.");
      } else {
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 366) {
          errors.push("O período máximo permitido para consulta de relatório é de 366 dias.");
        }
      }
    }

    if (startDate) fromIso = startDate.toISOString();
    if (endDate) toIso = endDate.toISOString();
  }

  return {
    valid: errors.length === 0,
    errors,
    reportType,
    stationId: stationParsed.value,
    propertyId: propertyParsed.value,
    fromIso,
    toIso,
    days,
  };
}

export function buildReportQueryParams(filters: ValidatedReportFilters): string {
  const params = new URLSearchParams();
  params.set("type", filters.reportType);
  if (filters.stationId !== null) {
    params.set("station_id", String(filters.stationId));
  }
  if (filters.propertyId !== null) {
    params.set("property_id", String(filters.propertyId));
  }
  if (filters.reportType === "forecast") {
    params.set("days", String(filters.days));
  } else {
    if (filters.fromIso) params.set("from", filters.fromIso);
    if (filters.toIso) params.set("to", filters.toIso);
  }
  return params.toString();
}

export type TelemetryComposeSources = {
  stations: Station[];
  properties: Property[];
  sensors: Sensor[];
  sensorTypes: SensorType[];
  readings: Reading[];
  forecast: StationForecast | null;
  alertRules: AlertRule[];
  triggeredAlerts: TriggeredAlert[];
  generatedAt?: string;
};

function isAccumulatedSensorType(name: string, unit: string): boolean {
  const lower = name.toLowerCase();
  const unitLower = unit.toLowerCase();
  return lower.includes("pluv") || lower.includes("chuva") || lower.includes("precip") || unitLower === "mm";
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildReportFromTelemetry(
  filters: ValidatedReportFilters,
  sources: TelemetryComposeSources,
): GeneratedReport {
  const generatedAt = sources.generatedAt ?? new Date(1791936000 * 1000).toISOString();
  const stationObj = filters.stationId
    ? sources.stations.find((s) => s.id === filters.stationId) ?? null
    : null;
  const resolvedPropertyId = filters.propertyId ?? stationObj?.property_id ?? null;
  const propertyObj = resolvedPropertyId
    ? sources.properties.find((p) => p.id === resolvedPropertyId) ?? null
    : null;

  const defaultTo = filters.toIso ?? generatedAt;
  const defaultFrom =
    filters.fromIso ?? new Date(new Date(defaultTo).getTime() - 7 * 86_400_000).toISOString();

  if (filters.reportType === "forecast") {
    const targetStation = stationObj ?? sources.stations[0] ?? {
      id: filters.stationId ?? 1,
      property_id: resolvedPropertyId ?? 1,
      name: `Estação #${filters.stationId ?? 1}`,
      mac_address: "00:00:00:00:00:00",
      latitude: -23.1896,
      longitude: -45.8841,
      last_communication_at: null,
      created_at: generatedAt,
    };

    const rawDays: ForecastDay[] = (sources.forecast?.days ?? []).slice(0, filters.days);
    const days: ForecastDayItem[] = rawDays.map((day) => ({
      date: day.date,
      temperature_max: day.temperature_max,
      temperature_min: day.temperature_min,
      precipitation_mm: day.precipitation_mm,
      precipitation_probability: day.precipitation_probability,
      wind_speed_max_kmh: day.wind_speed_max_kmh,
      weather_code: day.weather_code,
      weather_description: describeWeatherCode(day.weather_code),
    }));

    const firstDate = days[0]?.date ?? defaultFrom.slice(0, 10);
    const lastDate = days[days.length - 1]?.date ?? defaultTo.slice(0, 10);

    return {
      report_type: "forecast",
      generated_at: sources.forecast?.generated_at ?? generatedAt,
      period: {
        from: firstDate,
        to: lastDate,
      },
      station: {
        id: targetStation.id,
        name: targetStation.name,
        latitude: targetStation.latitude ?? sources.forecast?.latitude ?? -23.1896,
        longitude: targetStation.longitude ?? sources.forecast?.longitude ?? -45.8841,
      },
      property: propertyObj ? { id: propertyObj.id, name: propertyObj.name } : null,
      source: sources.forecast?.source ?? "open-meteo",
      total_days: days.length,
      days,
    };
  }

  const allowedStationIds = new Set(
    sources.stations
      .filter((s) => {
        if (filters.stationId !== null && s.id !== filters.stationId) return false;
        if (filters.propertyId !== null && s.property_id !== filters.propertyId) return false;
        return true;
      })
      .map((s) => s.id),
  );

  const sensorById = new Map(sources.sensors.map((s) => [s.id, s]));
  const sensorTypeById = new Map(sources.sensorTypes.map((t) => [t.id, t]));
  const stationById = new Map(sources.stations.map((s) => [s.id, s]));

  const fromMs = new Date(defaultFrom).getTime();
  const toMs = new Date(defaultTo).getTime();

  if (filters.reportType === "alerts") {
    const ruleById = new Map(sources.alertRules.map((r) => [r.id, r]));

    const alertItems: AlertReportItem[] = sources.triggeredAlerts
      .filter((alert) => {
        const rule = ruleById.get(alert.alert_config_id);
        const sensor = rule ? sensorById.get(rule.sensor_id) : undefined;
        if (sensor && !allowedStationIds.has(sensor.station_id)) {
          return false;
        }
        const triggeredTime = new Date(alert.triggered_at).getTime();
        if (Number.isFinite(fromMs) && triggeredTime < fromMs) return false;
        if (Number.isFinite(toMs) && triggeredTime > toMs) return false;
        return true;
      })
      .map((alert) => {
        const rule = ruleById.get(alert.alert_config_id);
        const sensor = rule ? sensorById.get(rule.sensor_id) : undefined;
        const station = sensor ? stationById.get(sensor.station_id) : undefined;
        const sType = sensor ? sensorTypeById.get(sensor.sensor_type_id) : undefined;
        const operator = rule?.comparison_operator ?? ">";
        const threshold = rule?.reference_value ?? 0;

        return {
          id: alert.id,
          station_id: station?.id ?? filters.stationId ?? 1,
          station_name: station?.name ?? stationObj?.name ?? "Estação Monitorada",
          sensor_id: sensor?.id ?? rule?.sensor_id ?? 0,
          sensor_type: sType?.name ?? "Sensor",
          rule_name: rule?.message ?? `Alerta #${alert.alert_config_id}`,
          condition: `${operator} ${threshold}`,
          threshold_value: threshold,
          reading_value: alert.reading_value,
          unit_of_measure: sType?.unit_of_measure ?? "",
          triggered_at: alert.triggered_at,
          status: alert.acknowledged_at ? "acknowledged" : "pending",
        };
      });

    return {
      report_type: "alerts",
      generated_at: generatedAt,
      period: {
        from: defaultFrom,
        to: defaultTo,
      },
      station: stationObj ? { id: stationObj.id, name: stationObj.name } : null,
      property: propertyObj ? { id: propertyObj.id, name: propertyObj.name } : null,
      total_alerts: alertItems.length,
      alerts: alertItems,
    };
  }

  const filteredReadings = sources.readings.filter((reading) => {
    const sensor = sensorById.get(reading.sensor_id);
    if (!sensor || !allowedStationIds.has(sensor.station_id)) {
      return false;
    }
    const readingMs = reading.unix_time * 1000;
    if (Number.isFinite(fromMs) && readingMs < fromMs) return false;
    if (Number.isFinite(toMs) && readingMs > toMs) return false;
    return true;
  });

  const readingItems: HistoryReadingItem[] = filteredReadings.map((reading) => {
    const sensor = sensorById.get(reading.sensor_id);
    const sType = sensor ? sensorTypeById.get(sensor.sensor_type_id) : undefined;
    return {
      id: reading.id,
      sensor_id: reading.sensor_id,
      sensor_type_id: sType?.id ?? sensor?.sensor_type_id ?? 0,
      sensor_type: sType?.name ?? "Parâmetro",
      unit_of_measure: sType?.unit_of_measure ?? "",
      value: reading.value,
      unix_time: reading.unix_time,
      date_time: new Date(reading.unix_time * 1000).toISOString(),
      data_consistent: reading.data_consistent,
    };
  });

  const groupedByType = new Map<number, HistoryReadingItem[]>();
  for (const item of readingItems) {
    const bucket = groupedByType.get(item.sensor_type_id) ?? [];
    bucket.push(item);
    groupedByType.set(item.sensor_type_id, bucket);
  }

  const summary: HistorySensorSummary[] = Array.from(groupedByType.entries())
    .sort(([a], [b]) => a - b)
    .map(([typeId, items]) => {
      const first = items[0]!;
      const values = items.map((i) => i.value).filter((v) => Number.isFinite(v));
      const count = values.length;
      if (count === 0) {
        return {
          sensor_type_id: typeId,
          sensor_type: first.sensor_type,
          unit_of_measure: first.unit_of_measure,
          count: 0,
          avg: null,
          min: null,
          max: null,
          stddev: null,
          accumulated: null,
        };
      }
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = roundToTwo(sum / count);
      const min = roundToTwo(Math.min(...values));
      const max = roundToTwo(Math.max(...values));
      const variance = values.reduce((acc, v) => acc + (v - sum / count) ** 2, 0) / count;
      const stddev = roundToTwo(Math.sqrt(variance));
      const accumulated = isAccumulatedSensorType(first.sensor_type, first.unit_of_measure)
        ? roundToTwo(sum)
        : null;

      return {
        sensor_type_id: typeId,
        sensor_type: first.sensor_type,
        unit_of_measure: first.unit_of_measure,
        count,
        avg,
        min,
        max,
        stddev,
        accumulated,
      };
    });

  return {
    report_type: "history",
    generated_at: generatedAt,
    period: {
      from: defaultFrom,
      to: defaultTo,
    },
    station: stationObj ? { id: stationObj.id, name: stationObj.name } : null,
    property: propertyObj ? { id: propertyObj.id, name: propertyObj.name } : null,
    total_readings: readingItems.length,
    summary,
    readings: readingItems,
  };
}

export function isReportEmpty(report: GeneratedReport | null | undefined): boolean {
  if (!report) return true;
  if (report.report_type === "history") {
    return report.total_readings === 0 && report.summary.length === 0 && report.readings.length === 0;
  }
  if (report.report_type === "forecast") {
    return report.days.length === 0;
  }
  return report.alerts.length === 0;
}

export function computeReportSummaryMetrics(report: GeneratedReport | null | undefined): ReportSummaryMetrics {
  if (!report) {
    return {
      totalItems: 0,
      primaryMetricLabel: "Registros",
      primaryMetricValue: "0",
      secondaryMetricLabel: "Escopo",
      secondaryMetricValue: "Nenhuma seleção",
      tertiaryMetricLabel: "Status",
      tertiaryMetricValue: "Sem dados",
    };
  }

  if (report.report_type === "history") {
    const consistentCount = report.readings.filter((r) => r.data_consistent).length;
    const consistencyPct =
      report.readings.length > 0
        ? `${Math.round((consistentCount / report.readings.length) * 100)}%`
        : "0%";

    return {
      totalItems: report.total_readings,
      primaryMetricLabel: "Total de Leituras",
      primaryMetricValue: String(report.total_readings),
      secondaryMetricLabel: "Parâmetros Consolidados",
      secondaryMetricValue: String(report.summary.length),
      tertiaryMetricLabel: "Taxa de Consistência",
      tertiaryMetricValue: consistencyPct,
    };
  }

  if (report.report_type === "forecast") {
    const maxTemp =
      report.days.length > 0
        ? Math.max(...report.days.map((d) => d.temperature_max ?? -Infinity))
        : null;
    const totalRain = report.days.reduce((acc, d) => acc + (d.precipitation_mm ?? 0), 0);

    return {
      totalItems: report.total_days,
      primaryMetricLabel: "Dias Previstos",
      primaryMetricValue: String(report.total_days),
      secondaryMetricLabel: "Pico Térmico Previsto",
      secondaryMetricValue: maxTemp !== null && Number.isFinite(maxTemp) ? `${maxTemp.toFixed(1)} °C` : "—",
      tertiaryMetricLabel: "Chuva Acumulada Prevista",
      tertiaryMetricValue: `${totalRain.toFixed(1)} mm`,
    };
  }

  const pendingCount = report.alerts.filter((a) => a.status === "pending").length;
  const acknowledgedCount = report.alerts.filter((a) => a.status === "acknowledged").length;

  return {
    totalItems: report.total_alerts,
    primaryMetricLabel: "Total de Alertas",
    primaryMetricValue: String(report.total_alerts),
    secondaryMetricLabel: "Alertas Pendentes",
    secondaryMetricValue: String(pendingCount),
    tertiaryMetricLabel: "Alertas Reconhecidos",
    tertiaryMetricValue: String(acknowledgedCount),
  };
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

export function buildReportCsv(report: GeneratedReport | null | undefined): string {
  if (!report || isReportEmpty(report)) return "";

  if (report.report_type === "history") {
    const headers = [
      "ID Leitura",
      "Sensor ID",
      "Parametro",
      "Valor",
      "Unidade",
      "Data/Hora ISO",
      "Consistente",
    ];
    const rows = report.readings.map((r) =>
      [
        escapeCsvCell(r.id),
        escapeCsvCell(r.sensor_id),
        escapeCsvCell(r.sensor_type),
        escapeCsvCell(r.value),
        escapeCsvCell(r.unit_of_measure),
        escapeCsvCell(r.date_time),
        escapeCsvCell(r.data_consistent ? "Sim" : "Não"),
      ].join(";"),
    );
    return [headers.join(";"), ...rows].join("\n");
  }

  if (report.report_type === "forecast") {
    const headers = [
      "Data",
      "Estacao",
      "Temp Min (C)",
      "Temp Max (C)",
      "Chuva (mm)",
      "Probabilidade Chuva (%)",
      "Vento Max (km/h)",
      "Condicao",
    ];
    const rows = report.days.map((d) =>
      [
        escapeCsvCell(d.date),
        escapeCsvCell(report.station.name),
        escapeCsvCell(d.temperature_min),
        escapeCsvCell(d.temperature_max),
        escapeCsvCell(d.precipitation_mm),
        escapeCsvCell(d.precipitation_probability),
        escapeCsvCell(d.wind_speed_max_kmh),
        escapeCsvCell(d.weather_description),
      ].join(";"),
    );
    return [headers.join(";"), ...rows].join("\n");
  }

  const headers = [
    "ID Alerta",
    "Estacao",
    "Sensor ID",
    "Parametro",
    "Regra",
    "Condicao",
    "Valor Medido",
    "Unidade",
    "Disparado Em",
    "Status",
  ];
  const rows = report.alerts.map((a) =>
    [
      escapeCsvCell(a.id),
      escapeCsvCell(a.station_name),
      escapeCsvCell(a.sensor_id),
      escapeCsvCell(a.sensor_type),
      escapeCsvCell(a.rule_name),
      escapeCsvCell(a.condition),
      escapeCsvCell(a.reading_value ?? ""),
      escapeCsvCell(a.unit_of_measure),
      escapeCsvCell(a.triggered_at),
      escapeCsvCell(a.status === "acknowledged" ? "Reconhecido" : "Pendente"),
    ].join(";"),
  );
  return [headers.join(";"), ...rows].join("\n");
}
