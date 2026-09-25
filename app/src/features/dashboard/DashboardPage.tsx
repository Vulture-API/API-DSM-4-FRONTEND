"use client";

import { ChevronRight, MapPinned, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { sensorVisual } from "@/features/sensor-visual";
import type { Overview, StationOverview, StationStatus } from "@/features/stations/api";
import { useOverview, useProperties } from "@/features/stations/hooks";
import { SeriesCard } from "@/features/stations/SeriesCard";
import { communicationDelay, LastCommunication } from "@/features/stations/CommunicationDelay";
import { StationsMapLazy } from "@/features/stations/StationsMapLazy";
import { STATUS_COLOR, StatusDot } from "@/features/stations/StationStatusBadge";
import { cn } from "@/lib/cn";
import { formatNumber, formatRelative } from "@/lib/format";

import { PendingAlertsCard } from "./PendingAlertsCard";

/** Tipos mostrados em "Condições agora", na ordem. */
const CONDITIONS = ["Temperatura", "Umidade", "Velocidade do Vento", "Pressão", "Umidade do Solo"];
/** Leitura mais velha que isso não entra na média "agora". */
const FRESH_SECONDS = 30 * 60;

export function currentConditions(stations: StationOverview[], nowSeconds = Date.now() / 1000) {
  const groups = new Map<string, { unit: string; values: number[] }>();
  for (const station of stations) {
    for (const reading of station.latest_readings) {
      if (nowSeconds - reading.unix_time > FRESH_SECONDS) continue;
      const group = groups.get(reading.sensor_type) ?? { unit: reading.unit_of_measure, values: [] };
      group.values.push(reading.value);
      groups.set(reading.sensor_type, group);
    }
  }
  return CONDITIONS.flatMap((type) => {
    const group = groups.get(type);
    if (!group?.values.length) return [];
    const avg = group.values.reduce((a, b) => a + b, 0) / group.values.length;
    return [
      {
        type,
        unit: group.unit,
        avg,
        min: Math.min(...group.values),
        max: Math.max(...group.values),
        stations: group.values.length,
      },
    ];
  });
}

type Filter = "all" | StationStatus;

export function DashboardPage() {
  const [propertyId, setPropertyId] = useState<number | undefined>();
  const properties = useProperties();
  const overview = useOverview(propertyId);
  const [filter, setFilter] = useState<Filter>("all");

  const stations = useMemo(() => overview.data?.stations ?? [], [overview.data]);
  const conditions = useMemo(() => currentConditions(stations), [stations]);
  const summary = overview.data?.summary;
  const visible = stations.filter((s) => filter === "all" || s.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Monitoramento"
        title="Visão geral"
        description={
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-3.5" aria-hidden />
            {overview.dataUpdatedAt
              ? `Atualizado ${formatRelative(new Date(overview.dataUpdatedAt))} · atualiza sozinho a cada 30 s`
              : "Status da rede de estações e condições climáticas"}
          </span>
        }
        actions={
          <Select
            variant="glass"
            aria-label="Filtrar por propriedade"
            className="w-64"
            value={propertyId ?? ""}
            onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas as propriedades</option>
            {properties.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        }
      />

      {overview.error ? (
        <Card>
          <ErrorState message={overview.error.message} onRetry={() => void overview.refetch()} />
        </Card>
      ) : (
        <div className="space-y-6">
          <NetworkSummary overview={overview.data} />

          <Card>
            <CardHeader title="Condições agora" description="Média das estações que enviaram dados nos últimos 30 minutos" />
            <div className="mt-4 overflow-hidden rounded-b-[var(--radius-card)] border-t border-line">
            <section aria-label="Condições agora" className="-mb-px -ml-px flex flex-wrap">
              {overview.isLoading &&
                Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="min-w-[170px] flex-1 border-b border-l border-line p-5">
                    <Skeleton className="h-16" />
                  </div>
                ))}
              {!overview.isLoading && conditions.length === 0 && (
                <div className="flex-1 border-b border-l border-line">
                  <EmptyState title="Nenhuma leitura nos últimos 30 minutos" description="As estações ativas aparecem aqui assim que enviarem dados." />
                </div>
              )}
              {conditions.map((c) => {
                const visual = sensorVisual(c.type);
                return (
                  <div key={c.type} className="min-w-[170px] flex-1 border-b border-l border-line p-5">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
                      <visual.icon className="size-4" style={{ color: visual.color }} aria-hidden />
                      {c.type}
                    </p>
                    <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight tabular-nums">
                      {formatNumber(c.avg)}
                      <span className="ml-1 text-sm font-medium text-muted">{c.unit}</span>
                    </p>
                    <p className="mt-2 text-xs text-faint">
                      {formatNumber(c.min)} a {formatNumber(c.max)} · {c.stations} estações
                    </p>
                  </div>
                );
              })}
            </section>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
            <Card className="overflow-hidden lg:col-span-7">
              <CardHeader
                title="Mapa da rede"
                description="Clique num pino para ver a estação"
                icon={<MapPinned className="size-4" />}
              />
              <div className="mt-4 border-t border-line">
                {overview.isLoading ? (
                  <Skeleton className="h-[420px] rounded-none" />
                ) : (
                  <StationsMapLazy stations={stations} height={420} zoom={12} />
                )}
              </div>
            </Card>

            <Card className="flex flex-col lg:col-span-5">
              <CardHeader title="Estações" description="Status e última leitura" />
              <div className="px-5 pt-4">
                {summary && (
                  <Segmented
                    label="Filtrar estações por status"
                    value={filter}
                    onChange={setFilter}
                    options={[
                      { value: "all", label: "Todas", count: summary.total },
                      { value: "Online", label: "Online", count: summary.online },
                      { value: "Com alerta", label: "Com alerta", count: summary.with_alert },
                      { value: "Offline", label: "Offline", count: summary.offline },
                    ]}
                  />
                )}
              </div>
              <ul className="mt-3 max-h-[392px] flex-1 overflow-y-auto border-t border-line px-2 py-2" aria-label="Estações">
                {overview.isLoading &&
                  Array.from({ length: 6 }, (_, i) => (
                    <li key={i} className="px-3 py-2">
                      <Skeleton className="h-10" />
                    </li>
                  ))}
                {visible.map((station) => (
                  <StationRow key={station.id} station={station} />
                ))}
                {!overview.isLoading && visible.length === 0 && (
                  <li>
                    <EmptyState title="Nenhuma estação nesse status" />
                  </li>
                )}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
            <SeriesCard title="Clima na rede" propertyId={propertyId} className="lg:col-span-8" />
            <PendingAlertsCard className="lg:col-span-4" />
          </div>
        </div>
      )}
    </>
  );
}

function NetworkSummary({ overview }: { overview: Overview | undefined }) {
  const summary = overview?.summary;
  const pending = overview?.stations.reduce((total, s) => total + s.active_alerts, 0) ?? 0;
  const communicating = summary ? summary.online + summary.with_alert : 0;
  const parts: { status: StationStatus; value: number }[] = summary
    ? [
        { status: "Online", value: summary.online },
        { status: "Com alerta", value: summary.with_alert },
        { status: "Offline", value: summary.offline },
      ]
    : [];

  return (
    <Card className="shadow-[var(--shadow-lift)]">
      <section aria-label="Resumo" className="grid divide-y divide-line md:grid-cols-[1.4fr_1fr_1fr_1fr] md:divide-x md:divide-y-0">
        {!summary ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="p-5">
              <Skeleton className="h-16" />
            </div>
          ))
        ) : (
          <>
            <div className="p-5">
              <p className="text-[13px] font-medium text-muted">Estações comunicando</p>
              <p className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{`${communicating}/${summary.total}`}</span>
                <span className="text-xs text-faint">limite de {overview?.offline_threshold_minutes} min sem dados</span>
              </p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-subtle" aria-hidden>
                {parts.map((part) =>
                  part.value > 0 ? (
                    <span
                      key={part.status}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${(part.value / summary.total) * 100}%`, background: STATUS_COLOR[part.status] }}
                    />
                  ) : null,
                )}
              </div>
            </div>
            <Metric label="Com alerta" value={summary.with_alert} hint="Online, com alerta pendente" status="Com alerta" />
            <Metric label="Offline" value={summary.offline} hint="Sem comunicação recente" status="Offline" />
            <Link href="/alertas" className="group p-5 transition-colors hover:bg-canvas/70">
              <div>
                <p className="flex items-center justify-between text-[13px] font-medium text-muted">
                  Alertas pendentes
                  <ChevronRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
                </p>
                <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">{pending}</p>
                <p className="mt-1 text-xs text-faint">Aguardando reconhecimento</p>
              </div>
            </Link>
          </>
        )}
      </section>
    </Card>
  );
}

function Metric({ label, value, hint, status }: { label: string; value: number; hint: string; status: StationStatus }) {
  return (
    <div className="p-5">
      <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
        <span className="size-2 rounded-full" style={{ background: STATUS_COLOR[status] }} aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-faint">{hint}</p>
    </div>
  );
}

function StationRow({ station }: { station: StationOverview }) {
  const temp = station.latest_readings.find((r) => r.sensor_type === "Temperatura");
  const humidity = station.latest_readings.find((r) => r.sensor_type === "Umidade");
  return (
    <li>
      <Link
        href={`/estacoes/${station.id}`}
        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas"
      >
        <StatusDot status={station.status} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink group-hover:text-brand-700">{station.name}</span>
          <span className="block truncate text-xs text-muted">{station.property_name}</span>
          {communicationDelay(station.last_communication_at) && (
            <LastCommunication lastCommunicationAt={station.last_communication_at} className="mt-0.5 text-xs" />
          )}
        </span>
        <span className="sr-only">{station.status}</span>
        <span className="text-right">
          <span className={cn("block text-sm font-semibold tabular-nums", !temp && "font-normal text-faint")}>
            {temp ? `${formatNumber(temp.value)} ${temp.unit_of_measure}` : "sem leitura"}
          </span>
          <span className="block text-xs text-faint tabular-nums">
            {humidity ? `${formatNumber(humidity.value)} % · ` : ""}
            {formatRelative(station.last_communication_at)}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden />
      </Link>
    </li>
  );
}
