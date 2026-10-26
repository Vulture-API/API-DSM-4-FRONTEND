"use client";

import { Download } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useId, useMemo, useState } from "react";

import { TrendChart } from "@/components/charts/TrendChart";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReactSelect, type ReactSelectOption } from "@/components/ui/ReactSelect";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { sensorVisual } from "@/features/sensor-visual";
import { ForecastCalendarCard } from "@/features/stations/ForecastCalendarCard";
import { stationsApi } from "@/features/stations/api";
import { stationKeys, useForecast, useOverview, useSeries } from "@/features/stations/hooks";
import { useCan } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { buildHistoryRows, seriesWindow } from "./historyRows";

export type TelemetryRow = {
  id: string;
  stationId: number;
  stationName: string;
  propertyName: string;
  unixTime: number;
  dateTime: string;
  temp: number | null;
  tempAlert: boolean;
  humidity: number | null;
  humidityAlert: boolean;
  wind: number | null;
  windDir: string;
  windAlert: boolean;
  rain: number | null;
  soilTemp: number | null;
  soilHum: number | null;
  soilAlert: boolean;
  alertMessage: string | null;
  warnMessage: string | null;
};

const RANGES = [
  { value: "24", label: "24 h", bucket: 30, days: 1 },
  { value: "168", label: "7 dias", bucket: 180, days: 7 },
  { value: "720", label: "30 dias", bucket: 720, days: 30 },
  { value: "custom", label: "Personalizado", bucket: 180, days: 7 },
] as const;

type RangeKey = (typeof RANGES)[number]["value"];

const PAGE_SIZE = 10;

function formatShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function HistoryPage() {
  const toast = useToast();
  const selectStationId = useId();
  const selectSensorId = useId();
  const selectGroupingId = useId();
  const selectAggregationId = useId();

  // Filtros
  const [range, setRange] = useState<RangeKey>("168");
  const [stationId, setStationId] = useState<number | undefined>();
  const [sensorFilter, setSensorFilter] = useState<string>("all");
  const [grouping, setGrouping] = useState<string>("1h");
  const [aggregation, setAggregation] = useState<string>("avg");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [page, setPage] = useState(1);

  // Datas
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatShortDate(d);
  });
  const [endDate, setEndDate] = useState(() => formatShortDate(new Date()));
  const [clientNow] = useState(() => Math.floor(Date.now() / 1000));


  // Consultas de dados
  const canRead = useCan("monitoring.read");
  const overview = useOverview();
  const generatedAt = overview.data?.generated_at;

  const stations = useMemo(() => overview.data?.stations ?? [], [overview.data]);

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === stationId),
    [stations, stationId],
  );

  const activeStation = selectedStation ?? stations[0];
  const forecastQuery = useForecast(activeStation?.id, 7);

  const hoursQuery = range === "24" ? 24 : range === "720" ? 720 : 168;
  const bucketQuery = range === "24" ? 30 : range === "720" ? 720 : 180;

  const series = useSeries({
    stationId,
    hours: hoursQuery,
    bucketMinutes: bucketQuery,
  });

  const timestamps = useMemo(() => {
    const now = generatedAt
      ? Math.floor(new Date(generatedAt).getTime() / 1000)
      : clientNow;

    if (range === "24") {
      return { start: now - 24 * 3600, end: now };
    }
    if (range === "720") {
      return { start: now - 30 * 86400, end: now };
    }
    if (range === "custom" && startDate && endDate) {
      const parseDatePart = (str: string) => {
        const parts = str.split("/").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        const [day, month, year] = parts;
        const d = new Date(year, (month ?? 1) - 1, day ?? 1);
        return isNaN(d.getTime()) ? null : d;
      };
      const s = parseDatePart(startDate);
      const e = parseDatePart(endDate);
      if (s && e && s <= e) {
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        return {
          start: Math.floor(s.getTime() / 1000),
          end: Math.floor(e.getTime() / 1000),
        };
      }
    }
    return { start: now - 7 * 86400, end: now };
  }, [range, startDate, endDate, generatedAt, clientNow]);

  // Série agregada de cada estação: a tabela usa só dados reais do período.
  const window = useMemo(
    () => seriesWindow(timestamps.start, generatedAt ? Math.floor(new Date(generatedAt).getTime() / 1000) : clientNow, grouping),
    [timestamps.start, generatedAt, clientNow, grouping],
  );
  const tableStations = useMemo(
    () => (stationId ? stations.filter((s) => s.id === stationId) : stations),
    [stations, stationId],
  );
  const stationSeries = useQueries({
    queries: tableStations.map((st) => ({
      enabled: canRead,
      queryKey: stationKeys.stationSeries(st.id, window),
      queryFn: () => stationsApi.stationSeries(st.id, window),
    })),
    combine: (results) => ({
      data: results.map((q) => q.data),
      loading: results.some((q) => q.isLoading),
      error: results.find((q) => q.error)?.error ?? null,
      refetch: () => results.forEach((q) => void q.refetch()),
    }),
  });
  const seriesLoading = stationSeries.loading;
  const seriesError = stationSeries.error;
  const seriesData = stationSeries.data;

  const availableSeries = useMemo(() => series.data?.series ?? [], [series.data]);

  // Medição selecionada para exibição no gráfico de tendência
  const activeSeries = useMemo(() => {
    if (sensorFilter !== "all") {
      const match = availableSeries.find(
        (s) => s.sensor_type.toLowerCase() === sensorFilter.toLowerCase(),
      );
      if (match) return match;
    }
    return availableSeries.find((s) => s.sensor_type === "Temperatura") ?? availableSeries[0];
  }, [availableSeries, sensorFilter]);

  // Opções formatadas para o ReactSelect
  const stationOptions = useMemo<ReactSelectOption<string>[]>(() => {
    return [
      { value: "", label: "Todas as estações da rede" },
      ...stations.map((st) => ({
        value: String(st.id),
        label: st.name,
        sublabel: st.property_name,
        badge: st.mac_address,
      })),
    ];
  }, [stations]);

  const sensorOptions = useMemo<ReactSelectOption<string>[]>(() => [
    { value: "all", label: "Todos os tipos / variáveis cadastrados" },
    { value: "Temperatura", label: "Temperatura", badge: "°C" },
    { value: "Umidade", label: "Umidade do Ar", badge: "%" },
    { value: "Velocidade do Vento", label: "Velocidade do Vento", badge: "km/h" },
    { value: "Índice Pluviométrico", label: "Índice Pluviométrico", badge: "mm" },
    { value: "Pressão", label: "Pressão Atmosférica", badge: "hPa" },
    { value: "Temperatura do Solo", label: "Temperatura do Solo", badge: "°C" },
    { value: "Umidade do Solo", label: "Umidade do Solo", badge: "%" },
  ], []);

  const groupingOptions = useMemo<ReactSelectOption<string>[]>(() => [
    { value: "1h", label: "Medição horária consolidada", badge: "Padrão" },
    { value: "10m", label: "A cada 10 min (Leitura bruta)", badge: "Bruto" },
    { value: "30m", label: "A cada 30 min (Semi-horária)" },
    { value: "1d", label: "Média diária consolidada", badge: "Diário" },
  ], []);

  const aggregationOptions = useMemo<ReactSelectOption<string>[]>(() => [
    { value: "avg", label: "Média do intervalo", badge: "Padrão" },
    { value: "min", label: "Mínima registrada", badge: "Mín" },
    { value: "max", label: "Máxima registrada", badge: "Máx" },
    { value: "all", label: "Todas as medições individuais" },
  ], []);

  // Linhas consolidadas por estação e intervalo, só com medições reais.
  const telemetryRows = useMemo<TelemetryRow[]>(
    () => buildHistoryRows(
      tableStations.map((station, i) => ({ station, series: seriesData[i] })),
      { start: timestamps.start, end: timestamps.end, aggregation, sensorFilter },
    ),
    [tableStations, seriesData, timestamps, aggregation, sensorFilter],
  );

  // Filtro de alertas, período customizado e paginação
  const filteredRows = useMemo(() => {
    let startTimestamp: number | null = null;
    let endTimestamp: number | null = null;

    if (range === "custom" && startDate && endDate) {
      const parseDatePart = (str: string) => {
        const parts = str.split("/").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        const [day, month, year] = parts;
        const d = new Date(year, (month ?? 1) - 1, day ?? 1);
        return isNaN(d.getTime()) ? null : d;
      };
      const s = parseDatePart(startDate);
      const e = parseDatePart(endDate);
      if (s && e) {
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        startTimestamp = Math.floor(s.getTime() / 1000);
        endTimestamp = Math.floor(e.getTime() / 1000);
      }
    }

    return telemetryRows.filter((r) => {
      if (onlyAlerts && !r.alertMessage && !r.warnMessage) return false;
      if (startTimestamp !== null && endTimestamp !== null) {
        if (r.unixTime < startTimestamp || r.unixTime > endTimestamp) return false;
      }
      return true;
    });
  }, [telemetryRows, onlyAlerts, range, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  // Atualiza datas ao mudar o período segmentado
  function handlePeriodChange(val: RangeKey) {
    setRange(val);
    setPage(1);
    const days = val === "24" ? 1 : val === "720" ? 30 : 7;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(formatShortDate(start));
    setEndDate(formatShortDate(end));
  }

  function handleResetFilters() {
    setStationId(undefined);
    setSensorFilter("all");
    setGrouping("1h");
    setAggregation("avg");
    setOnlyAlerts(false);
    handlePeriodChange("168");
    toast.success("Filtros redefinidos para os últimos 7 dias.");
  }

  function handleApplyFilters() {
    if (range === "custom") {
      const parseDatePart = (str: string) => {
        const parts = str.split("/").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        const [day, month, year] = parts;
        const d = new Date(year, (month ?? 1) - 1, day ?? 1);
        return isNaN(d.getTime()) ? null : d;
      };
      const s = parseDatePart(startDate);
      const e = parseDatePart(endDate);
      if (!s || !e || s > e) {
        toast.error("Intervalo de datas inválido. A data inicial deve ser anterior ou igual à data final.");
        return;
      }
    }
    setPage(1);
    toast.success("Filtros aplicados ao histórico de telemetria.");
  }

  function handleExportCsv() {
    if (!filteredRows.length) {
      toast.error("Nenhum dado disponível para exportar.");
      return;
    }

    const headers = [
      "Data e Hora",
      "Estação",
      "Propriedade",
      "Temperatura (°C)",
      "Umidade (%)",
      "Velocidade do Vento (km/h)",
      "Direção do Vento",
      "Índice Pluviométrico (mm)",
      "Temperatura do Solo (°C)",
      "Umidade do Solo (%)",
      "Status / Ocorrência",
    ];

    const lines = filteredRows.map((r) => [
      `"${r.dateTime}"`,
      `"${r.stationName}"`,
      `"${r.propertyName}"`,
      r.temp !== null ? formatNumber(r.temp) : "",
      r.humidity !== null ? formatNumber(r.humidity) : "",
      r.wind !== null ? formatNumber(r.wind) : "",
      `"${r.windDir}"`,
      r.rain !== null ? formatNumber(r.rain) : "",
      r.soilTemp !== null ? formatNumber(r.soilTemp) : "",
      r.soilHum !== null ? formatNumber(r.soilHum) : "",
      `"${r.alertMessage ?? r.warnMessage ?? "Normal"}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...lines.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `historico_dados_meteorologicos_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exportação CSV concluída (${filteredRows.length} registros).`);
  }

  const communicatingStations = overview.data?.summary
    ? overview.data.summary.online + overview.data.summary.with_alert
    : stations.length;
  const totalStations = overview.data?.summary.total ?? stations.length;

  const visual = activeSeries ? sensorVisual(activeSeries.sensor_type) : sensorVisual("Temperatura");
  const lastPoint = activeSeries?.points.at(-1);
  const minVal = activeSeries?.points.length ? Math.min(...activeSeries.points.map((p) => p.min)) : undefined;
  const maxVal = activeSeries?.points.length ? Math.max(...activeSeries.points.map((p) => p.max)) : undefined;

  const stationLabel = selectedStation
    ? `${selectedStation.name} · ${selectedStation.property_name}`
    : "Todas as estações da rede";

  return (
    <>
      <PageHeader
        eyebrow="Monitoramento"
        title="Histórico de dados meteorológicos"
        description="Consulta do histórico contínuo de informações meteorológicas obtidas por estação na rede de monitoramento."
        actions={
          <Button
            variant="glass"
            icon={<Download className="size-4" />}
            onClick={handleExportCsv}
          >
            Exportar CSV
          </Button>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-brand-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {communicatingStations}/{totalStations} estações com telemetria
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {filteredRows.length} {filteredRows.length === 1 ? "leitura no período" : "leituras no período"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            Granularidade: {grouping === "10m" ? "10 min" : grouping === "30m" ? "30 min" : grouping === "1d" ? "Diária" : "Horária"}
          </span>
        </div>
      </PageHeader>

      <div className="space-y-6">

        {/* ===================================================================
            PREVISÃO METEOROLÓGICA: 7 DIAS & JANELAS AGRÍCOLAS
            =================================================================== */}
        <ForecastCalendarCard
          stationName={activeStation ? activeStation.name : "Rede de Estações"}
          propertyName={activeStation?.property_name ?? "Fazenda Santa Rita"}
          latitude={activeStation?.latitude ?? forecastQuery.data?.latitude ?? -23.1896}
          longitude={activeStation?.longitude ?? forecastQuery.data?.longitude ?? -45.8841}
          forecast={forecastQuery.data}
          isLoading={forecastQuery.isLoading}
        />

        {/* ===================================================================
            FILTROS DE TELEMETRIA E HISTÓRICO
            =================================================================== */}
        <Card className="shadow-[var(--shadow-lift)]">
          <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">Filtros de consulta</h2>
                <p className="text-xs text-muted">
                  Selecione a estação, histórico e o período desejado para filtrar os dados coletados das estações.
                </p>
              </div>
              <Segmented
                label="Período"
                value={range}
                onChange={handlePeriodChange}
                options={RANGES.map(({ value, label }) => ({ value, label }))}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor={selectStationId} className="mb-1 block text-xs font-medium text-muted">
                  Estação Meteorológica (Identificação)
                </label>
                <ReactSelect
                  id={selectStationId}
                  label="Estação Meteorológica (Identificação)"
                  value={stationId ? String(stationId) : ""}
                  onChange={(val) => {
                    setStationId(val ? Number(val) : undefined);
                    setPage(1);
                  }}
                  options={stationOptions}
                  placeholder="Selecione uma estação..."
                />
              </div>

              <div>
                <label htmlFor={selectSensorId} className="mb-1 block text-xs font-medium text-muted">
                  Tipo Sensor / Variável (Identificação)
                </label>
                <ReactSelect
                  id={selectSensorId}
                  label="Tipo Sensor / Variável (Identificação)"
                  value={sensorFilter}
                  onChange={(val) => {
                    setSensorFilter(val);
                    setPage(1);
                  }}
                  options={sensorOptions}
                  placeholder="Selecione a variável..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Intervalo de Datas (Início — Fim)
                </label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setRange("custom");
                  }}
                />
              </div>

              <div>
                <label htmlFor={selectGroupingId} className="mb-1 block text-xs font-medium text-muted">
                  Agrupamento temporal
                </label>
                <ReactSelect
                  id={selectGroupingId}
                  label="Agrupamento temporal"
                  value={grouping}
                  onChange={(val) => setGrouping(val)}
                  options={groupingOptions}
                  placeholder="Selecione o agrupamento..."
                />
              </div>

              <div>
                <label htmlFor={selectAggregationId} className="mb-1 block text-xs font-medium text-muted">
                  Direcionamento de Leitura
                </label>
                <ReactSelect
                  id={selectAggregationId}
                  label="Direcionamento de Leitura"
                  value={aggregation}
                  onChange={(val) => setAggregation(val)}
                  options={aggregationOptions}
                  placeholder="Selecione o direcionamento..."
                />
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-muted">
                  Filtro de criticidade
                </span>
                <label
                  htmlFor="only-alerts-checkbox"
                  className={cn(
                    "flex h-9 w-full items-center justify-between gap-2.5 rounded-lg border px-3 text-xs font-medium transition-all cursor-pointer select-none",
                    onlyAlerts
                      ? "border-brand-500 bg-brand-50 text-brand-900 shadow-2xs"
                      : "border-line bg-surface text-ink hover:border-line-strong hover:bg-canvas/50",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      id="only-alerts-checkbox"
                      type="checkbox"
                      aria-label="Exibir apenas leituras com alerta / discrepância meteorológica"
                      checked={onlyAlerts}
                      onChange={(e) => {
                        setOnlyAlerts(e.target.checked);
                        setPage(1);
                      }}
                      className="size-4 shrink-0 cursor-pointer rounded border-line text-brand-600 accent-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                    />
                    <span className="truncate">
                      Exibir apenas leituras com alerta / discrepância
                    </span>
                  </div>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full transition-colors",
                      onlyAlerts ? "bg-brand-500 ring-2 ring-brand-200" : "bg-line-strong",
                    )}
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
              <p className="text-xs text-muted">
                {selectedStation ? (
                  <>Estação ativa: <strong className="font-medium text-ink">{selectedStation.name}</strong> ({selectedStation.property_name})</>
                ) : (
                  <>Estações ativas: <strong className="font-medium text-ink">{stations.length} estações</strong> na rede</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                  Limpar filtros
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                  Filtrar leituras
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ===================================================================
            TABELA DE DADOS BRUTOS CONSOLIDADOS DE TELEMETRIA
            =================================================================== */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Dados brutos consolidados de telemetria</h2>
              <p className="text-xs text-muted">
                {filteredRows.length} {filteredRows.length === 1 ? "leitura obtida" : "leituras obtidas"} no período selecionado ({stationLabel})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="size-3.5" />}
                onClick={handleExportCsv}
              >
                Exportar CSV
              </Button>
            </div>
          </div>

          {overview.isLoading || seriesLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : overview.error || seriesError ? (
            <ErrorState
              message={overview.error?.message ?? seriesError?.message ?? "Falha de comunicação com a API meteorológica"}
              onRetry={() => {
                void overview.refetch();
                void series.refetch();
                stationSeries.refetch();
              }}
            />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="Nenhum registro encontrado no período"
              description="Não há leituras meteorológicas para os filtros informados. Tente alterar o período ou limpar os filtros de busca."
              action={
                <Button variant="primary" size="sm" onClick={handleResetFilters}>
                  Ver últimos 7 dias
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <thead>
                  <Tr>
                    <Th>DATA / HORA (REGISTRO)</Th>
                    <Th>TEMPERATURA</Th>
                    <Th>UMIDADE DO AR</Th>
                    <Th>VENTO (DIR)</Th>
                    <Th>PLUVIOMETRIA</Th>
                    <Th>LEITURAS DE SOLO (TEMP / UMID)</Th>
                    <Th>STATUS PREVISTO / ALERTA</Th>
                  </Tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <Tr key={row.id}>
                      <Td className="font-mono text-xs font-medium text-ink" suppressHydrationWarning>
                        {row.dateTime}
                      </Td>
                      <Td className="tabular-nums">
                        <span className={cn("font-medium", row.tempAlert && "font-semibold text-danger")}>
                          {row.temp !== null ? `${formatNumber(row.temp)} °C` : "—"}
                        </span>
                      </Td>
                      <Td className="tabular-nums">
                        <span className={cn("font-medium", row.humidityAlert && "font-semibold text-warn")}>
                          {row.humidity !== null ? `${formatNumber(row.humidity)} %` : "—"}
                        </span>
                      </Td>
                      <Td className="tabular-nums text-muted">
                        {row.wind !== null ? `${formatNumber(row.wind)} km/h${row.windDir ? ` · ${row.windDir}` : ""}` : "—"}
                      </Td>
                      <Td className="tabular-nums font-medium text-ink">
                        {row.rain !== null ? `${formatNumber(row.rain)} mm` : "—"}
                      </Td>
                      <Td className="tabular-nums text-xs text-muted">
                        {row.soilTemp !== null ? `${formatNumber(row.soilTemp)} °C` : "—"} ·{" "}
                        {row.soilHum !== null ? `${formatNumber(row.soilHum)} %` : "—"}
                      </Td>
                      <Td>
                        {row.alertMessage ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
                            ● {row.alertMessage}
                          </span>
                        ) : row.warnMessage ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">
                            ● {row.warnMessage}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-medium text-ok">
                            ✓ Normal
                          </span>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between border-t border-line bg-subtle/30 px-5 py-3 text-xs text-muted">
                <span>
                  Mostrando {filteredRows.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} a{" "}
                  {Math.min(page * PAGE_SIZE, filteredRows.length)} de {filteredRows.length} registros
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="px-2 font-mono text-xs">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* ===================================================================
            EVOLUÇÃO TEMPORAL NO PERÍODO (TRENDCHART) - POR ÚLTIMO
            =================================================================== */}
        {activeSeries && (
          <Card className="overflow-hidden">
            <CardHeader
              title={`Evolução da medição no período — ${activeSeries.sensor_type}`}
              description={`Comportamento temporal agregado da ${activeSeries.sensor_type} (${startDate} a ${endDate})`}
              action={
                lastPoint && minVal !== undefined && maxVal !== undefined ? (
                  <dl className="flex gap-6 text-right">
                    <div>
                      <dt className="text-xs text-faint">Último</dt>
                      <dd className="text-sm font-semibold tabular-nums text-ink">
                        {formatNumber(lastPoint.avg)} <span className="text-xs font-medium text-muted">{activeSeries.unit_of_measure}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-faint">Mínimo</dt>
                      <dd className="text-sm font-semibold tabular-nums text-info">{formatNumber(minVal)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-faint">Máximo</dt>
                      <dd className="text-sm font-semibold tabular-nums text-danger">{formatNumber(maxVal)}</dd>
                    </div>
                  </dl>
                ) : undefined
              }
            />
            <div className="px-4 pt-2 pb-4">
              <TrendChart
                points={activeSeries.points}
                unit={activeSeries.unit_of_measure}
                color={visual.color}
                height={200}
              />
            </div>
          </Card>
        )}

      </div>
    </>
  );
}
