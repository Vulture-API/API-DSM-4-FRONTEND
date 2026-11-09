"use client";

import {
  Activity,
  BellRing,
  CheckCircle2,
  CloudSun,
  FileSpreadsheet,
  History,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import {
  type AlertsReport,
  type CanonicalReportType,
  type ForecastReport,
  type GeneratedReport,
  type HistoryReport,
  computeReportSummaryMetrics,
  getReportTypeOption,
  isReportEmpty,
} from "./reportRules";

export type ReportViewerProps = {
  reportType: CanonicalReportType;
  report: GeneratedReport | null | undefined;
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function formatNullableMetric(value: number | null | undefined, unit = ""): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const formatted = formatNumber(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function HistoryReportContent({ report }: { report: HistoryReport }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Resumo Estatístico por Tipo de Sensor"
          description="Médias, extremos, desvios padrão e acumulados calculados para o período selecionado."
          icon={<History className="size-4" />}
          action={
            <Badge tone="brand">
              {report.summary.length} {report.summary.length === 1 ? "parâmetro" : "parâmetros"}
            </Badge>
          }
        />
        <div className="mt-4">
          <Table aria-label="Resumo estatístico do relatório histórico">
            <thead>
              <tr>
                <Th>Parâmetro</Th>
                <Th>Unidade</Th>
                <Th>Leituras</Th>
                <Th>Média</Th>
                <Th>Mínimo</Th>
                <Th>Máximo</Th>
                <Th>Desvio Padrão</Th>
                <Th>Acumulado</Th>
              </tr>
            </thead>
            <tbody>
              {report.summary.map((item) => (
                <Tr key={item.sensor_type_id}>
                  <Td className="font-medium text-ink">{item.sensor_type}</Td>
                  <Td className="font-mono text-xs text-muted">{item.unit_of_measure || "—"}</Td>
                  <Td className="font-mono tabular-nums text-ink">{item.count}</Td>
                  <Td className="font-mono tabular-nums text-ink">
                    {formatNullableMetric(item.avg, item.unit_of_measure)}
                  </Td>
                  <Td className="font-mono tabular-nums text-muted">
                    {formatNullableMetric(item.min, item.unit_of_measure)}
                  </Td>
                  <Td className="font-mono tabular-nums text-muted">
                    {formatNullableMetric(item.max, item.unit_of_measure)}
                  </Td>
                  <Td className="font-mono tabular-nums text-muted">
                    {formatNullableMetric(item.stddev)}
                  </Td>
                  <Td className="font-mono tabular-nums text-ink">
                    {formatNullableMetric(item.accumulated, item.unit_of_measure)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Amostra de Leituras do Período"
          description="Registros individuais recebidos dos sensores com verificação de consistência."
          icon={<FileSpreadsheet className="size-4" />}
          action={
            <Badge tone="neutral">
              Exibindo {Math.min(report.readings.length, 30)} de {report.total_readings}
            </Badge>
          }
        />
        <div className="mt-4">
          <Table aria-label="Leituras detalhadas do relatório histórico">
            <thead>
              <tr>
                <Th>Data / Hora</Th>
                <Th>Sensor</Th>
                <Th>Parâmetro</Th>
                <Th>Valor Medido</Th>
                <Th>Consistência</Th>
              </tr>
            </thead>
            <tbody>
              {report.readings.slice(0, 30).map((reading) => (
                <Tr key={reading.id}>
                  <Td className="font-mono text-xs tabular-nums text-muted">
                    {formatDateTime(reading.date_time)}
                  </Td>
                  <Td className="font-mono text-xs text-muted">#{reading.sensor_id}</Td>
                  <Td className="font-medium text-ink">{reading.sensor_type}</Td>
                  <Td className="font-mono font-semibold tabular-nums text-ink">
                    {formatNullableMetric(reading.value, reading.unit_of_measure)}
                  </Td>
                  <Td>
                    <Badge tone={reading.data_consistent ? "ok" : "warn"} dot>
                      {reading.data_consistent ? "Consistente" : "Suspeito"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function ForecastReportContent({ report }: { report: ForecastReport }) {
  return (
    <Card>
      <CardHeader
        title={`Previsão Diária — ${report.station.name}`}
        description={`Fonte meteorológica: ${report.source.toUpperCase()} (${report.station.latitude.toFixed(4)}, ${report.station.longitude.toFixed(4)})`}
        icon={<CloudSun className="size-4" />}
        action={
          <Badge tone="info">
            {report.total_days} {report.total_days === 1 ? "dia previsto" : "dias previstos"}
          </Badge>
        }
      />
      <div className="mt-4">
        <Table aria-label="Previsão meteorológica diária">
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Condição Prevista</Th>
              <Th>Temp. Mínima</Th>
              <Th>Temp. Máxima</Th>
              <Th>Precipitação</Th>
              <Th>Prob. Chuva</Th>
              <Th>Vento Máximo</Th>
            </tr>
          </thead>
          <tbody>
            {report.days.map((day) => {
              const highRainRisk = (day.precipitation_probability ?? 0) >= 70;
              return (
                <Tr key={day.date}>
                  <Td className="font-mono text-xs font-medium tabular-nums text-ink">
                    {day.date}
                  </Td>
                  <Td>
                    <Badge tone={highRainRisk ? "warn" : "brand"}>
                      {day.weather_description}
                    </Badge>
                  </Td>
                  <Td className="font-mono tabular-nums text-muted">
                    {formatNullableMetric(day.temperature_min, "°C")}
                  </Td>
                  <Td className="font-mono font-semibold tabular-nums text-ink">
                    {formatNullableMetric(day.temperature_max, "°C")}
                  </Td>
                  <Td className="font-mono tabular-nums text-ink">
                    {formatNullableMetric(day.precipitation_mm, "mm")}
                  </Td>
                  <Td className="font-mono tabular-nums text-muted">
                    {formatNullableMetric(day.precipitation_probability, "%")}
                  </Td>
                  <Td className="font-mono tabular-nums text-muted">
                    {formatNullableMetric(day.wind_speed_max_kmh, "km/h")}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

function AlertsReportContent({ report }: { report: AlertsReport }) {
  return (
    <Card>
      <CardHeader
        title="Ocorrências e Alertas Disparados"
        description="Histórico auditável de violações de limites operacionais nas estações monitoradas."
        icon={<BellRing className="size-4" />}
        action={
          <Badge tone={report.total_alerts > 0 ? "danger" : "ok"}>
            {report.total_alerts} {report.total_alerts === 1 ? "ocorrência" : "ocorrências"}
          </Badge>
        }
      />
      <div className="mt-4">
        <Table aria-label="Ocorrências do relatório de alertas">
          <thead>
            <tr>
              <Th>Disparado em</Th>
              <Th>Estação</Th>
              <Th>Parâmetro</Th>
              <Th>Regra Violada</Th>
              <Th>Condição</Th>
              <Th>Valor Medido</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {report.alerts.map((alert) => (
              <Tr key={alert.id}>
                <Td className="font-mono text-xs tabular-nums text-muted">
                  {formatDateTime(alert.triggered_at)}
                </Td>
                <Td className="font-medium text-ink">{alert.station_name}</Td>
                <Td className="text-muted">
                  {alert.sensor_type}{" "}
                  <span className="font-mono text-xs text-faint">(#{alert.sensor_id})</span>
                </Td>
                <Td className="font-medium text-ink">{alert.rule_name}</Td>
                <Td className="font-mono text-xs text-muted">
                  {alert.condition} {alert.unit_of_measure}
                </Td>
                <Td className="font-mono font-semibold tabular-nums text-ink">
                  {formatNullableMetric(alert.reading_value, alert.unit_of_measure)}
                </Td>
                <Td>
                  <Badge
                    tone={alert.status === "acknowledged" ? "ok" : "danger"}
                    dot
                    pulse={alert.status === "pending"}
                  >
                    {alert.status === "acknowledged" ? "Reconhecido" : "Pendente"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

export function ReportViewer({
  reportType,
  report,
  isLoading,
  errorMessage,
  onRetry,
}: ReportViewerProps) {
  const option = getReportTypeOption(reportType);

  if (isLoading) {
    return (
      <div aria-label="Carregando relatório" className="space-y-4">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </Card>
    );
  }

  if (!report || isReportEmpty(report)) {
    return (
      <Card>
        <EmptyState
          title={`Nenhum registro encontrado para ${option.shortLabel}`}
          description="Ajuste o período, propriedade ou estação selecionada nos filtros acima para visualizar os dados deste relatório."
        />
      </Card>
    );
  }

  const metrics = computeReportSummaryMetrics(report);
  const scopeStationLabel = report.station ? report.station.name : "Todas as estações";
  const scopePropertyLabel = report.property ? report.property.name : "Todas as propriedades";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{option.label}</span>
          <span>•</span>
          <span>Propriedade: {scopePropertyLabel}</span>
          <span>•</span>
          <span>Estação: {scopeStationLabel}</span>
        </div>
        <div className="font-mono text-[11px] text-faint">
          Gerado em {formatDate(report.generated_at)}
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <StatCard
          label={metrics.primaryMetricLabel}
          value={metrics.primaryMetricValue}
          hint={`Escopo: ${scopeStationLabel}`}
          icon={<Activity className="size-4" />}
          accent="brand"
        />
        <StatCard
          label={metrics.secondaryMetricLabel}
          value={metrics.secondaryMetricValue}
          hint={`Propriedade: ${scopePropertyLabel}`}
          icon={<ShieldAlert className="size-4" />}
          accent="info"
        />
        <StatCard
          label={metrics.tertiaryMetricLabel}
          value={metrics.tertiaryMetricValue}
          hint={option.badgeText}
          icon={<CheckCircle2 className="size-4" />}
          accent="ok"
        />
      </div>

      {report.report_type === "history" && <HistoryReportContent report={report} />}
      {report.report_type === "forecast" && <ForecastReportContent report={report} />}
      {report.report_type === "alerts" && <AlertsReportContent report={report} />}
    </div>
  );
}
