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
import {
  type SensorTypeStatistics,
  stationsApi,
} from "@/features/stations/api";
import {
  stationKeys,
  useOverview,
  useProperties,
  useSeries,
  useStatistics,
} from "@/features/stations/hooks";
import { formatNumber } from "@/lib/format";

import { StationExtremesChart, type StationSensorStat } from "./StationExtremesChart";
import { TempHumidityChart, type TempHumidityPoint } from "./TempHumidityChart";

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

  // Estados do Gráfico 2 (Linha: Comportamento por Horário do Dia 00h-23h vs Alerta)
  const [lineSensor, setLineSensor] = useState<string>("Temperatura");
  const [lineStationId, setLineStationId] = useState<number | undefined>();

  // 1. Dados gerais do banco
  const properties = useProperties();
  const overview = useOverview(propertyId);
  const sensorsQuery = useSensors();
  const sensorTypesQuery = useSensorTypes();
  const alertRules = useAlertRules();

  const stations = useMemo(() => overview.data?.stations ?? [], [overview.data]);

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

  // 3. Dados do Gráfico 2 (Linha): Relação Temperatura vs. Umidade do Ar
  const [linePeriod, setLinePeriod] = useState<string>("24");
  const currentLineOption =
    PERIOD_OPTIONS.find((p) => p.value === linePeriod) ?? PERIOD_OPTIONS[1]!;

  const series24h = useSeries({
    stationId: lineStationId,
    propertyId,
    hours: currentLineOption.hours,
    bucketMinutes: currentLineOption.hours <= 24 ? 60 : 180,
  });

  const { tempHumidityPoints, latestTemp, latestHum, minHum } = useMemo(() => {
    const list = series24h.data?.series ?? [];
    const tempSeries = list.find((s) => s.sensor_type.toLowerCase() === "temperatura");
    const humSeries = list.find((s) => s.sensor_type.toLowerCase() === "umidade");

    const tempMap = new Map<number, number>();
    for (const p of tempSeries?.points ?? []) {
      tempMap.set(p.t, p.avg);
    }

    const humMap = new Map<number, number>();
    for (const p of humSeries?.points ?? []) {
      humMap.set(p.t, p.avg);
    }

    const allTimestamps = Array.from(
      new Set([...tempMap.keys(), ...humMap.keys()]),
    ).sort((a, b) => a - b);

    const points: TempHumidityPoint[] = allTimestamps.map((t) => ({
      t,
      temp: tempMap.get(t) ?? null,
      humidity: humMap.get(t) ?? null,
    }));

    const validTemps = points.map((p) => p.temp).filter((v): v is number => v !== null);
    const validHums = points.map((p) => p.humidity).filter((v): v is number => v !== null);

    return {
      tempHumidityPoints: points,
      latestTemp: validTemps.at(-1),
      latestHum: validHums.at(-1),
      minHum: validHums.length ? Math.min(...validHums) : undefined,
    };
  }, [series24h.data]);

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
          GRÁFICO 2 (LINHA): CORRELAÇÃO TEMPERATURA VS. UMIDADE DO AR
          =================================================================== */}
      <Card className="flex flex-col shadow-[var(--shadow-card)]">
        <CardHeader
          title="Temperatura vs. Umidade"
          description={`Comportamento térmico e hídrico no período (${currentLineOption.label})`}
          action={
            <Segmented
              label="Período do gráfico de temperatura e umidade"
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
              className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
              aria-hidden
            >
              <Thermometer className="size-5" />
            </span>
            <div>
              <label htmlFor={lineStationSelectId} className="sr-only">
                Estação exibida no gráfico
              </label>
              <Select
                id={lineStationSelectId}
                className="h-9 w-60"
                value={lineStationId ?? ""}
                onChange={(e) =>
                  setLineStationId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">Todas as estações (Média da rede)</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <dl className="flex gap-6 text-right">
            {latestTemp !== undefined && (
              <div>
                <dt className="text-xs text-faint">Última temp.</dt>
                <dd className="text-lg font-semibold tabular-nums text-amber-700">
                  {formatNumber(latestTemp)}{" "}
                  <span className="text-xs font-medium text-muted">°C</span>
                </dd>
              </div>
            )}
            {latestHum !== undefined && (
              <div>
                <dt className="text-xs text-faint">Última umid.</dt>
                <dd className="text-lg font-semibold tabular-nums text-info">
                  {formatNumber(latestHum)}{" "}
                  <span className="text-xs font-medium text-muted">%</span>
                </dd>
              </div>
            )}
            {minHum !== undefined && (
              <div>
                <dt className="text-xs text-faint">Menor umidade</dt>
                <dd
                  className={`text-lg font-semibold tabular-nums ${
                    minHum <= 30 ? "text-danger" : "text-ok"
                  }`}
                >
                  {formatNumber(minHum)}{" "}
                  <span className="text-xs font-medium text-muted">%</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex-1 px-3 pt-3 pb-4">
          {series24h.isLoading ? (
            <Skeleton className="mx-2 h-64 rounded-xl" />
          ) : series24h.error ? (
            <ErrorState
              message={series24h.error.message}
              onRetry={() => void series24h.refetch()}
            />
          ) : tempHumidityPoints.length ? (
            <TempHumidityChart
              points={tempHumidityPoints}
              hours={currentLineOption.hours}
              height={290}
            />
          ) : (
            <EmptyState
              title="Sem dados de telemetria"
              description="Nenhuma leitura disponível para temperatura e umidade."
            />
          )}
        </div>
      </Card>
    </div>
  );
}

export default DashboardStats;