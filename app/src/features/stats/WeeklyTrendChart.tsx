"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate, formatNumber } from "@/lib/format";

import { STAT_COLORS } from "./StationExtremesChart";

export type DailyTrendPoint = {
  t: number;
  min: number;
  avg: number;
  max: number;
};

export type WeeklyTrendChartProps = {
  points: DailyTrendPoint[];
  unit: string;
  alertValue?: number;
  alertOperator?: string;
  height?: number;
};

type Row = {
  t: number;
  dateLabel: string;
  min: number;
  avg: number;
  max: number;
};

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function WeeklyTrendChart({
  points,
  unit,
  alertValue,
  alertOperator,
  height = 290,
}: WeeklyTrendChartProps) {
  const chartData: Row[] = points.map((p) => {
    const d = new Date(p.t * 1000);
    const wday = WEEKDAY_NAMES[d.getDay()] ?? "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return {
      t: p.t,
      dateLabel: `${wday}, ${day}/${month}`,
      min: p.min,
      avg: p.avg,
      max: p.max,
    };
  });

  const allVals: number[] = [];
  for (const p of points) {
    allVals.push(p.min, p.avg, p.max);
  }
  if (alertValue !== undefined) {
    allVals.push(alertValue);
  }

  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const rawMax = allVals.length ? Math.max(...allVals) : 100;
  const padding = Math.max(1, (rawMax - rawMin) * 0.15);
  const yMin = rawMin >= 0 ? Math.max(0, Math.floor(rawMin - padding)) : Math.floor(rawMin - padding);
  const yMax = Math.ceil(rawMax + padding);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: -10 }}>
          <CartesianGrid vertical={false} stroke="#e4e2d9" strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[yMin, yMax]}
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
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as Row | undefined;
              if (!item) return "";
              return `${item.dateLabel} (${formatDate(item.t * 1000)})`;
            }}
            formatter={(value, name) => {
              const label =
                name === "min"
                  ? "Mínimo"
                  : name === "avg"
                    ? "Média"
                    : "Máximo";
              return [`${formatNumber(Number(value))} ${unit}`, label];
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={(value) => {
              const label =
                value === "min"
                  ? "Mínimo"
                  : value === "avg"
                    ? "Média"
                    : "Máximo";
              return <span className="font-medium text-ink">{label}</span>;
            }}
          />

          {alertValue !== undefined && (
            <ReferenceLine
              y={alertValue}
              stroke={STAT_COLORS.max}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Alerta (${alertOperator ?? "≥"} ${formatNumber(alertValue)} ${unit})`,
                position: "insideTopRight",
                fill: STAT_COLORS.max,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}

          {/* Mínimo (Azul) */}
          <Line
            type="monotone"
            dataKey="min"
            stroke={STAT_COLORS.min}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: STAT_COLORS.min, stroke: "#ffffff", strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={false}
          />

          {/* Média (Verde) */}
          <Line
            type="monotone"
            dataKey="avg"
            stroke={STAT_COLORS.avg}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: STAT_COLORS.avg, stroke: "#ffffff", strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={false}
          />

          {/* Máximo (Vermelho) */}
          <Line
            type="monotone"
            dataKey="max"
            stroke={STAT_COLORS.max}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: STAT_COLORS.max, stroke: "#ffffff", strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
