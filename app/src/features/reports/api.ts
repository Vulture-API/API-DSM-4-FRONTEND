import { alertsApi } from "@/features/alerts/api";
import { parametersApi } from "@/features/parameters/api";
import { readingsApi } from "@/features/readings/api";
import { stationsApi } from "@/features/stations/api";
import { ApiError, request } from "@/lib/api/http";
import {
  type GeneratedReport,
  type ValidatedReportFilters,
  buildReportFromTelemetry,
  buildReportQueryParams,
} from "./reportRules";

export const reportsApi = {
  generate: async (filters: ValidatedReportFilters): Promise<GeneratedReport> => {
    const qs = buildReportQueryParams(filters);
    try {
      const result = await request<GeneratedReport>(`/api/reports?${qs}`);
      if (result && typeof result === "object" && "report_type" in result) {
        return result;
      }
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error;
      }
    }

    const [stations, properties, sensors, sensorTypes] = await Promise.all([
      stationsApi.list(),
      stationsApi.properties(),
      parametersApi.sensors(filters.stationId ?? undefined),
      parametersApi.sensorTypes(),
    ]);

    if (filters.reportType === "forecast") {
      const targetStationId = filters.stationId ?? stations[0]?.id ?? 1;
      const forecast = await stationsApi.forecast(targetStationId, filters.days);
      return buildReportFromTelemetry(filters, {
        stations,
        properties,
        sensors,
        sensorTypes,
        readings: [],
        forecast,
        alertRules: [],
        triggeredAlerts: [],
      });
    }

    if (filters.reportType === "alerts") {
      const [alertRules, pendingPage, ackPage] = await Promise.all([
        alertsApi.rules(),
        alertsApi.triggered(false, 1, 100),
        alertsApi.triggered(true, 1, 100),
      ]);
      return buildReportFromTelemetry(filters, {
        stations,
        properties,
        sensors,
        sensorTypes,
        readings: [],
        forecast: null,
        alertRules,
        triggeredAlerts: [...pendingPage.data, ...ackPage.data],
      });
    }

    const startUnix = filters.fromIso
      ? Math.floor(new Date(filters.fromIso).getTime() / 1000)
      : undefined;
    const endUnix = filters.toIso
      ? Math.floor(new Date(filters.toIso).getTime() / 1000)
      : undefined;
    const readingsPage = await readingsApi.list({
      start_unix_time: startUnix,
      end_unix_time: endUnix,
      page: 1,
      limit: 100,
    });

    return buildReportFromTelemetry(filters, {
      stations,
      properties,
      sensors,
      sensorTypes,
      readings: readingsPage.data,
      forecast: null,
      alertRules: [],
      triggeredAlerts: [],
    });
  },
};
