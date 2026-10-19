"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber } from "@/lib/format";

/** Paleta semântica fixa do sistema AgriTech para estatísticas */
export const STAT_COLORS = {
  min: "#2f6fb3", // Azul Info (Mínimo / Piso)
  avg: "#2f8050", // Verde Brand-500 (Média / Equilíbrio)
  max: "#d8452f", // Vermelho Terracota (Máximo / Pico)
} as const;

export type StationSensorStat = {
  stationId: number;
  stationName: string;
  propertyName?: string;
  min: number;
  avg: number;
  max: number;
  stddev: number | null;
  count: number;
};

export type StationExtremesChartProps = {
  data: StationSensorStat[];
  unit: string;
  networkAvg?: number;
  height?: number;
};

export function StationExtremesChart({
  data,
  unit,
  networkAvg,
  height = 310,
}: StationExtremesChartProps) {
  const rows = data.map((d) => ({
    ...d,
    shortName: d.stationName.replace(/^Estação\s+/i, ""),
  }));

  const allVals = data.flatMap((d) => [d.min, d.max]);
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 100;
  const padding = Math.max(1, (maxVal - minVal) * 0.15);
  const yMin = minVal >= 0 ? Math.max(0, Math.floor(minVal - padding)) : Math.floor(minVal - padding);
  const yMax = Math.ceil(maxVal + padding);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 16, bottom: 4, left: -10 }} barGap={3}>
          <CartesianGrid vertical={false} stroke="#e4e2d9" strokeDasharray="3 3" />
          <XAxis
            dataKey="shortName"
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            width={52}
            domain={[yMin, yMax]}
            tickFormatter={(v) => formatNumber(v)}
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
              const item = payload?.[0]?.payload as StationSensorStat | undefined;
              if (!item) return "";
              return `${item.stationName}${item.propertyName ? ` · ${item.propertyName}` : ""} (${item.count.toLocaleString("pt-BR")} leituras)`;
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
          <Bar dataKey="min" fill={STAT_COLORS.min} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
          <Bar dataKey="avg" fill={STAT_COLORS.avg} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
          <Bar dataKey="max" fill={STAT_COLORS.max} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
          {networkAvg !== undefined && (
            <ReferenceLine
              y={networkAvg}
              stroke="#ffffff"
              strokeWidth={4}
              ifOverflow="extendDomain"
            />
          )}
          {networkAvg !== undefined && (
            <ReferenceLine
              y={networkAvg}
              stroke="#18201a"
              strokeDasharray="6 4"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={({ viewBox }: { viewBox?: { x?: number; y?: number; width?: number } }) => {
                const x = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) - 8;
                const y = (viewBox?.y ?? 0) - 10;
                const text = `Média geral: ${formatNumber(networkAvg)} ${unit}`;
                const boxWidth = text.length * 6.4 + 14;
                return (
                  <g>
                    <rect
                      x={x - boxWidth}
                      y={y - 11}
                      width={boxWidth}
                      height={20}
                      rx={6}
                      fill="#18201a"
                    />
                    <text
                      x={x - boxWidth / 2}
                      y={y + 3}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={600}
                    >
                      {text}
                    </text>
                  </g>
                );
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
