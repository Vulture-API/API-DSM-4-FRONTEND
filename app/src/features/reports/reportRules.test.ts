import { describe, expect, it } from "vitest";
import type { AlertRule, TriggeredAlert } from "@/features/alerts/api";
import type { Sensor, SensorType } from "@/features/parameters/api";
import type { Reading } from "@/features/readings/api";
import type { Property, Station, StationForecast } from "@/features/stations/api";
import {
  type AlertsReport,
  type ForecastReport,
  type HistoryReport,
  buildReportCsv,
  buildReportFromTelemetry,
  buildReportQueryParams,
  computeReportSummaryMetrics,
  describeWeatherCode,
  getReportTypeOption,
  isReportEmpty,
  normalizeReportType,
  parseFlexibleDate,
  validateReportFilters,
} from "./reportRules";

const fictionalProperties: Property[] = [
  { id: 1, name: "Fazenda Vale Verde", location: "São José dos Campos - SP" },
  { id: 2, name: "Sítio Serra Azul", location: "Taubaté - SP" },
];

const fictionalStations: Station[] = [
  {
    id: 10,
    property_id: 1,
    mac_address: "AA:BB:CC:DD:EE:01",
    name: "Estação Pomar Norte",
    latitude: -23.1896,
    longitude: -45.8841,
    last_communication_at: "2026-10-14T10:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 20,
    property_id: 2,
    mac_address: "AA:BB:CC:DD:EE:02",
    name: "Estação Talhão Sul",
    latitude: -23.0123,
    longitude: -45.5555,
    last_communication_at: "2026-10-14T09:30:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const fictionalSensorTypes: SensorType[] = [
  { id: 1, name: "Temperatura", unit_of_measure: "°C", factor: 1, gain: 0 },
  { id: 2, name: "Índice Pluviométrico", unit_of_measure: "mm", factor: 1, gain: 0 },
];

const fictionalSensors: Sensor[] = [
  {
    id: 100,
    station_id: 10,
    sensor_type_id: 1,
    local_identifier: "temp_1",
    operational_status: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 101,
    station_id: 10,
    sensor_type_id: 2,
    local_identifier: "pluv_1",
    operational_status: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 200,
    station_id: 20,
    sensor_type_id: 1,
    local_identifier: "temp_2",
    operational_status: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const fictionalReadings: Reading[] = [
  {
    id: 1,
    sensor_id: 100,
    value: 20,
    unix_time: Math.floor(new Date("2026-10-10T12:00:00.000Z").getTime() / 1000),
    data_consistent: true,
    created_at: "2026-10-10T12:00:00.000Z",
  },
  {
    id: 2,
    sensor_id: 100,
    value: 30,
    unix_time: Math.floor(new Date("2026-10-11T12:00:00.000Z").getTime() / 1000),
    data_consistent: false,
    created_at: "2026-10-11T12:00:00.000Z",
  },
  {
    id: 3,
    sensor_id: 101,
    value: 12.5,
    unix_time: Math.floor(new Date("2026-10-11T14:00:00.000Z").getTime() / 1000),
    data_consistent: true,
    created_at: "2026-10-11T14:00:00.000Z",
  },
  {
    id: 4,
    sensor_id: 101,
    value: 7.5,
    unix_time: Math.floor(new Date("2026-10-12T14:00:00.000Z").getTime() / 1000),
    data_consistent: true,
    created_at: "2026-10-12T14:00:00.000Z",
  },
  {
    id: 5,
    sensor_id: 200,
    value: 18,
    unix_time: Math.floor(new Date("2026-10-12T15:00:00.000Z").getTime() / 1000),
    data_consistent: true,
    created_at: "2026-10-12T15:00:00.000Z",
  },
];

const fictionalForecast: StationForecast = {
  station_id: 10,
  latitude: -23.1896,
  longitude: -45.8841,
  source: "open-meteo",
  generated_at: "2026-10-14T00:00:00.000Z",
  days: [
    {
      date: "2026-10-14",
      temperature_max: 29.4,
      temperature_min: 18.1,
      precipitation_mm: 0,
      precipitation_probability: 10,
      wind_speed_max_kmh: 14,
      weather_code: 0,
    },
    {
      date: "2026-10-15",
      temperature_max: 26.2,
      temperature_min: 17.0,
      precipitation_mm: 15.5,
      precipitation_probability: 85,
      wind_speed_max_kmh: 28,
      weather_code: 63,
    },
  ],
};

const fictionalAlertRules: AlertRule[] = [
  {
    id: 50,
    manager_user_id: 1,
    sensor_id: 100,
    reference_value: 28,
    comparison_operator: ">",
    message: "Calor intenso no pomar",
    active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const fictionalTriggeredAlerts: TriggeredAlert[] = [
  {
    id: 500,
    alert_config_id: 50,
    reading_id: 2,
    acknowledged_by: null,
    triggered_at: "2026-10-11T12:05:00.000Z",
    acknowledged_at: null,
    reading_value: 30,
    reading_unix_time: Math.floor(new Date("2026-10-11T12:00:00.000Z").getTime() / 1000),
  },
  {
    id: 501,
    alert_config_id: 50,
    reading_id: 1,
    acknowledged_by: 1,
    triggered_at: "2026-10-12T10:00:00.000Z",
    acknowledged_at: "2026-10-12T11:00:00.000Z",
    reading_value: 29.1,
    reading_unix_time: Math.floor(new Date("2026-10-12T10:00:00.000Z").getTime() / 1000),
  },
];

describe("regras de seleção e metadados de relatórios", () => {
  it("normaliza os tipos de relatórios em inglês e português", () => {
    expect(normalizeReportType("history")).toBe("history");
    expect(normalizeReportType("Histórico")).toBe("history");
    expect(normalizeReportType("FORECAST")).toBe("forecast");
    expect(normalizeReportType("previsao")).toBe("forecast");
    expect(normalizeReportType("alerts")).toBe("alerts");
    expect(normalizeReportType("alerta")).toBe("alerts");
    expect(normalizeReportType("invalido")).toBeNull();
    expect(normalizeReportType("")).toBeNull();
    expect(normalizeReportType(null)).toBeNull();
  });

  it("retorna metadados do tipo de relatório e descrição de códigos meteorológicos", () => {
    expect(getReportTypeOption("history").shortLabel).toBe("Histórico");
    expect(getReportTypeOption("forecast").shortLabel).toBe("Previsão");
    expect(getReportTypeOption("alerts").shortLabel).toBe("Alertas");

    expect(describeWeatherCode(0)).toBe("Céu limpo");
    expect(describeWeatherCode(63)).toBe("Chuva moderada");
    expect(describeWeatherCode(999)).toBe("Código meteorológico 999");
    expect(describeWeatherCode(null)).toBe("Condição não informada");
  });
});

describe("validação de entradas e filtros de relatórios", () => {
  it("interpreta datas válidas em formato brasileiro e ISO e rejeita datas inexistentes", () => {
    const startBr = parseFlexibleDate("07/10/2026", false);
    const endBr = parseFlexibleDate("14/10/2026", true);
    const iso = parseFlexibleDate("2026-10-14", false);

    expect(startBr?.toISOString()).toBe("2026-10-07T00:00:00.000Z");
    expect(endBr?.toISOString()).toBe("2026-10-14T23:59:59.999Z");
    expect(iso?.toISOString()).toBe("2026-10-14T00:00:00.000Z");

    expect(parseFlexibleDate("31/02/2026")).toBeNull();
    expect(parseFlexibleDate("2026-02-30")).toBeNull();
    expect(parseFlexibleDate("texto-invalido")).toBeNull();
    expect(parseFlexibleDate("")).toBeNull();
  });

  it("valida filtros corretos para histórico e gera parâmetros de consulta", () => {
    const validated = validateReportFilters({
      reportType: "history",
      stationId: "10",
      propertyId: "1",
      startDate: "07/10/2026",
      endDate: "14/10/2026",
    });

    expect(validated.valid).toBe(true);
    expect(validated.errors).toEqual([]);
    expect(validated.stationId).toBe(10);
    expect(validated.propertyId).toBe(1);

    const query = buildReportQueryParams(validated);
    expect(query).toContain("type=history");
    expect(query).toContain("station_id=10");
    expect(query).toContain("property_id=1");
  });

  it("rejeita tipo inválido, estação ausente em previsão e intervalo de datas invertido ou longo", () => {
    const invalidType = validateReportFilters({
      reportType: "desconhecido",
      startDate: "15/10/2026",
      endDate: "10/10/2026",
      stationId: "-5",
      propertyId: "abc",
    });

    expect(invalidType.valid).toBe(false);
    expect(invalidType.errors).toContain("Selecione um tipo de relatório válido (Histórico, Previsão ou Alertas).");
    expect(invalidType.errors).toContain("O identificador da estação informada é inválido.");
    expect(invalidType.errors).toContain("O identificador da propriedade informada é inválido.");
    expect(invalidType.errors).toContain("A data inicial não pode ser posterior à data final.");

    const missingStationForecast = validateReportFilters({
      reportType: "forecast",
      stationId: "all",
      days: "25",
    });

    expect(missingStationForecast.valid).toBe(false);
    expect(missingStationForecast.errors).toContain(
      "Selecione uma estação meteorológica para gerar o relatório de previsão.",
    );
    expect(missingStationForecast.errors).toContain(
      "O horizonte de previsão deve estar entre 1 e 16 dias.",
    );

    const exceededPeriod = validateReportFilters({
      reportType: "alerts",
      startDate: "01/01/2025",
      endDate: "15/01/2026",
    });

    expect(exceededPeriod.valid).toBe(false);
    expect(exceededPeriod.errors).toContain(
      "O período máximo permitido para consulta de relatório é de 366 dias.",
    );

    const malformedDates = validateReportFilters({
      reportType: "history",
      startDate: "99/99/2026",
      endDate: "31/02/2026",
    });
    expect(malformedDates.valid).toBe(false);
    expect(malformedDates.errors).toHaveLength(2);
  });
});

describe("organização e formatação dos dados por tipo de relatório", () => {
  it("consolida relatório de histórico com médias, extremos, desvios e acumulado pluviométrico", () => {
    const filters = validateReportFilters({
      reportType: "history",
      stationId: 10,
      propertyId: 1,
      startDate: "09/10/2026",
      endDate: "13/10/2026",
    });

    const report = buildReportFromTelemetry(filters, {
      stations: fictionalStations,
      properties: fictionalProperties,
      sensors: fictionalSensors,
      sensorTypes: fictionalSensorTypes,
      readings: fictionalReadings,
      forecast: null,
      alertRules: [],
      triggeredAlerts: [],
      generatedAt: "2026-10-14T00:00:00.000Z",
    }) as HistoryReport;

    expect(report.report_type).toBe("history");
    expect(report.station?.name).toBe("Estação Pomar Norte");
    expect(report.property?.name).toBe("Fazenda Vale Verde");
    expect(report.total_readings).toBe(4);
    expect(report.summary).toHaveLength(2);

    const tempSummary = report.summary.find((s) => s.sensor_type_id === 1)!;
    expect(tempSummary.count).toBe(2);
    expect(tempSummary.avg).toBe(25);
    expect(tempSummary.min).toBe(20);
    expect(tempSummary.max).toBe(30);
    expect(tempSummary.stddev).toBe(5);
    expect(tempSummary.accumulated).toBeNull();

    const rainSummary = report.summary.find((s) => s.sensor_type_id === 2)!;
    expect(rainSummary.count).toBe(2);
    expect(rainSummary.accumulated).toBe(20);

    const metrics = computeReportSummaryMetrics(report);
    expect(metrics.primaryMetricValue).toBe("4");
    expect(metrics.secondaryMetricValue).toBe("2");
    expect(metrics.tertiaryMetricValue).toBe("75%");
  });

  it("organiza relatório de previsão meteorológica com descrições traduzidas e métricas", () => {
    const filters = validateReportFilters({
      reportType: "forecast",
      stationId: 10,
      days: 2,
    });

    const report = buildReportFromTelemetry(filters, {
      stations: fictionalStations,
      properties: fictionalProperties,
      sensors: fictionalSensors,
      sensorTypes: fictionalSensorTypes,
      readings: [],
      forecast: fictionalForecast,
      alertRules: [],
      triggeredAlerts: [],
    }) as ForecastReport;

    expect(report.report_type).toBe("forecast");
    expect(report.total_days).toBe(2);
    expect(report.days[0]?.weather_description).toBe("Céu limpo");
    expect(report.days[1]?.weather_description).toBe("Chuva moderada");

    const metrics = computeReportSummaryMetrics(report);
    expect(metrics.primaryMetricValue).toBe("2");
    expect(metrics.secondaryMetricValue).toBe("29.4 °C");
    expect(metrics.tertiaryMetricValue).toBe("15.5 mm");
  });

  it("organiza relatório de alertas com classificação de pendentes e reconhecidos", () => {
    const filters = validateReportFilters({
      reportType: "alerts",
      stationId: 10,
      startDate: "10/10/2026",
      endDate: "13/10/2026",
    });

    const report = buildReportFromTelemetry(filters, {
      stations: fictionalStations,
      properties: fictionalProperties,
      sensors: fictionalSensors,
      sensorTypes: fictionalSensorTypes,
      readings: [],
      forecast: null,
      alertRules: fictionalAlertRules,
      triggeredAlerts: fictionalTriggeredAlerts,
    }) as AlertsReport;

    expect(report.report_type).toBe("alerts");
    expect(report.total_alerts).toBe(2);
    expect(report.alerts[0]?.status).toBe("pending");
    expect(report.alerts[0]?.condition).toBe("> 28");
    expect(report.alerts[1]?.status).toBe("acknowledged");

    const metrics = computeReportSummaryMetrics(report);
    expect(metrics.primaryMetricValue).toBe("2");
    expect(metrics.secondaryMetricValue).toBe("1");
    expect(metrics.tertiaryMetricValue).toBe("1");
  });

  it("trata comportamento quando não há dados disponíveis e exporta CSV estruturado", () => {
    expect(isReportEmpty(null)).toBe(true);
    expect(computeReportSummaryMetrics(null).totalItems).toBe(0);
    expect(buildReportCsv(null)).toBe("");

    const emptyHistory: HistoryReport = {
      report_type: "history",
      generated_at: "2026-10-14T00:00:00.000Z",
      period: { from: "2026-10-07", to: "2026-10-14" },
      station: null,
      property: null,
      total_readings: 0,
      summary: [],
      readings: [],
    };
    expect(isReportEmpty(emptyHistory)).toBe(true);
    expect(buildReportCsv(emptyHistory)).toBe("");

    const populatedForecast: ForecastReport = {
      report_type: "forecast",
      generated_at: "2026-10-14T00:00:00.000Z",
      period: { from: "2026-10-14", to: "2026-10-15" },
      station: { id: 10, name: "Estação Pomar Norte", latitude: -23.1, longitude: -45.8 },
      property: null,
      source: "open-meteo",
      total_days: 1,
      days: [
        {
          date: "2026-10-14",
          temperature_max: 29,
          temperature_min: 18,
          precipitation_mm: 2.5,
          precipitation_probability: 40,
          wind_speed_max_kmh: 12,
          weather_code: 1,
          weather_description: "Predominantemente limpo",
        },
      ],
    };
    const forecastCsv = buildReportCsv(populatedForecast);
    expect(forecastCsv).toContain("Data;Estacao;Temp Min (C)");
    expect(forecastCsv).toContain('"2026-10-14";"Estação Pomar Norte"');
  });
});
