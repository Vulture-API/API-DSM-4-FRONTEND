"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDateTime, formatHour, formatNumber } from "@/lib/format";

export type TrendPoint = { t: number; avg: number; min: number; max: number };

type Row = { t: number; avg: number; range: [number, number] };

/**
 * Série de um tipo de medição: linha da média e faixa sombreada entre o
 * mínimo e o máximo de cada intervalo.
 */
export function TrendChart({
  points,
  unit,
  color,
  height = 240,
  showRange = true,
}: {
  points: TrendPoint[];
  unit: string;
  color: string;
  height?: number;
  showRange?: boolean;
}) {
  const rows: Row[] = points.map((p) => ({ t: p.t * 1000, avg: p.avg, range: [p.min, p.max] }));
  const gradient = `grad-${color.replace("#", "")}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e4e2d9" strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value) => formatHour(value)}
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #e4e2d9", fontSize: 12, boxShadow: "0 8px 24px -8px rgb(0 0 0 / .15)" }}
            labelFormatter={(value) => formatDateTime(Number(value))}
            formatter={(value, name) =>
              name === "range" && Array.isArray(value)
                ? [`${formatNumber(Number(value[0]))} – ${formatNumber(Number(value[1]))} ${unit}`, "Mín – máx"]
                : [`${formatNumber(Number(value))} ${unit}`, "Média"]
            }
          />
          {showRange && (
            <Area dataKey="range" stroke="none" fill={`url(#${gradient})`} isAnimationActive={false} activeDot={false} />
          )}
          <Line dataKey="avg" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
