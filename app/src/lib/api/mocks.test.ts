import { describe, expect, it } from "vitest";

import {
  getOpenApiMock,
  mockForecast,
  mockOverview,
  mockProperties,
  mockRoles,
  mockSensorTypes,
  mockSensors,
  mockSeries,
  mockStationStatus,
  mockStations,
  mockStatistics,
  mockUsers,
} from "./mocks";

describe("getOpenApiMock", () => {
  it("ignora métodos diferentes de GET", () => {
    expect(getOpenApiMock("/api/stations", "POST")).toBeUndefined();
    expect(getOpenApiMock("/api/stations", "DELETE")).toBeUndefined();
  });

  it("retorna leituras paginadas com filtros de sensor e tempo", () => {
    const resAll = getOpenApiMock<{ data: unknown[]; meta: { total_records: number } }>(
      "/api/readings?page=1&limit=10",
    );
    expect(resAll).toBeDefined();
    expect(resAll?.data).toHaveLength(10);
    expect(resAll?.meta.total_records).toBeGreaterThan(10);

    const resFiltered = getOpenApiMock<{ data: Array<{ sensor_id: number }> }>(
      "/api/readings?sensor_id=10&start_unix_time=100&end_unix_time=9999999999",
    );
    expect(resFiltered).toBeDefined();
    expect(resFiltered?.data.every((r) => r.sensor_id === 10)).toBe(true);
  });

  it("retorna estatísticas meteorológicas e previsão", () => {
    const stats = getOpenApiMock("/api/stations/statistics");
    expect(stats).toEqual(mockStatistics);

    const stationStats = getOpenApiMock("/api/stations/1/statistics");
    expect(stationStats).toEqual(mockStatistics);

    const forecast = getOpenApiMock<{ days: unknown[]; source: string }>("/api/stations/1/forecast?days=3");
    expect(forecast?.days).toHaveLength(3);
    expect(forecast?.source).toBe(mockForecast.source);
  });

  it("retorna dados atuais e status de comunicação da estação", () => {
    const current = getOpenApiMock("/api/stations/current");
    expect(current).toBeDefined();

    const status = getOpenApiMock("/api/stations/1/status");
    expect(status).toEqual(mockStationStatus);
  });

  it("retorna entidades base para as telas de administração e monitoramento", () => {
    expect(getOpenApiMock("/api/stations/overview")).toEqual(mockOverview);
    expect(getOpenApiMock("/api/stations/readings/series")).toEqual(mockSeries);
    expect(getOpenApiMock("/api/stations/properties")).toEqual(mockProperties);
    expect(getOpenApiMock("/api/stations")).toEqual(mockStations);
    expect(getOpenApiMock("/api/sensors")).toEqual(mockSensors);
    expect(getOpenApiMock("/api/sensor-types")).toEqual(mockSensorTypes);
    expect(getOpenApiMock("/api/alerts/config")).toBeDefined();
    expect(getOpenApiMock("/api/alerts/triggered")).toBeDefined();
    expect(getOpenApiMock("/api/users")).toEqual(mockUsers);
    expect(getOpenApiMock("/api/roles")).toEqual(mockRoles);
    expect(getOpenApiMock("/api/rota-inexistente")).toBeUndefined();
  });
});
