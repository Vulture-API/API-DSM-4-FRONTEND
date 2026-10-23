"use client";

import { useQueries } from "@tanstack/react-query";
import {
  CloudRain,
  Download,
  Droplets,
  Gauge,
  Sprout,
  Thermometer,
  Wind,
} from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAlertRules } from "@/features/alerts/hooks";
import { useSensors, useSensorTypes } from "@/features/parameters/hooks";
import { sensorVisual } from "@/features/sensor-visual";
import { ForecastCalendarCard } from "@/features/stations/ForecastCalendarCard";
import {
  type SensorTypeStatistics,
  stationsApi,
} from "@/features/stations/api";
import {
  stationKeys,
  useForecast,
  useOverview,
  useProperties,
  useSeries,
  useStatistics,
} from "@/features/stations/hooks";
import { formatNumber } from "@/lib/format";

import {
  AlertThresholdChart,
  isThresholdViolated,
  type ThresholdRule,
} from "./AlertThresholdChart";
import { StationExtremesChart, type StationSensorStat } from "./StationExtremesChart";

const PERIOD_OPTIONS = [
  { value: "6", label: "6 h", hours: 6 },
  { value: "24", label: "24 h", hours: 24 },
  { value: "168", label: "7 dias", hours: 168 },
  { value: "720", label: "30 dias", hours: 720 },
] as const;

const SENSOR_CATALOG = [
  { name: "Temperatura", shortLabel: "Temperatura", unit: "°C", icon: Thermometer, color: "#d9582b" },
  { name: "Umidade", shortLabel: "Umidade do Ar", unit: "%", icon: Droplets, color: "#2f6fb3" },
  { name: "Velocidade do Vento", shortLabel: "Vento", unit: "km/h", icon: Wind, color: "#4b8a8a" },
  { name: "Índice Pluviométrico", shortLabel: "Chuva", unit: "mm", icon: CloudRain, color: "#5b61c9" },
  { name: "Pressão", shortLabel: "Pressão", unit: "hPa", icon: Gauge, color: "#6d7468" },
  { name: "Temperatura do Solo", shortLabel: "Temp. Solo", unit: "°C", icon: Thermometer, color: "#b85c38" },
  { name: "Umidade do Solo", shortLabel: "Umid. Solo", unit: "%", icon: Sprout, color: "#7c5b2e" },
] as const;

export function DashboardStats() {
  const barSensorSelectId = useId();
  const lineSensorSelectId = useId();
  const lineStationSelectId = useId();
  const propSelectId = useId();

  // Filtro global de propriedade no topo
  const [propertyId, setPropertyId] = useState<number | undefined>();
  const [anchorMs] = useState(() => Date.now());

  // Estados do Gráfico 1 (Barras: Comparativo entre Estações)
  const [barSensor, setBarSensor] = useState<string>("Temperatura");
  const [barPeriod, setBarPeriod] = useState<string>("168");

  // Estados do Gráfico 2 (Linha: Monitoramento de Limite de Alerta)
  const [lineSensor, setLineSensor] = useState<string>("Temperatura");
  const [lineStationId, setLineStationId] = useState<number | undefined>();
  const [linePeriod, setLinePeriod] = useState<string>("24");

  // 1. Dados gerais do banco
  const properties = useProperties();
  const overview = useOverview(propertyId);
  const sensorsQuery = useSensors();
  const sensorTypesQuery = useSensorTypes();
  const alertRules = useAlertRules();

  const stations = useMemo(() => overview.data?.stations ?? [], [overview.data]);
  const forecastStation = useMemo(
    () => stations.find((s) => s.id === lineStationId) ?? stations[0],
    [stations, lineStationId],
  );
  const forecastQuery = useForecast(forecastStation?.id ?? 1, 7);

  // Cálculo de intervalo [from, to] do Gráfico de Barras e KPIs
  const currentBarOption = PERIOD_OPTIONS.find((p) => p.value === barPeriod) ?? PERIOD_OPTIONS[2]!;
  const { fromIso, toIso } = useMemo(() => {
    const to = new Date(anchorMs);
    const from = new Date(anchorMs - currentBarOption.hours * 3_600_000);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }, [anchorMs, currentBarOption]);

  // Estatísticas consolidadas do banco (GET /api/stations/statistics)
  const networkStats = useStatistics({
    from: fromIso,
    to: toIso,
    property_id: propertyId,
  });

  const statsBySensorName = useMemo(() => {
    const map = new Map<string, SensorTypeStatistics>();
    for (const item of networkStats.data?.sensor_types ?? []) {
      map.set(item.sensor_type.toLowerCase(), item);
    }
    return map;
  }, [networkStats.data]);

  // 2. Dados do Gráfico 1 (Barras): Estatísticas por Estação no Banco
  const targetStationsForBars = useMemo(() => {
    const communicating = stations.filter((s) => s.last_communication_at !== null);
    return (communicating.length ? communicating : stations).slice(0, 8);
  }, [stations]);

  const stationStatsQueries = useQueries({
    queries: targetStationsForBars.map((st) => ({
      queryKey: stationKeys.stationStatistics(st.id, { from: fromIso, to: toIso }),
      queryFn: () => stationsApi.stationStatistics(st.id, { from: fromIso, to: toIso }),
      staleTime: 60_000,
    })),
  });

  const stationExtremesList: StationSensorStat[] = useMemo(() => {
    const list: StationSensorStat[] = [];
    targetStationsForBars.forEach((st, idx) => {
      const qData = stationStatsQueries[idx]?.data;
      const sensorStat = qData?.sensor_types?.find(
        (s) => s.sensor_type.toLowerCase() === barSensor.toLowerCase(),
      );
      if (sensorStat && sensorStat.count > 0) {
        list.push({
          stationId: st.id,
          stationName: st.name,
          propertyName: st.property_name,
          min: sensorStat.min,
          avg: sensorStat.avg,
          max: sensorStat.max,
          stddev: sensorStat.stddev,
          count: sensorStat.count,
        });
      }
    });
    return list;
  }, [targetStationsForBars, stationStatsQueries, barSensor]);

  const barStat = statsBySensorName.get(barSensor.toLowerCase());
  const barVisual = sensorVisual(barSensor);
  const barUnit =
    barStat?.unit_of_measure ??
    SENSOR_CATALOG.find((c) => c.name.toLowerCase() === barSensor.toLowerCase())?.unit ??
    "";

  const barLow = stationExtremesList.length
    ? Math.min(...stationExtremesList.map((s) => s.min))
    : barStat?.min;
  const barHigh = stationExtremesList.length
    ? Math.max(...stationExtremesList.map((s) => s.max))
    : barStat?.max;
  const barAvg =
    barStat?.avg ??
    (stationExtremesList.length
      ? Number(
          (
            stationExtremesList.reduce((acc, s) => acc + s.avg, 0) /
            stationExtremesList.length
          ).toFixed(2),
        )
      : undefined);

  // 3. Dados do Gráfico 2 (Linha): Monitoramento de Limite de Alerta (Leitura vs alert_configs)
  const currentLineOption =
    PERIOD_OPTIONS.find((p) => p.value === linePeriod) ?? PERIOD_OPTIONS[1]!;

  const lineSeriesQuery = useSeries({
    stationId: lineStationId,
    propertyId,
    hours: currentLineOption.hours,
    bucketMinutes: currentLineOption.hours <= 24 ? 60 : 180,
  });

  const selectedLineSeries = useMemo(() => {
    const list = lineSeriesQuery.data?.series ?? [];
    return (
      list.find((s) => s.sensor_type.toLowerCase() === lineSensor.toLowerCase()) ??
      list[0]
    );
  }, [lineSeriesQuery.data, lineSensor]);

  const linePoints = useMemo(() => selectedLineSeries?.points ?? [], [selectedLineSeries]);
  const lineVisual = sensorVisual(lineSensor);
  const lineUnit =
    selectedLineSeries?.unit_of_measure ??
    SENSOR_CATALOG.find((c) => c.name.toLowerCase() === lineSensor.toLowerCase())?.unit ??
    "";

  // Regra de alerta ativa no banco (alert_configs) para o sensor do Gráfico 2
  const matchedRule: ThresholdRule | null = useMemo(() => {
    const rules = alertRules.data ?? [];
    const sensors = sensorsQuery.data ?? [];
    const types = sensorTypesQuery.data ?? [];

    const sensorById = new Map(sensors.map((s) => [s.id, s]));
    const typeById = new Map(types.map((t) => [t.id, t]));
    const stationById = new Map(stations.map((st) => [st.id, st]));

    const matchingRules = rules.filter((r) => {
      if (!r.active) return false;
      const sensor = sensorById.get(r.sensor_id);
      if (!sensor) return false;
      const sType = typeById.get(sensor.sensor_type_id);
      if (!sType) return false;
      if (sType.name.toLowerCase() !== lineSensor.toLowerCase()) return false;
      if (lineStationId && sensor.station_id !== lineStationId) return false;
      if (propertyId) {
        const st = stationById.get(sensor.station_id);
        if (st && st.property_id !== propertyId) return false;
      }
      return true;
    });

    const chosen =
      matchingRules[0] ??
      rules.find((r) => {
        if (!r.active) return false;
        const sensor = sensorById.get(r.sensor_id);
        const sType = sensor ? typeById.get(sensor.sensor_type_id) : undefined;
        return sType?.name.toLowerCase() === lineSensor.toLowerCase();
      });

    if (chosen) {
      const sensor = sensorById.get(chosen.sensor_id);
      const st = sensor ? stationById.get(sensor.station_id) : undefined;
      return {
        id: chosen.id,
        referenceValue: Number(chosen.reference_value),
        operator: chosen.comparison_operator,
        message: chosen.message,
        stationName: st?.name,
      };
    }

    return null;
  }, [alertRules.data, sensorsQuery.data, sensorTypesQuery.data, stations, lineSensor, lineStationId, propertyId]);

  const linePeriodAvg = useMemo(() => {
    if (!linePoints.length) return undefined;
    return Number(
      (linePoints.reduce((acc, p) => acc + p.avg, 0) / linePoints.length).toFixed(2),
    );
  }, [linePoints]);

  const violationsCount = useMemo(() => {
    if (!matchedRule || !linePoints.length) return 0;
    return linePoints.filter((p) => isThresholdViolated(p.avg, matchedRule)).length;
  }, [linePoints, matchedRule]);

  function handleExportCsv() {
    const rows: string[] = [
      "Tipo de Sensor;Unidade;Leituras no Banco;Minimo;Media;Maximo",
    ];
    for (const s of networkStats.data?.sensor_types ?? []) {
      rows.push(
        `${s.sensor_type};${s.unit_of_measure};${s.count};${s.min};${s.avg};${s.max}`,
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estatisticas-meteorologicas-${barPeriod}h.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const onlineCount = overview.data?.summary.online ?? 0;
  const totalStations = overview.data?.summary.total ?? stations.length;
  const totalReadingsCount = networkStats.data?.readings_total ?? 0;

  return (
    <div className="space-y-6">
      {/* ===================================================================
          CABEÇALHO DA PÁGINA (PAGEHEADER)
          =================================================================== */}
      <PageHeader
        eyebrow="Monitoramento"
        title="Estatísticas meteorológicas"
        description="Resumo por sensor, comparativo entre estações e variação por horário."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <label htmlFor={propSelectId} className="sr-only">
                Propriedade agrícola
              </label>
              <Select
                id={propSelectId}
                value={propertyId ?? ""}
                onChange={(e) => {
                  setPropertyId(e.target.value ? Number(e.target.value) : undefined);
                  setLineStationId(undefined);
                }}
                className="h-9 min-w-52 border-white/15 bg-white/10 text-white"
              >
                <option value="" className="text-ink">
                  Todas as propriedades
                </option>
                {(properties.data ?? []).map((p) => (
                  <option key={p.id} value={p.id} className="text-ink">
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="glass"
              icon={<Download className="size-4" />}
              onClick={handleExportCsv}
            >
              Exportar CSV
            </Button>
          </div>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-brand-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {onlineCount}/{totalStations} estações comunicando
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {totalReadingsCount.toLocaleString("pt-BR")} leituras no período
          </span>
        </div>
      </PageHeader>

      {/* ===================================================================
          RESUMO CONSOLIDADO POR SENSOR NO BANCO DE DADOS (7 SENSORES)
          =================================================================== */}
      <Card className="overflow-hidden shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Resumo por sensor
            </h2>
            <p className="text-xs text-muted">
              Média, mínimo e máximo no período ({currentBarOption.label})
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
            <span className="size-1.5 rounded-full bg-brand-500" />
            {totalReadingsCount.toLocaleString("pt-BR")} leituras
          </span>
        </div>

        {networkStats.isLoading ? (
          <div className="grid grid-cols-2 divide-x divide-line p-4 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="m-2 h-24 rounded-lg" />
            ))}
          </div>
        ) : networkStats.error ? (
          <div className="p-4">
            <ErrorState
              message={networkStats.error.message}
              onRetry={() => void networkStats.refetch()}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
            {SENSOR_CATALOG.map((item) => {
              const Icon = item.icon;
              const stat = statsBySensorName.get(item.name.toLowerCase());

              return (
                <div key={item.name} className="p-4 text-left">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Icon className="size-3.5 shrink-0" style={{ color: item.color }} />
                    <span className="truncate">{item.shortLabel}</span>
                  </p>
                  <p className="mt-2 text-2xl leading-none font-semibold tracking-tight tabular-nums text-ink">
                    {stat ? formatNumber(stat.avg) : "—"}
                    <span className="ml-1 text-xs font-medium text-muted">
                      {stat?.unit_of_measure ?? item.unit}
                    </span>
                  </p>
                  {stat ? (
                    <div className="mt-2 space-y-0.5 text-[11px] tabular-nums text-faint">
                      <p>
                        Mín <span className="font-medium text-info">{formatNumber(stat.min)}</span> · Máx{" "}
                        <span className="font-medium text-danger">{formatNumber(stat.max)}</span>
                      </p>
                      <p>{stat.count.toLocaleString("pt-BR")} leituras</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-faint">Sem leituras no período</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ===================================================================
          GRÁFICO 1 (BARRAS): COMPARATIVO POR ESTAÇÃO
          =================================================================== */}
      <Card className="flex flex-col shadow-[var(--shadow-card)]">
        <CardHeader
          title="Comparativo por estação"
          description="Mínimo, média e máximo de cada estação no período"
          action={
            <Segmented
              label="Período"
              value={barPeriod}
              onChange={setBarPeriod}
              options={PERIOD_OPTIONS.map(({ value, label }) => ({ value, label }))}
            />
          }
        />

        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-10 items-center justify-center rounded-xl"
              style={{ background: barVisual.soft, color: barVisual.color }}
              aria-hidden
            >
              <barVisual.icon className="size-5" />
            </span>
            <div>
              <label htmlFor={barSensorSelectId} className="sr-only">
                Medição exibida no gráfico de barras
              </label>
              <Select
                id={barSensorSelectId}
                className="h-9 w-56 font-medium"
                value={barSensor}
                onChange={(e) => setBarSensor(e.target.value)}
              >
                {SENSOR_CATALOG.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {barAvg !== undefined && barLow !== undefined && barHigh !== undefined && (
            <dl className="flex gap-6 text-right">
              <div>
                <dt className="text-xs text-faint">Mínimo</dt>
                <dd className="text-lg font-semibold tabular-nums text-info">
                  {formatNumber(barLow)}{" "}
                  <span className="text-xs font-medium text-muted">{barUnit}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Média</dt>
                <dd className="text-lg font-semibold tabular-nums text-ok">
                  {formatNumber(barAvg)}{" "}
                  <span className="text-xs font-medium text-muted">{barUnit}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Máximo</dt>
                <dd className="text-lg font-semibold tabular-nums text-danger">
                  {formatNumber(barHigh)}{" "}
                  <span className="text-xs font-medium text-muted">{barUnit}</span>
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="flex-1 px-3 pt-3 pb-4">
          {overview.isLoading || stationStatsQueries.some((q) => q.isLoading) ? (
            <Skeleton className="mx-2 h-64 rounded-xl" />
          ) : overview.error ? (
            <ErrorState
              message={overview.error.message}
              onRetry={() => void overview.refetch()}
            />
          ) : stationExtremesList.length ? (
            <StationExtremesChart
              data={stationExtremesList}
              unit={barUnit}
              networkAvg={barAvg}
              height={290}
            />
          ) : (
            <EmptyState
              title="Sem dados no período"
              description="Nenhuma estação possui leituras para esta medição."
            />
          )}
        </div>
      </Card>

      {/* ===================================================================
          GRÁFICO 2 (LINHA): MONITORAMENTO DE LIMITE DE ALERTA
          =================================================================== */}
      <Card className="flex flex-col shadow-[var(--shadow-card)]">
        <CardHeader
          title="Monitoramento de limite de alerta"
          description="Leitura contínua comparada ao limite de alerta cadastrado no banco"
          action={
            <Segmented
              label="Período do gráfico de linha"
              value={linePeriod}
              onChange={setLinePeriod}
              options={PERIOD_OPTIONS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
            />
          }
        />

        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex size-10 items-center justify-center rounded-xl"
              style={{ background: lineVisual.soft, color: lineVisual.color }}
              aria-hidden
            >
              <lineVisual.icon className="size-5" />
            </span>
            <div>
              <label htmlFor={lineSensorSelectId} className="sr-only">
                Medição exibida no gráfico de linha
              </label>
              <Select
                id={lineSensorSelectId}
                className="h-9 w-56 font-medium"
                value={lineSensor}
                onChange={(e) => setLineSensor(e.target.value)}
              >
                {SENSOR_CATALOG.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor={lineStationSelectId} className="sr-only">
                Estação exibida no gráfico de linha
              </label>
              <Select
                id={lineStationSelectId}
                className="h-9 w-56"
                value={lineStationId ?? ""}
                onChange={(e) =>
                  setLineStationId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">Todas as estações</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <dl className="flex gap-6 text-right">
            {linePeriodAvg !== undefined && (
              <div>
                <dt className="text-xs text-faint">Média</dt>
                <dd className="text-lg font-semibold tabular-nums text-ok">
                  {formatNumber(linePeriodAvg)}{" "}
                  <span className="text-xs font-medium text-muted">{lineUnit}</span>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-faint">Limite de alerta</dt>
              <dd className="text-lg font-semibold tabular-nums text-danger">
                {matchedRule
                  ? `${matchedRule.operator} ${formatNumber(matchedRule.referenceValue)} ${lineUnit}`
                  : "Sem limite"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Acima do limite</dt>
              <dd
                className={`text-lg font-semibold tabular-nums ${
                  violationsCount > 0 ? "text-danger" : "text-ok"
                }`}
              >
                {violationsCount}{" "}
                <span className="text-xs font-medium text-muted">
                  {violationsCount === 1 ? "horário" : "horários"}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex-1 px-3 pt-3 pb-4">
          {lineSeriesQuery.isLoading ? (
            <Skeleton className="mx-2 h-64 rounded-xl" />
          ) : lineSeriesQuery.error ? (
            <ErrorState
              message={lineSeriesQuery.error.message}
              onRetry={() => void lineSeriesQuery.refetch()}
            />
          ) : linePoints.length ? (
            <AlertThresholdChart
              points={linePoints}
              unit={lineUnit}
              hours={currentLineOption.hours}
              periodAvg={linePeriodAvg}
              rule={matchedRule}
              height={290}
            />
          ) : (
            <EmptyState
              title="Sem dados de telemetria"
              description="Nenhuma leitura disponível para este sensor no período."
            />
          )}
        </div>
      </Card>

      {/* ===================================================================
          PREVISÃO METEOROLÓGICA (7 DIAS)
          =================================================================== */}
      {forecastQuery.error ? (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <ErrorState
            message={
              forecastQuery.error.message ||
              "Serviço de previsão meteorológica indisponível"
            }
            onRetry={() => void forecastQuery.refetch()}
          />
        </Card>
      ) : (
        <ForecastCalendarCard
          stationName={forecastStation?.name ?? "Estação Sede"}
          propertyName={forecastStation?.property_name ?? "Fazenda Santa Rita"}
          latitude={forecastStation?.latitude ?? forecastQuery.data?.latitude ?? -23.1896}
          longitude={forecastStation?.longitude ?? forecastQuery.data?.longitude ?? -45.8841}
          forecast={forecastQuery.data}
          isLoading={forecastQuery.isLoading}
        />
      )}
    </div>
  );
}

export default DashboardStats;