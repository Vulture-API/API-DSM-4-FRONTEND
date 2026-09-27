"use client";

import { useId, useState } from "react";

import { TrendChart } from "@/components/charts/TrendChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { sensorOrder, sensorVisual } from "@/features/sensor-visual";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { useSeries } from "./hooks";

const RANGES = [
  { value: "6", label: "6 h", bucket: 10 },
  { value: "24", label: "24 h", bucket: 30 },
  { value: "168", label: "7 dias", bucket: 180 },
] as const;

type Range = (typeof RANGES)[number]["value"];

/** Gráfico de histórico com escolha de período e de tipo de medição. */
export function SeriesCard({
  title,
  stationId,
  propertyId,
  defaultType = "Temperatura",
  className,
}: {
  title: string;
  stationId?: number;
  propertyId?: number | undefined;
  defaultType?: string;
  className?: string;
}) {
  const selectId = useId();
  const [range, setRange] = useState<Range>("24");
  const option = RANGES.find((r) => r.value === range)!;
  const series = useSeries({ stationId, propertyId, hours: Number(range), bucketMinutes: option.bucket });
  const types = [...(series.data?.series ?? [])].sort(
    (a, b) => sensorOrder(a.sensor_type) - sensorOrder(b.sensor_type),
  );
  const [typeId, setTypeId] = useState<number | null>(null);
  const selected =
    types.find((t) => t.sensor_type_id === typeId) ?? types.find((t) => t.sensor_type === defaultType) ?? types[0];
  const visual = sensorVisual(selected?.sensor_type ?? "");
  const last = selected?.points.at(-1);
  const low = selected?.points.length ? Math.min(...selected.points.map((p) => p.min)) : undefined;
  const high = selected?.points.length ? Math.max(...selected.points.map((p) => p.max)) : undefined;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        title={title}
        description={selected ? "Média por intervalo, com a faixa entre mínimo e máximo" : "Leituras agregadas"}
        action={<Segmented label="Período" value={range} onChange={setRange} options={RANGES.map(({ value, label }) => ({ value, label }))} />}
      />
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-4">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-10 items-center justify-center rounded-xl"
            style={{ background: visual.soft, color: visual.color }}
            aria-hidden
          >
            <visual.icon className="size-5" />
          </span>
          <div>
            <label htmlFor={selectId} className="sr-only">
              Medição exibida no gráfico
            </label>
            <Select
              id={selectId}
              className="h-9 w-56 font-medium"
              value={selected?.sensor_type_id ?? ""}
              disabled={!types.length}
              onChange={(e) => setTypeId(Number(e.target.value))}
            >
              {types.map((t) => (
                <option key={t.sensor_type_id} value={t.sensor_type_id}>
                  {t.sensor_type} ({t.unit_of_measure})
                </option>
              ))}
            </Select>
          </div>
        </div>
        {selected && last && low !== undefined && high !== undefined && (
          <dl className="flex gap-6 text-right">
            <div>
              <dt className="text-xs text-faint">Último</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatNumber(last.avg)} <span className="text-xs font-medium text-muted">{selected.unit_of_measure}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Mínimo</dt>
              <dd className="text-lg font-semibold tabular-nums text-info">{formatNumber(low)}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Máximo</dt>
              <dd className="text-lg font-semibold tabular-nums text-danger">{formatNumber(high)}</dd>
            </div>
          </dl>
        )}
      </div>
      <div className="flex-1 px-3 pt-3 pb-4">
        {series.isLoading ? (
          <Skeleton className="mx-2 h-64" />
        ) : series.error ? (
          <ErrorState message={series.error.message} onRetry={() => void series.refetch()} />
        ) : !selected ? (
          <EmptyState title="Sem leituras no período" />
        ) : (
          <>
            <p className="sr-only">
              {`Gráfico de ${selected.sensor_type} em ${option.label}: ${selected.points.length} intervalos` +
                (last && low !== undefined && high !== undefined
                  ? `, último ${formatNumber(last.avg)}, mínimo ${formatNumber(low)} e máximo ${formatNumber(high)} ${selected.unit_of_measure}.`
                  : ".")}
            </p>
            <TrendChart points={selected.points} unit={selected.unit_of_measure} color={visual.color} height={264} />
          </>
        )}
      </div>
    </Card>
  );
}
