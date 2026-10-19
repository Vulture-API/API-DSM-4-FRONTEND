"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber } from "@/lib/format";

import { STAT_COLORS } from "./StationExtremesChart";

export type ThresholdRule = {
  id: number;
  referenceValue: number;
  operator: string;
  message?: string | null;
  stationName?: string;
};

export type HourlyComparisonPoint = {
  hour: number;
  label: string;
  recent24h: number | null;
  avg7d: number | null;
};

/**
 * Consolida os dados do banco por hora do dia (00:00 a 23:00), comparando
 * o comportamento recente (Últimas 24 h - Azul) com a Média Histórica de
 * 7 dias (Verde).
 */
export function buildHourlyComparison(
  points24h: { t: number; avg: number; min: number; max: number }[],
  points7d: { t: number; avg: number; min: number; max: number }[],
): HourlyComparisonPoint[] {
  const map24 = new Map<number, number[]>();
  const map7d = new Map<number, number[]>();

  for (const p of points24h) {
    const h = new Date(p.t * 1000).getHours();
    const list = map24.get(h) ?? [];
    list.push(p.avg);
    map24.set(h, list);
  }

  for (const p of points7d) {
    const h = new Date(p.t * 1000).getHours();
    const list = map7d.get(h) ?? [];
    list.push(p.avg);
    map7d.set(h, list);
  }

  const rows: HourlyComparisonPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const vals24 = map24.get(h);
    const vals7d = map7d.get(h);
    if (!vals24?.length && !vals7d?.length) continue;

    const recent24h = vals24?.length
      ? Number((vals24.reduce((a, b) => a + b, 0) / vals24.length).toFixed(2))
      : null;
    const avg7d = vals7d?.length
      ? Number((vals7d.reduce((a, b) => a + b, 0) / vals7d.length).toFixed(2))
      : null;

    rows.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      recent24h,
      avg7d,
    });
  }

  return rows;
}

export type SafeZoneChartProps = {
  points24h: { t: number; avg: number; min: number; max: number }[];
  points7d: { t: number; avg: number; min: number; max: number }[];
  unit: string;
  rule?: ThresholdRule | null;
  height?: number;
};

export function SafeZoneChart({
  points24h,
  points7d,
  unit,
  rule,
  height = 280,
}: SafeZoneChartProps) {
  const chartData = buildHourlyComparison(points24h, points7d);

  const allVals = chartData.flatMap((d) => {
    const arr: number[] = [];
    if (d.recent24h !== null) arr.push(d.recent24h);
    if (d.avg7d !== null) arr.push(d.avg7d);
    if (rule) arr.push(rule.referenceValue);
    return arr;
  });

  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const rawMax = allVals.length ? Math.max(...allVals) : 100;
  const pad = Math.max(1, (rawMax - rawMin) * 0.15);
  const minBound = rawMin >= 0 ? Math.max(0, Math.floor(rawMin - pad)) : Math.floor(rawMin - pad);
  const maxBound = Math.ceil(rawMax + pad);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: -10 }}>
          <CartesianGrid vertical={false} stroke="#e4e2d9" strokeDasharray="3 3" />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[minBound, maxBound]}
            tickFormatter={(value) => formatNumber(value)}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e4e2d9",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(0 0 0 / .15)",
              backgroundColor: "var(--surface, #ffffff)",
            }}
            labelFormatter={(label) => `Horário: ${label}`}
            formatter={(value, name) => {
              if (name === "recent24h") {
                return [`${formatNumber(Number(value))} ${unit}`, "Últimas 24 h"];
              }
              if (name === "avg7d") {
                return [`${formatNumber(Number(value))} ${unit}`, "Média 7 dias"];
              }
              return [`${formatNumber(Number(value))} ${unit}`, String(name)];
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={(value) => {
              if (value === "recent24h") {
                return <span className="font-medium text-ink">Últimas 24 h</span>;
              }
              if (value === "avg7d") {
                return <span className="font-medium text-ink">Média 7 dias</span>;
              }
              return <span className="font-medium text-ink">{value}</span>;
            }}
          />

          {/* Linha Vermelha: Limite de Alerta cadastrado no banco (alert_configs) */}
          {rule && (
            <ReferenceLine
              y={rule.referenceValue}
              stroke={STAT_COLORS.max}
              strokeDasharray="5 4"
              strokeWidth={2}
              label={{
                value: `Alerta (${rule.operator} ${formatNumber(rule.referenceValue)} ${unit})`,
                position: "insideTopRight",
                fill: STAT_COLORS.max,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}

          {/* Linha Azul: Comportamento nas últimas 24 h */}
          <Line
            type="monotone"
            dataKey="recent24h"
            stroke={STAT_COLORS.min}
            strokeWidth={2.5}
            connectNulls
            dot={{ r: 3.5, fill: STAT_COLORS.min, stroke: "#ffffff", strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={false}
          />

          {/* Linha Verde: Média Histórica de 7 dias naquele horário */}
          <Line
            type="monotone"
            dataKey="avg7d"
            stroke={STAT_COLORS.avg}
            strokeWidth={2.5}
            strokeDasharray="4 3"
            connectNulls
            dot={{ r: 3.5, fill: STAT_COLORS.avg, stroke: "#ffffff", strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
