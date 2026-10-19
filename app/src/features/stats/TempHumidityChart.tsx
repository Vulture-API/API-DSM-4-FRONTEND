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

export type TempHumidityPoint = {
  t: number;
  temp: number | null;
  humidity: number | null;
};

export type TempHumidityChartProps = {
  points: TempHumidityPoint[];
  hours: number;
  height?: number;
};

export function TempHumidityChart({
  points,
  hours,
  height = 290,
}: TempHumidityChartProps) {
  const chartData = points.map((p) => ({
    t: p.t * 1000,
    temp: p.temp,
    humidity: p.humidity,
  }));

  const temps = points.map((p) => p.temp).filter((v): v is number => v !== null);
  const hums = points.map((p) => p.humidity).filter((v): v is number => v !== null);

  const rawTempMin = temps.length ? Math.min(...temps) : 10;
  const rawTempMax = temps.length ? Math.max(...temps) : 40;
  const tempPadding = Math.max(2, (rawTempMax - rawTempMin) * 0.15);
  const tempMin = Math.floor(rawTempMin - tempPadding);
  const tempMax = Math.ceil(rawTempMax + tempPadding);

  const rawHumMin = hums.length ? Math.min(...hums) : 20;
  const rawHumMax = hums.length ? Math.max(...hums) : 95;
  const humMin = Math.max(0, Math.floor(rawHumMin - 5));
  const humMax = Math.min(100, Math.ceil(rawHumMax + 5));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: -10 }}>
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
          {/* Eixo da Esquerda: Temperatura (°C) */}
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#d9582b" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[tempMin, tempMax]}
            tickFormatter={(v) => `${formatNumber(v)}°`}
          />
          {/* Eixo da Direita: Umidade (%) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#2f6fb3" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[humMin, humMax]}
            tickFormatter={(v) => `${formatNumber(v)}%`}
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
            formatter={(value, name) => {
              if (name === "temp") {
                return [`${formatNumber(Number(value))} °C`, "Temperatura"];
              }
              if (name === "humidity") {
                return [`${formatNumber(Number(value))} %`, "Umidade do Ar"];
              }
              return [String(value), String(name)];
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={(value) => {
              const label =
                value === "temp"
                  ? "Temperatura (°C)"
                  : "Umidade do Ar (%)";
              return <span className="font-medium text-ink">{label}</span>;
            }}
          />

          {/* Linha de referência de 30% de umidade (zona de alerta crítico de seca) */}
          <ReferenceLine
            yAxisId="right"
            y={30}
            stroke="#d8452f"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: "Alerta de seca: 30%",
              position: "insideBottomRight",
              fill: "#d8452f",
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* Linha de Temperatura (°C) em Laranja Terracota */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temp"
            stroke="#d9582b"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "#d9582b", stroke: "#ffffff", strokeWidth: 1 }}
            activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />

          {/* Linha de Umidade (%) em Azul Info */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            stroke="#2f6fb3"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "#2f6fb3", stroke: "#ffffff", strokeWidth: 1 }}
            activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
