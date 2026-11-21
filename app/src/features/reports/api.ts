import { alertsApi } from "@/features/alerts/api";
import { parametersApi } from "@/features/parameters/api";
import { readingsApi } from "@/features/readings/api";
import { stationsApi } from "@/features/stations/api";
import { ApiError, request } from "@/lib/api/http";
import { SESSION_EXPIRED } from "@/lib/auth/policy";
import {
  type ExportRequestPayload,
  type GeneratedReport,
  type ReportExportArtifact,
  type ReportExportFormat,
  type ValidatedReportFilters,
  buildExportRequestPayload,
  buildFilterExportPayload,
  buildLocalExportArtifact,
  buildReportFromTelemetry,
  buildReportQueryParams,
  extractFilenameFromContentDisposition,
  isReportEmpty,
} from "./reportRules";

const EXPORT_TIMEOUT_MS = 25_000;

async function postExportRequest(
  payload: ExportRequestPayload,
): Promise<Response> {
  try {
    return await fetch("/api/backend/reports/export", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept:
          payload.format === "csv"
            ? "text/csv, application/json"
            : "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(EXPORT_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(
      0,
      "Serviço indisponível para exportar o relatório. Tente novamente.",
    );
  }
}

function extractExportErrorMessage(bodyText: string, status: number): string {
  try {
    const parsed = bodyText
      ? (JSON.parse(bodyText) as { message?: unknown })
      : null;
    if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Corpo não é JSON; usa mensagem padrão abaixo.
  }
  return status === 422
    ? "Não existem registros disponíveis para exportação."
    : `Falha ao exportar relatório (erro ${status}).`;
}

export const reportsApi = {
  generate: async (
    filters: ValidatedReportFilters,
  ): Promise<GeneratedReport> => {
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
      const forecast = await stationsApi.forecast(
        targetStationId,
        filters.days,
      );
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

  export: async (
    report: GeneratedReport | null | undefined,
    format: ReportExportFormat,
    filters?: ValidatedReportFilters,
  ): Promise<ReportExportArtifact> => {
    if (!report || isReportEmpty(report)) {
      throw new ApiError(
        422,
        "Não existem dados disponíveis no relatório para exportar.",
      );
    }

    const primaryPayload = buildExportRequestPayload(report, format, filters);
    let response = await postExportRequest(primaryPayload);

    if (response.status === 413 && "report" in primaryPayload) {
      response = await postExportRequest(
        buildFilterExportPayload(report, format, filters),
      );
    }

    if (response.status === 404) {
      return buildLocalExportArtifact(report, format);
    }

    const text = await response.text();
    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new Event(SESSION_EXPIRED));
      }
      if (response.status === 403 && typeof window !== "undefined") {
        window.dispatchEvent(new Event("agritech:permissions-changed"));
      }
      throw new ApiError(
        response.status,
        extractExportErrorMessage(text, response.status),
      );
    }

    const contentType =
      response.headers.get("content-type") ??
      (format === "csv"
        ? "text/csv; charset=utf-8"
        : "application/json; charset=utf-8");
    const filename =
      extractFilenameFromContentDisposition(
        response.headers.get("content-disposition"),
      ) ?? buildLocalExportArtifact(report, format).filename;

    return {
      content: text,
      contentType,
      filename,
    };
  },
};
