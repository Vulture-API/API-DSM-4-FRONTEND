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

import { formatDateTime, formatHour, formatNumber } from "@/lib/format";

import { STAT_COLORS } from "./StationExtremesChart";

export type ThresholdRule = {
  id: number;
  referenceValue: number;
  operator: string;
  message?: string | null;
  stationName?: string;
};

export type AlertSeriesPoint = {
  t: number;
  avg: number;
  min: number;
  max: number;
};

export function isThresholdViolated(value: number, rule?: ThresholdRule | null): boolean {
  if (!rule) return false;
  switch (rule.operator) {
    case ">":
      return value > rule.referenceValue;
    case ">=":
    case "≥":
      return value >= rule.referenceValue;
    case "<":
      return value < rule.referenceValue;
    case "<=":
    case "≤":
      return value <= rule.referenceValue;
    case "=":
    case "==":
      return value === rule.referenceValue;
    default:
      return value > rule.referenceValue;
  }
}

export type AlertThresholdChartProps = {
  points: AlertSeriesPoint[];
  unit: string;
  hours: number;
  periodAvg?: number;
  rule?: ThresholdRule | null;
  height?: number;
};

export function AlertThresholdChart({
  points,
  unit,
  hours,
  periodAvg,
  rule,
  height = 290,
}: AlertThresholdChartProps) {
  const chartData = points.map((p) => ({
    t: p.t * 1000,
    avg: p.avg,
    min: p.min,
    max: p.max,
    violated: isThresholdViolated(p.avg, rule),
  }));

  const allVals: number[] = points.map((p) => p.avg);
  if (periodAvg !== undefined) allVals.push(periodAvg);
  if (rule) allVals.push(rule.referenceValue);

  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const rawMax = allVals.length ? Math.max(...allVals) : 100;
  const pad = Math.max(1, (rawMax - rawMin) * 0.18);
  const yMin = rawMin >= 0 ? Math.max(0, Math.floor(rawMin - pad)) : Math.floor(rawMin - pad);
  const yMax = Math.ceil(rawMax + pad);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 14, right: 16, bottom: 4, left: -10 }}>
          <CartesianGrid vertical={false} stroke="#e4e2d9" strokeDasharray="3 3" />

          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 11, fill: "#636a64" }}
            tickLine={false}
            axisLine={false}
            minTickGap={45}
            tickFormatter={(value) => {
              const ms = Number(value);
              return hours > 48 ? formatDateTime(ms) : formatHour(ms);
            }}
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
            labelFormatter={(value) => formatDateTime(Number(value))}
            formatter={(value, _name, item) => {
              const num = Number(value);
              const payload = item?.payload as { violated?: boolean; min?: number; max?: number } | undefined;
              const status = payload?.violated ? " (Acima do limite)" : "";
              return [`${formatNumber(num)} ${unit}${status}`, "Leitura"];
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={() => (
              <span className="inline-flex items-center gap-4 font-medium text-ink">
                <span>Leitura no tempo</span>
                {periodAvg !== undefined && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-0.5 w-3.5"
                      style={{ backgroundColor: STAT_COLORS.avg }}
                    />
                    Média ({formatNumber(periodAvg)} {unit})
                  </span>
                )}
                {rule && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-0.5 w-3.5"
                      style={{ backgroundColor: STAT_COLORS.max }}
                    />
                    Limite ({rule.operator} {formatNumber(rule.referenceValue)} {unit})
                  </span>
                )}
              </span>
            )}
          />

          {/* Linha Azul: Leitura contínua no tempo (com pontos vermelhos quando viola o alerta) */}
          <Line
            type="monotone"
            dataKey="avg"
            stroke={STAT_COLORS.min}
            strokeWidth={2.5}
            connectNulls
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; payload?: { violated?: boolean; t?: number } }) => {
              const { cx, cy, payload } = props;
              if (cx === undefined || cy === undefined) return <g key="empty" />;
              const violated = Boolean(payload?.violated);
              return (
                <circle
                  key={payload?.t ?? `${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={violated ? 5 : 3}
                  fill={violated ? STAT_COLORS.max : STAT_COLORS.min}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 5.5, fill: STAT_COLORS.min, stroke: "#ffffff", strokeWidth: 2 }}
          />

          {/* Linha Verde: Média do período */}
          {periodAvg !== undefined && (
            <ReferenceLine
              y={periodAvg}
              stroke={STAT_COLORS.avg}
              strokeDasharray="5 4"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={({ viewBox }: { viewBox?: { x?: number; y?: number } }) => {
                const x = (viewBox?.x ?? 0) + 8;
                const y = (viewBox?.y ?? 0) - 10;
                const text = `Média: ${formatNumber(periodAvg)} ${unit}`;
                const boxWidth = text.length * 6.3 + 14;
                return (
                  <g>
                    <rect
                      x={x}
                      y={y - 11}
                      width={boxWidth}
                      height={20}
                      rx={6}
                      fill={STAT_COLORS.avg}
                    />
                    <text
                      x={x + boxWidth / 2}
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

          {/* Linha Vermelha: Limite de alerta cadastrado no banco (alert_configs) */}
          {rule && (
            <ReferenceLine
              y={rule.referenceValue}
              stroke={STAT_COLORS.max}
              strokeDasharray="6 4"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={({ viewBox }: { viewBox?: { x?: number; y?: number; width?: number } }) => {
                const x = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) - 8;
                const y = (viewBox?.y ?? 0) - 10;
                const text = `Limite: ${rule.operator} ${formatNumber(rule.referenceValue)} ${unit}`;
                const boxWidth = text.length * 6.3 + 14;
                return (
                  <g>
                    <rect
                      x={x - boxWidth}
                      y={y - 11}
                      width={boxWidth}
                      height={20}
                      rx={6}
                      fill={STAT_COLORS.max}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
